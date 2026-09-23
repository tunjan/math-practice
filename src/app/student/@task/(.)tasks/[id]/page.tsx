import { OpenReceipt } from "@/components/student/open-receipt"
import { TaskDialogBody, TaskUnavailable } from "@/components/student/task-dialog"
import { requireRole } from "@/lib/auth/session"
import { loadStudentTask } from "@/lib/student/load-task"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/** A task opened over the board or calendar. */
export default async function TaskDialogPage({ params }: PageProps<"/student/tasks/[id]">) {
  const profile = await requireRole("student")
  const { id } = await params
  const task = await loadStudentTask(await createClient(), profile.id, id)
  if (!task) return <TaskUnavailable />

  return (
    <>
      <OpenReceipt assignmentId={id} alreadyOpened={task.openedAt !== null} />
      <TaskDialogBody task={task} timeZone={profile.timezone} />
    </>
  )
}
