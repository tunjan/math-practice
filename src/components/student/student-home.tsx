import type { SessionProfile } from "@/lib/auth/session"
import { StudentTasks, type CompanionGlance } from "@/components/student/student-tasks"
import { birdArt } from "@/lib/aviary/catalog"
import { loadAviary } from "@/lib/aviary/load"
import { loadStudentTasks } from "@/lib/student/load-task"
import { createClient } from "@/lib/supabase/server"

/**
 * The student's home. Every task is loaded up front, brief and files
 * included, so opening one is a dialog over the list rather than a trip to
 * the server.
 */
export async function StudentHome({ profile }: { profile: SessionProfile }) {
  const supabase = await createClient()
  const [tasks, aviary] = await Promise.all([
    loadStudentTasks(supabase, profile.id),
    loadAviary(supabase, profile.id),
  ])

  const bird = birdArt(aviary.companion)
  const companion: CompanionGlance | null = bird
    ? { bird, outfit: aviary.outfits[bird.id] ?? {}, balance: aviary.balance }
    : null

  return (
    <StudentTasks
      firstName={profile.fullName.split(" ")[0] ?? ""}
      tasks={tasks}
      companion={companion}
      timeZone={profile.timezone}
    />
  )
}
