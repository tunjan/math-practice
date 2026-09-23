import { TaskDialogFrame } from "@/components/student/task-dialog-frame"

/**
 * A task opened from inside the workspace: the dialog stays mounted while its
 * content loads, so it opens once and fills in, rather than opening twice.
 */
export default function TaskDialogLayout({ children }: LayoutProps<"/student/tasks/[id]">) {
  return <TaskDialogFrame>{children}</TaskDialogFrame>
}
