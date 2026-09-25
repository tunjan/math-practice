import type { SessionProfile } from "@/lib/auth/session"
import { DashboardInsights, DashboardOverview } from "@/components/student/dashboard"
import { StudentTasks, type CompanionGlance } from "@/components/student/student-tasks"
import { birdArt } from "@/lib/aviary/catalog"
import { loadAviary } from "@/lib/aviary/load"
import { dayKeyOf, monthOf } from "@/lib/calendar/dates"
import { loadCalendarItems, loadWeekPlans, type CalendarQuery } from "@/lib/calendar/load"
import { buildDashboard } from "@/lib/student/dashboard"
import { loadStudentTasks } from "@/lib/student/load-task"
import { createClient } from "@/lib/supabase/server"
import { loadExams, loadTracker } from "@/lib/syllabus/load"

/**
 * The student's home. Every task is loaded up front, brief and files
 * included, so opening one is a dialog over the list rather than a trip to
 * the server. Around the board sit the week, the next exam and how the
 * student is getting on, worked out here with the request's clock.
 */
export async function StudentHome({ profile }: { profile: SessionProfile }) {
  const supabase = await createClient()
  const now = new Date()
  const today = dayKeyOf(now, profile.timezone)
  // This week is always one row of this month's grid, so the calendar's
  // month loaders cover it.
  const month: CalendarQuery = { month: monthOf(today), selected: today, today, studentId: null }

  const [tasks, aviary, exams, tracker, calendar, plans] = await Promise.all([
    loadStudentTasks(supabase, profile.id),
    loadAviary(supabase, profile.id),
    loadExams(supabase, profile.id),
    profile.course ? loadTracker(supabase, profile.id, profile.course) : null,
    loadCalendarItems(supabase, profile, month, now),
    profile.course ? loadWeekPlans(supabase, profile, month) : [],
  ])

  const bird = birdArt(aviary.companion)
  const companion: CompanionGlance | null = bird
    ? { bird, outfit: aviary.outfits[bird.id] ?? {}, balance: aviary.balance }
    : null

  const dashboard = buildDashboard({
    now,
    timeZone: profile.timezone,
    tasks,
    points: { balance: aviary.balance, earned: aviary.earned, awards: aviary.awards },
    exams,
    tracker,
    calendar,
    plans,
  })

  return (
    <StudentTasks
      firstName={profile.fullName.split(" ")[0] ?? ""}
      tasks={tasks}
      companion={companion}
      timeZone={profile.timezone}
      overview={<DashboardOverview dashboard={dashboard} />}
      insights={<DashboardInsights dashboard={dashboard} />}
    />
  )
}
