import type { Metadata } from "next"

import { Band, Container, EmptyState, PageHeader } from "@/components/brand/primitives"
import { ButtonLink } from "@/components/ui/button"
import {
  AssignmentBrowser,
  type QueuedRow,
} from "@/components/assignments/assignment-browser"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
import { asStage, type AssignmentRow } from "@/lib/assignments/model"

export const metadata: Metadata = { title: "Assignments · Maths Tasks" }
export const dynamic = "force-dynamic"

export default async function AssignmentsPage() {
  await requireRole("tutor")
  const supabase = await createClient()

  const [{ data: assignments }, { data: pending }] = await Promise.all([
    supabase
      .from("assignments")
      .select(
        `id, title, type, due_at, stage, verdict, submitted_at, student_opened_at,
         categories(name, accent_key),
         profiles!assignments_student_id_fkey(id, full_name, email)`
      )
      .order("due_at", { ascending: true }),
    supabase
      .from("pending_assignments")
      .select("id, title, due_at, student_invites(full_name)")
      .order("due_at", { ascending: true }),
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
      assignment.profiles?.full_name ||
      assignment.profiles?.email ||
      "Unknown student",
    topic: assignment.categories?.name ?? null,
    topicAccent: assignment.categories?.accent_key ?? "mute",
    submittedAt: assignment.submitted_at,
    openedAt: assignment.student_opened_at,
  }))

  const queued: QueuedRow[] = (pending ?? []).map((task) => ({
    id: task.id,
    title: task.title,
    dueAt: task.due_at,
    inviteeName: task.student_invites?.full_name || "Invited student",
  }))

  return (
    <Band>
      <Container width="wide" className="flex flex-col gap-8">
        <PageHeader
          eyebrow="Assignments"
          title="All work"
          description="Start with Attention — it holds anything handed in, returned, or past due."
          action={
            <ButtonLink variant="primary" href="/tutor/assignments/new">
              New task
            </ButtonLink>
          }
        />

        {rows.length === 0 && queued.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            description="Set your first piece of work and it will show up here."
            action={
              <ButtonLink variant="primary" href="/tutor/assignments/new">
                Set some work
              </ButtonLink>
            }
          />
        ) : (
          <AssignmentBrowser rows={rows} queued={queued} />
        )}
      </Container>
    </Band>
  )
}
