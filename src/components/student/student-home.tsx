import type { SessionProfile } from "@/lib/auth/session"
import { StudentTasks, type PlanGlance } from "@/components/student/student-tasks"
import { dayKeyOf } from "@/lib/calendar/dates"
import { loadPlan } from "@/lib/plans/load"
import { focusUnit, unitSelfProgress } from "@/lib/plans/model"
import { loadStudentTasks } from "@/lib/student/load-task"
import { createClient } from "@/lib/supabase/server"

/**
 * The student's home. Every task is loaded up front, brief and files
 * included, so opening one is a dialog over the list rather than a trip to
 * the server.
 */
export async function StudentHome({ profile }: { profile: SessionProfile }) {
  const supabase = await createClient()
  const today = dayKeyOf(new Date(), profile.timezone)
  const [tasks, loaded] = await Promise.all([
    loadStudentTasks(supabase, profile.id),
    loadPlan(supabase, profile.id, today),
  ])

  const focus = loaded ? focusUnit(loaded.plan.units, today) : null
  const plan: PlanGlance | null = focus
    ? { unitTitle: focus.title, dueOn: focus.dueOn, selfPct: unitSelfProgress(focus.objectives) }
    : null

  return (
    <StudentTasks
      firstName={profile.fullName.split(" ")[0] ?? ""}
      tasks={tasks}
      plan={plan}
      timeZone={profile.timezone}
    />
  )
}
