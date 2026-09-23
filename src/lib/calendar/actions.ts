"use server"

import { revalidatePath } from "next/cache"

import { requireProfile } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

import {
  addDays,
  daysBetween,
  isDayKey,
  isTime,
  utcMidnight,
  zonedToInstant,
} from "./dates"
import { EVENT_KINDS, type EventKind } from "./model"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type EventFormState = {
  error?: string
  saved?: { id: string; title: string; created: boolean }
}

/**
 * Creates or updates one of the signed-in person's own events.
 *
 * Times arrive as wall-clock values ("2026-09-18", "16:30") and are read in
 * the person's profile timezone, the same clock the month grid is drawn in,
 * so an event lands on the day it was added to whatever the browser's zone.
 *
 * Sharing is checked twice: here for a readable message, and by the insert
 * policy (private.can_share_event_with) as the actual boundary.
 */
export async function saveEvent(
  _prev: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const profile = await requireProfile()

  const eventId = String(formData.get("event_id") ?? "")
  const title = String(formData.get("title") ?? "").trim()
  const notes = String(formData.get("notes") ?? "").trim()
  const kind = String(formData.get("kind") ?? "other") as EventKind
  const allDay = formData.get("all_day") === "on"
  const date = String(formData.get("date") ?? "")
  const endDate = String(formData.get("end_date") ?? "") || date
  const startTime = String(formData.get("start_time") ?? "")
  const endTime = String(formData.get("end_time") ?? "")
  const share = String(formData.get("share") ?? "")

  if (eventId && !UUID.test(eventId)) return { error: "That event no longer exists." }
  if (!title) return { error: "Give the event a title." }
  if (title.length > 200) return { error: "That title is too long." }
  if (notes.length > 2000) return { error: "Notes can be up to 2,000 characters." }
  if (!EVENT_KINDS.includes(kind)) return { error: "Pick what kind of event this is." }
  if (!isDayKey(date)) return { error: "Pick a date." }

  let startsAt: string
  let endsAt: string
  if (allDay) {
    if (!isDayKey(endDate)) return { error: "Pick the last day." }
    const span = daysBetween(date, endDate)
    if (span < 0) return { error: "The last day can't be before the first." }
    if (span > 30) return { error: "An event can run for 31 days at most." }
    startsAt = utcMidnight(date)
    endsAt = utcMidnight(addDays(endDate, 1))
  } else {
    if (!isTime(startTime) || !isTime(endTime)) return { error: "Pick a start and end time." }
    const start = zonedToInstant(date, startTime, profile.timezone)
    const end = zonedToInstant(date, endTime, profile.timezone)
    if (end <= start) return { error: "The end time must be after the start." }
    startsAt = start.toISOString()
    endsAt = end.toISOString()
  }

  let sharedWith: string | null = null
  if (profile.role === "tutor") {
    if (share && !UUID.test(share)) return { error: "Choose who can see this." }
    sharedWith = share || null
  } else if (share === "tutor") {
    sharedWith = await findTutorId()
    if (!sharedWith) return { error: "There's no tutor to share this with yet." }
  }

  const supabase = await createClient()
  const row = {
    title,
    notes: notes || null,
    kind,
    all_day: allDay,
    starts_at: startsAt,
    ends_at: endsAt,
    shared_with: sharedWith,
  }

  if (eventId) {
    const { data, error } = await supabase
      .from("calendar_events")
      .update(row)
      .eq("id", eventId)
      .eq("owner_id", profile.id)
      .select("id")
    if (error) return { error: friendly(error.message) }
    if (!data?.length) return { error: "That event no longer exists." }
    revalidateCalendar(profile.role)
    return { saved: { id: eventId, title, created: false } }
  }

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({ ...row, owner_id: profile.id })
    .select("id")
    .single()
  if (error) return { error: friendly(error.message) }

  revalidateCalendar(profile.role)
  return { saved: { id: data.id, title, created: true } }
}

export type DeleteEventState = { error?: string; deleted?: boolean }

export async function deleteEvent(
  _prev: DeleteEventState,
  formData: FormData
): Promise<DeleteEventState> {
  const profile = await requireProfile()
  const eventId = String(formData.get("event_id") ?? "")
  if (!UUID.test(eventId)) return { error: "That event no longer exists." }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
    .eq("owner_id", profile.id)
    .select("id")

  if (error) return { error: error.message }
  if (!data?.length) return { error: "That event no longer exists." }

  revalidateCalendar(profile.role)
  return { deleted: true }
}

export type ResetLinkState = { error?: string; feedUrl?: string }

/**
 * Issues a new feed token, which kills every existing subscription to the old
 * link. The profile guard only lets the service role write this column, so
 * the admin client does it, scoped to the caller's own row.
 */
export async function resetCalendarLink(): Promise<ResetLinkState> {
  const profile = await requireProfile()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("profiles")
    .update({ calendar_token: crypto.randomUUID() })
    .eq("id", profile.id)
    .select("calendar_token")
    .single()

  if (error) return { error: "Couldn't reset the link. Please try again." }

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  revalidateCalendar(profile.role)
  return { feedUrl: `${origin}/api/calendar/${data.calendar_token}.ics` }
}

/**
 * The tutor's id, for a student sharing an event. Students cannot read the
 * tutor's profile, so this is looked up with the service role; it reveals an
 * id and nothing else, and only to a signed-in student.
 */
async function findTutorId(): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "tutor")
    .order("created_at")
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}

function friendly(message: string): string {
  if (message.includes("row-level security")) return "You can't share this event with that person."
  if (message.includes("calendar_events_span")) return "An event can run for 31 days at most."
  return message
}

function revalidateCalendar(role: "tutor" | "student") {
  revalidatePath(`/${role}/calendar`)
}
