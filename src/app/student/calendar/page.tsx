import type { Metadata } from "next"

import { CalendarView } from "@/components/calendar/calendar-view"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
import { calendarFeedUrl, loadCalendarItems, parseCalendarQuery } from "@/lib/calendar/load"

export const metadata: Metadata = { title: "Calendar · Maths Tasks" }
export const dynamic = "force-dynamic"

export default async function StudentCalendarPage({ searchParams }: PageProps<"/student/calendar">) {
  const profile = await requireRole("student")
  const supabase = await createClient()

  const query = parseCalendarQuery(await searchParams, profile.timezone)
  const items = await loadCalendarItems(supabase, profile, query)

  return (
    <CalendarView
      key={query.month}
      role="student"
      basePath="/student/calendar"
      month={query.month}
      selected={query.selected}
      today={query.today}
      timeZone={profile.timezone}
      items={items}
      feedUrl={calendarFeedUrl(profile.calendarToken)}
    />
  )
}
