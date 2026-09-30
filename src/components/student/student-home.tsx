import type { SessionProfile } from "@/lib/auth/session"
import { StudentTasks } from "@/components/student/student-tasks"
import { loadStudentTasks } from "@/lib/student/load-task"
import { createClient } from "@/lib/supabase/server"

/**
 * The student's home. Every task is loaded up front, brief and files
 * included, so opening one is a dialog over the list rather than a trip to
 * the server.
 */
export async function StudentHome({ profile }: { profile: SessionProfile }) {
  const supabase = await createClient()
  const tasks = await loadStudentTasks(supabase, profile.id)

  return (
    <StudentTasks
      firstName={profile.fullName.split(" ")[0] ?? ""}
      tasks={tasks}
      timeZone={profile.timezone}
    />
  )
}
