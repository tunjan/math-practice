import { redirect } from "next/navigation"

/**
 * A task's URL loaded directly (a shared link, a calendar feed, a refresh).
 * There is no task page: tasks open as a dialog over the list, so this lands
 * on the list with the task open.
 */
export default async function StudentTaskPage({ params }: PageProps<"/student/tasks/[id]">) {
  const { id } = await params
  redirect(`/student?task=${encodeURIComponent(id)}`)
}
