import "server-only"

import type { SessionProfile } from "@/lib/auth/session"
import { asStage, assignmentStatus } from "@/lib/assignments/model"
import type { createClient } from "@/lib/supabase/server"
import { toTopicTags, type Course, type Level, type SyllabusLevel } from "@/lib/syllabus/model"

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
import { weekPlans, type CalendarItem, type Person, type PlannedTopic, type WeekPlan } from "./model"

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
 * Everything the month view shows: deadlines from assignments, exams, and
 * events from the calendar, for every day in the grid. RLS decides what each person may
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

  let exams = supabase
    .from("exams")
    .select(
      `id, title, exam_date, percent, ib_grade, student_id,
       exam_topics(syllabus_topics(code, title, topic, subtopic)),
       profiles(full_name, email)`
    )
    .gte("exam_date", weeks[0]![0]!)
    .lte("exam_date", weeks.at(-1)!.at(-1)!)
    .order("exam_date")

  if (isTutor && query.studentId) {
    deadlines = deadlines.eq("student_id", query.studentId)
    events = events.or(`owner_id.eq.${query.studentId},shared_with.eq.${query.studentId}`)
    exams = exams.eq("student_id", query.studentId)
  } else if (!isTutor) {
    deadlines = deadlines.eq("student_id", profile.id)
    exams = exams.eq("student_id", profile.id)
  }

  const [{ data: tasks }, { data: rows }, { data: examRows }] = await Promise.all([deadlines, events, exams])

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

  for (const exam of examRows ?? []) {
    items.push({
      type: "exam",
      id: exam.id,
      title: exam.title,
      date: exam.exam_date,
      percent: exam.percent === null ? null : Number(exam.percent),
      ibGrade: exam.ib_grade,
      topics: toTopicTags(exam.exam_topics),
      person: isTutor ? exam.profiles?.full_name || exam.profiles?.email || "Unknown student" : null,
      href: isTutor ? `/tutor/students/${exam.student_id}` : "/student/syllabus",
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

/** Tracker rows with a planned window, with what a week bar needs. */
export const PLANNED_TOPICS_SELECT =
  "student_id, planned_start, planned_end, updated_at, syllabus_topics(course, level, code, title, topic, subtopic), profiles(full_name, email, course, level)"

type PlannedRow = {
  student_id: string
  planned_start: string | null
  planned_end: string | null
  updated_at: string
  syllabus_topics: {
    course: Course
    level: SyllabusLevel
    code: string
    title: string
    topic: number
    subtopic: number
  } | null
  profiles: { full_name: string; email: string | null; course: Course | null; level: Level | null } | null
}

/**
 * Reads planned tracker rows; the student's name only matters to the tutor.
 * Rows left over from a course the student is no longer on are dropped, as
 * the tracker drops them.
 */
export function toPlannedTopics(rows: PlannedRow[] | null, withPerson: boolean): PlannedTopic[] {
  return (rows ?? []).flatMap((row) => {
    const topic = row.syllabus_topics
    const student = row.profiles
    if (!topic || !student || topic.course !== student.course) return []
    if (topic.level === "AHL" && student.level !== "HL") return []
    return [
      {
        studentId: row.student_id,
        person: withPerson ? student.full_name || student.email || "Unknown student" : null,
        tag: { code: topic.code, title: topic.title, topic: topic.topic, subtopic: topic.subtopic },
        plannedStart: row.planned_start,
        plannedEnd: row.planned_end,
        updatedAt: row.updated_at,
      },
    ]
  })
}

/**
 * The syllabus plan as week bars for every week in the grid. The student sees
 * their own (RLS); the tutor sees everyone's, or one student's when filtered.
 */
export async function loadWeekPlans(
  supabase: Supabase,
  profile: SessionProfile,
  query: CalendarQuery
): Promise<WeekPlan[]> {
  const isTutor = profile.role === "tutor"
  const weeks = monthGrid(query.month)
  const from = weeks[0]![0]!
  const to = weeks.at(-1)!.at(-1)!

  let rows = supabase
    .from("topic_progress")
    .select(PLANNED_TOPICS_SELECT)
    // Planned at all, and not wholly before or after the grid. A one-sided
    // window is a single day; `weekPlans` clips to the grid exactly.
    // (A one-branch `or` is how postgrest-js spells a grouped `and`.)
    .or(
      `and(${[
        "or(planned_start.not.is.null,planned_end.not.is.null)",
        `or(planned_start.lte.${to},planned_start.is.null)`,
        `or(planned_end.gte.${from},planned_end.is.null)`,
      ].join(",")})`
    )

  if (isTutor && query.studentId) rows = rows.eq("student_id", query.studentId)
  else if (!isTutor) rows = rows.eq("student_id", profile.id)

  const { data } = await rows
  return weekPlans(toPlannedTopics(data, isTutor), { from, to })
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
