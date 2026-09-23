import type { Metadata } from "next"
import { ClipboardList } from "lucide-react"

import { EmptyState, Page, PageHeader } from "@/components/brand/primitives"
import { Card } from "@/components/ui/card"
import {
  AssignmentBrowser,
  type QueuedRow,
} from "@/components/assignments/assignment-browser"
import { NewTaskDialog } from "@/components/assignments/new-task-dialog"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
import { asStage, type AssignmentRow } from "@/lib/assignments/model"
import { loadTaskOptions } from "@/lib/assignments/task-options"

export const metadata: Metadata = { title: "Assignments · Maths Tasks" }
export const dynamic = "force-dynamic"

export default async function AssignmentsPage({
  searchParams,
}: PageProps<"/tutor/assignments">) {
  const [profile, params] = await Promise.all([requireRole("tutor"), searchParams])
  const supabase = await createClient()

  const [{ data: assignments }, { data: pending }, taskOptions] = await Promise.all([
    supabase
      .from("assignments")
      .select(
        `id, title, type, due_at, stage, verdict, submitted_at, student_opened_at,
         categories(name),
         profiles!assignments_student_id_fkey(id, full_name, email)`
      )
      .order("due_at", { ascending: true }),
    supabase
      .from("pending_assignments")
      .select("id, title, due_at, student_invites(full_name)")
      .order("due_at", { ascending: true }),
    loadTaskOptions(supabase),
  ])

  const rows: AssignmentRow[] = (assignments ?? []).map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    type: assignment.type,
    dueAt: assignment.due_at,
    stage: asStage(assignment.stage),
    verdict: assignment.verdict,
    studentId: assignment.profiles?.id ?? "",
    studentName:
      assignment.profiles?.full_name || assignment.profiles?.email || "Unknown student",
    topic: assignment.categories?.name ?? null,
    submittedAt: assignment.submitted_at,
    openedAt: assignment.student_opened_at,
  }))

  const queued: QueuedRow[] = (pending ?? []).map((task) => ({
    id: task.id,
    title: task.title,
    dueAt: task.due_at,
    inviteeName: task.student_invites?.full_name || "Invited student",
  }))

  // `?new` is where the old /tutor/assignments/new page now sends people.
  const newTask = <NewTaskDialog {...taskOptions} defaultOpen={"new" in params} />

  return (
    <Page>
      <PageHeader
        title="Assignments"
        description="Every task you've set. Attention holds hand-ins, returned work and anything past due."
        actions={rows.length > 0 || queued.length > 0 ? newTask : null}
      />

      {rows.length === 0 && queued.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList />}
            title="No tasks yet"
            description="Set a problem set or some reading, pick a deadline, and it lands in the student's list."
            action={newTask}
          />
        </Card>
      ) : (
        <AssignmentBrowser rows={rows} queued={queued} timeZone={profile.timezone} />
      )}
    </Page>
  )
}
