import { NextResponse, type NextRequest } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { buildCalendar, type CalendarEvent } from "@/lib/calendar/ics"
import { EVENT_KIND_LABEL } from "@/lib/calendar/model"
import { TYPE_LABEL } from "@/lib/assignments/model"
import { dayKeyOf, utcDayKey } from "@/lib/calendar/dates"
import { toTopicTags } from "@/lib/syllabus/model"

/**
 * A subscribable calendar feed: /api/calendar/<token>.ics
 *
 * Calendar clients fetch this on a schedule with no cookies and no way to sign
 * in, so the token in the path IS the credential. It is an unguessable uuid
 * held only by its owner, rotatable without touching their password, and it
 * grants read access to nothing but what their own calendar page shows:
 * deadlines, their own events, and events shared with them.
 *
 * Worth being clear-eyed about the trade: subscribing in Google Calendar means
 * Google's servers fetch this URL, so titles leave our infrastructure. That is
 * inherent to calendar subscription, and the UI says so where the link is
 * offered.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Old history is noise in a phone calendar and makes every poll heavier. */
const HISTORY_DAYS = 180

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/calendar/[token]">
) {
  const { token } = await params

  // Clients like the .ics extension; the token is the part before it.
  const calendarToken = token.replace(/\.ics$/i, "")

  if (!UUID.test(calendarToken)) {
    return new NextResponse("Not found", { status: 404 })
  }

  // No session exists on this request, so the service role does the lookup and
  // the query itself is the authorisation: the token must match a profile, and
  // every query below is scoped to that profile explicitly, because RLS is not
  // there to do it.
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, role, timezone")
    .eq("calendar_token", calendarToken)
    .maybeSingle()

  if (!profile) {
    return new NextResponse("Not found", { status: 404 })
  }

  const isTutor = profile.role === "tutor"
  const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString()

  const [{ data: assignments }, { data: calendarEvents }] = await Promise.all([
    admin
      .from("assignments")
      .select(
        `id, title, type, due_at, updated_at, verdict, categories(name),
         assignment_topics(syllabus_topics(code, title, topic, subtopic)),
         profiles!assignments_student_id_fkey(full_name)`
      )
      .eq(isTutor ? "tutor_id" : "student_id", profile.id)
      .gte("due_at", since)
      .order("due_at", { ascending: true }),
    admin
      .from("calendar_events")
      .select(
        `id, owner_id, kind, title, notes, all_day, starts_at, ends_at, updated_at,
         owner:profiles!calendar_events_owner_id_fkey(full_name)`
      )
      .or(`owner_id.eq.${profile.id},shared_with.eq.${profile.id}`)
      .gte("ends_at", since)
      .order("starts_at", { ascending: true }),
  ])

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  const home = isTutor ? "/tutor" : "/student"

  const deadlines: CalendarEvent[] = (assignments ?? []).map((assignment) => {
    const due = new Date(assignment.due_at)
    // A deadline is a moment, but a zero-length event renders as a sliver or
    // not at all. Show the half hour leading up to it instead.
    const start = new Date(due.getTime() - 30 * 60 * 1000)
    const approved = assignment.verdict === "approved"
    const student = isTutor ? assignment.profiles?.full_name : undefined

    const parts = [
      TYPE_LABEL[assignment.type],
      assignment.categories?.name,
      toTopicTags(assignment.assignment_topics).map((t) => t.code).join(", ") || undefined,
      approved ? "Approved" : undefined,
    ].filter(Boolean)

    return {
      uid: `${assignment.id}@maths-tasks`,
      start,
      end: due,
      summary: `${approved ? "✓ " : ""}${assignment.title}${student ? ` (${student})` : ""}`,
      description: parts.join(" · "),
      url: isTutor
        ? `${origin}/tutor/assignments/${assignment.id}`
        : `${origin}/student/tasks/${assignment.id}`,
      // Seconds since epoch of the last edit: monotonic, so clients always
      // treat a re-fetched event as newer.
      sequence: Math.floor(new Date(assignment.updated_at).getTime() / 1000),
      // The tutor sets deadlines rather than meeting them; only students get
      // a day's warning.
      alarmMinutesBefore: approved || isTutor ? undefined : 60 * 24,
    }
  })

  const events: CalendarEvent[] = (calendarEvents ?? []).map((event) => {
    const mine = event.owner_id === profile.id
    const from = mine ? null : event.owner?.full_name || (isTutor ? "A student" : "Your tutor")
    const description = [EVENT_KIND_LABEL[event.kind], from ? `From ${from}` : null, event.notes]
      .filter(Boolean)
      .join("\n")

    const day = event.all_day
      ? utcDayKey(event.starts_at)
      : dayKeyOf(event.starts_at, profile.timezone)

    return {
      uid: `event-${event.id}@maths-tasks`,
      start: new Date(event.starts_at),
      end: new Date(event.ends_at),
      allDay: event.all_day,
      summary: event.title,
      description,
      url: `${origin}${home}/calendar?day=${day}`,
      sequence: Math.floor(new Date(event.updated_at).getTime() / 1000),
    }
  })

  const body = buildCalendar({
    name: `Maths Tasks: ${profile.full_name || (isTutor ? "tutor" : "deadlines")}`,
    description: isTutor
      ? "Deadlines you've set and your calendar events."
      : "Deadlines from your tutor and your calendar events.",
    events: [...deadlines, ...events],
  })

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="maths-tasks.ics"',
      // Never let a shared cache hold one person's feed.
      "Cache-Control": "private, max-age=300",
    },
  })
}
