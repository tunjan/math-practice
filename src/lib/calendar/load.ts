import "server-only"

import type { SessionProfile } from "@/lib/auth/session"
import { asStage, assignmentStatus } from "@/lib/assignments/model"
import type { createClient } from "@/lib/supabase/server"
import { toTopicTags } from "@/lib/syllabus/model"

import {
  addDays,
  dayKeyOf,
  firstOfMonth,
  isDayKey,
  isMonthKey,
  monthGrid,
  monthOf,
  startOfDay,
  type DayKey,
  type MonthKey,
} from "./dates"
import type { CalendarItem, Person } from "./model"

type Supabase = Awaited<ReturnType<typeof createClient>>

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type CalendarQuery = {
  month: MonthKey
  /** The day the panel opens on. */
  selected: DayKey
  today: DayKey
  /** Tutor only: narrow everything to one student. */
  studentId: string | null
}

/**
 * Reads `?month=2026-09&day=2026-09-18&student=<id>` into a query, falling
 * back to today. A bad value is ignored rather than rejected, so an old or
 * hand-edited link still opens the calendar.
 */
export function parseCalendarQuery(
  params: Record<string, string | string[] | undefined>,
  timeZone: string,
  now: Date = new Date()
): CalendarQuery {
  const one = (key: string) => {
    const value = params[key]
    return Array.isArray(value) ? value[0] : value
  }

  const today = dayKeyOf(now, timeZone)
  const day = one("day")
  const monthParam = one("month")
  const student = one("student")

  const month = isMonthKey(monthParam) ? monthParam : isDayKey(day) ? monthOf(day) : monthOf(today)
  const selected =
    isDayKey(day) && monthOf(day) === month
      ? day
      : monthOf(today) === month
        ? today
        : firstOfMonth(month)

  return {
    month,
    selected,
    today,
    studentId: student && UUID.test(student) ? student : null,
  }
}

/**
 * Everything the month view shows: deadlines from assignments and events from
 * the calendar, for every day in the grid. RLS decides what each person may
 * see; the queries only narrow it to the window.
 */
export async function loadCalendarItems(
  supabase: Supabase,
  profile: SessionProfile,
  query: CalendarQuery,
  now: Date = new Date()
): Promise<CalendarItem[]> {
  const weeks = monthGrid(query.month)
  // One day of slack each side: all-day events are pinned to UTC midnights,
  // which can sit either side of the viewer's own midnight.
  const from = startOfDay(addDays(weeks[0]![0]!, -1), profile.timezone).toISOString()
  const to = startOfDay(addDays(weeks.at(-1)!.at(-1)!, 2), profile.timezone).toISOString()

  const isTutor = profile.role === "tutor"

  let deadlines = supabase
    .from("assignments")
    .select(
      `id, title, type, due_at, stage, verdict, student_id,
       assignment_topics(syllabus_topics(code, title, topic, subtopic)),
       profiles!assignments_student_id_fkey(full_name, email)`
    )
    .gte("due_at", from)
    .lt("due_at", to)
    .order("due_at")

  let events = supabase
    .from("calendar_events")
    .select(
      `id, owner_id, shared_with, kind, title, notes, all_day, starts_at, ends_at,
       owner:profiles!calendar_events_owner_id_fkey(full_name),
       recipient:profiles!calendar_events_shared_with_fkey(full_name)`
    )
    .lt("starts_at", to)
    .gt("ends_at", from)
    .order("starts_at")

  if (isTutor && query.studentId) {
    deadlines = deadlines.eq("student_id", query.studentId)
    events = events.or(`owner_id.eq.${query.studentId},shared_with.eq.${query.studentId}`)
  } else if (!isTutor) {
    deadlines = deadlines.eq("student_id", profile.id)
  }

  const [{ data: tasks }, { data: rows }] = await Promise.all([deadlines, events])

  const items: CalendarItem[] = []

  for (const task of tasks ?? []) {
    const stage = asStage(task.stage)
    const handedIn = stage === "submitted" || stage === "reviewed"
    const overdue = !handedIn && new Date(task.due_at) < now
    items.push({
      type: "deadline",
      id: task.id,
      title: task.title,
      dueAt: task.due_at,
      href: isTutor ? `/tutor/assignments/${task.id}` : `/student/tasks/${task.id}`,
      taskType: task.type,
      status: assignmentStatus(stage, task.verdict, overdue),
      person: isTutor
        ? task.profiles?.full_name || task.profiles?.email || "Unknown student"
        : null,
      topics: toTopicTags(task.assignment_topics),
    })
  }

  for (const row of rows ?? []) {
    const mine = row.owner_id === profile.id
    // A student cannot read the tutor's profile, so the name comes back empty.
    const otherSide = isTutor ? "a student" : "your tutor"
    items.push({
      type: "event",
      id: row.id,
      title: row.title,
      kind: row.kind,
      notes: row.notes,
      allDay: row.all_day,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      mine,
      sharedWith:
        mine && row.shared_with
          ? { id: row.shared_with, name: row.recipient?.full_name || capitalise(otherSide) }
          : null,
      from: mine ? null : row.owner?.full_name || otherSide,
    })
  }

  return items
}

/** The tutor's roster, for the filter and for sharing an event. */
export async function loadStudents(supabase: Supabase): Promise<Person[]> {
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "student")
    .order("full_name")
  return (data ?? []).map((s) => ({ id: s.id, name: s.full_name || s.email || "Unnamed student" }))
}

export function calendarFeedUrl(token: string): string {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  return `${origin}/api/calendar/${token}.ics`
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
