import { NextResponse, type NextRequest } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { buildCalendar, type CalendarEvent } from "@/lib/calendar/ics"
import { EVENT_KIND_LABEL, weekPlans } from "@/lib/calendar/model"
import { PLANNED_TOPICS_SELECT, toPlannedTopics } from "@/lib/calendar/load"
import { TYPE_LABEL } from "@/lib/assignments/model"
import { addDays, dayKeyOf, utcDayKey, utcMidnight } from "@/lib/calendar/dates"
import { formatPercent, TOPIC_NAME, toTopicTags } from "@/lib/syllabus/model"

/**
 * A subscribable calendar feed: /api/calendar/<token>.ics
 *
 * Calendar clients fetch this on a schedule with no cookies and no way to sign
 * in, so the token in the path IS the credential. It is an unguessable uuid
 * held only by its owner, rotatable without touching their password, and it
 * grants read access to nothing but what their own calendar page shows:
 * deadlines, their own events, events shared with them, exams, and planned
 * syllabus topics.
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

  let planned = admin
    .from("topic_progress")
    .select(PLANNED_TOPICS_SELECT)
    .or(`planned_end.gte.${since.slice(0, 10)},and(planned_end.is.null,planned_start.gte.${since.slice(0, 10)})`)
  // The tutor plans for every student; a student sees only their own plan.
  if (!isTutor) planned = planned.eq("student_id", profile.id)

  let examQuery = admin
    .from("exams")
    .select(
      `id, title, exam_date, percent, ib_grade, notes, student_id, updated_at,
       exam_topics(syllabus_topics(code, title, topic, subtopic)),
       profiles(full_name)`
    )
    .gte("exam_date", since.slice(0, 10))
    .order("exam_date", { ascending: true })
  if (!isTutor) examQuery = examQuery.eq("student_id", profile.id)

  const [{ data: assignments }, { data: calendarEvents }, { data: plannedRows }, { data: examRows }] = await Promise.all([
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
    planned,
    examQuery,
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

  const plans: CalendarEvent[] = weekPlans(toPlannedTopics(plannedRows, isTutor)).map((plan) => {
    const strand = TOPIC_NAME[plan.topic] ?? `Topic ${plan.topic}`
    const codes = plan.topics.map((t) => t.code).join(", ")
    return {
      uid: `plan-${plan.studentId}-${plan.week}-${plan.topic}@maths-tasks`,
      // A bar across the week, Monday to Sunday.
      start: new Date(utcMidnight(plan.week)),
      end: new Date(utcMidnight(addDays(plan.week, 7))),
      allDay: true,
      summary: `${plan.person ? `${plan.person}: ` : ""}${strand} ${codes}`,
      description: ["Planned this week", ...plan.topics.map((t) => `${t.code} ${t.title}`)].join("\n"),
      url: isTutor ? `${origin}/tutor/students/${plan.studentId}` : `${origin}/student/syllabus`,
      sequence: Math.floor(new Date(plan.updatedAt).getTime() / 1000),
    }
  })

  const today = dayKeyOf(new Date(), profile.timezone)
  const exams: CalendarEvent[] = (examRows ?? []).map((exam) => {
    const student = isTutor ? exam.profiles?.full_name : undefined
    const result = [
      exam.percent === null ? null : formatPercent(Number(exam.percent)),
      exam.ib_grade === null ? null : `Grade ${exam.ib_grade}`,
    ].filter(Boolean)
    const codes = toTopicTags(exam.exam_topics).map((t) => t.code).join(", ")
    return {
      uid: `exam-${exam.id}@maths-tasks`,
      start: new Date(utcMidnight(exam.exam_date)),
      end: new Date(utcMidnight(addDays(exam.exam_date, 1))),
      allDay: true,
      summary: `Exam: ${exam.title}${student ? ` (${student})` : ""}`,
      description: [codes ? `Topics: ${codes}` : null, result.length ? result.join(" · ") : null, exam.notes]
        .filter(Boolean)
        .join("\n"),
      url: isTutor ? `${origin}/tutor/students/${exam.student_id}` : `${origin}/student/syllabus`,
      sequence: Math.floor(new Date(exam.updated_at).getTime() / 1000),
      // All-day dates float, so six hours before is 18:00 the evening before,
      // wherever the student is. The tutor gets no alarm.
      alarmMinutesBefore: !isTutor && exam.exam_date > today ? 6 * 60 : undefined,
    }
  })

  const body = buildCalendar({
    name: `Maths Tasks: ${profile.full_name || (isTutor ? "tutor" : "deadlines")}`,
    description: isTutor
      ? "Deadlines you've set, your calendar events, and your students' exams and syllabus plans."
      : "Deadlines from your tutor, your calendar events, your exams and your syllabus plan.",
    events: [...deadlines, ...events, ...plans, ...exams],
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
