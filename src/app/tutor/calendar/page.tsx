import type { Metadata } from "next"

import { CalendarView } from "@/components/calendar/calendar-view"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
import {
  calendarFeedUrl,
  loadCalendarItems,
  loadStudents,
  loadWeekPlans,
  parseCalendarQuery,
} from "@/lib/calendar/load"

export const metadata: Metadata = { title: "Calendar · Maths Tasks" }
export const dynamic = "force-dynamic"

export default async function TutorCalendarPage({ searchParams }: PageProps<"/tutor/calendar">) {
  const profile = await requireRole("tutor")
  const supabase = await createClient()

  const students = await loadStudents(supabase)
  const parsed = parseCalendarQuery(await searchParams, profile.timezone)
  // A filter for someone who is not on the roster would show an empty month
  // with no way to tell why. Drop it instead.
  const query = students.some((s) => s.id === parsed.studentId)
    ? parsed
    : { ...parsed, studentId: null }

  const [items, plans] = await Promise.all([
    loadCalendarItems(supabase, profile, query),
    loadWeekPlans(supabase, profile, query),
  ])

  return (
    <CalendarView
      key={`${query.month}:${query.studentId ?? ""}`}
      role="tutor"
      basePath="/tutor/calendar"
      month={query.month}
      selected={query.selected}
      today={query.today}
      timeZone={profile.timezone}
      items={items}
      plans={plans}
      students={students}
      studentId={query.studentId}
      feedUrl={calendarFeedUrl(profile.calendarToken)}
    />
  )
}
