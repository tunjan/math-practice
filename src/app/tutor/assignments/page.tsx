import type { Metadata } from "next"

import { Band, Container, EmptyState, PageHeader } from "@/components/brand/primitives"
import { ButtonLink } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusDot } from "@/components/brand/primitives"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/brand/table"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
import { formatDue, isOverdue, relativeToNow } from "@/lib/assignments/dates"

export const metadata: Metadata = { title: "Assignments · Maths Tasks" }
export const dynamic = "force-dynamic"

const STAGE_ACCENT = {
  assigned: "mute",
  opened: "dusk",
  submitted: "breeze",
  reviewed: "twilight",
} as const

export default async function AssignmentsPage() {
  await requireRole("tutor")
  const supabase = await createClient()

  const [{ data: assignments }, { data: pending }] = await Promise.all([
    supabase
      .from("assignments")
      .select(
        "id, title, type, due_at, stage, verdict, profiles!assignments_student_id_fkey(full_name)"
      )
      .order("due_at", { ascending: true }),
    supabase
      .from("pending_assignments")
      .select("id, title, due_at, student_invites(full_name)")
      .order("due_at", { ascending: true }),
  ])

  const hasAny = (assignments?.length ?? 0) + (pending?.length ?? 0) > 0

  return (
    <Band>
      <Container width="wide" className="flex flex-col gap-8">
        <PageHeader
          eyebrow="Assignments"
          title="All work"
          description="Filters, search and bulk actions arrive in the next phase."
          action={
            <ButtonLink variant="primary" href="/tutor/assignments/new">
              New task
            </ButtonLink>
          }
        />

        {!hasAny ? (
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Stage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(assignments ?? []).map((assignment) => {
                const stage = (assignment.stage ??
                  "assigned") as keyof typeof STAGE_ACCENT
                const overdue =
                  isOverdue(assignment.due_at) && stage !== "reviewed"
                return (
                  <TableRow key={assignment.id}>
                    <TableCell className="text-ink">{assignment.title}</TableCell>
                    <TableCell>
                      {assignment.profiles?.full_name || "—"}
                    </TableCell>
                    <TableCell className="numeric">
                      <span className={overdue ? "text-destructive" : "text-body-mid"}>
                        {formatDue(assignment.due_at)}
                      </span>
                      <span className="ml-2 text-body-mid">
                        {relativeToNow(assignment.due_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="eyebrow-sm inline-flex items-center gap-2 text-body">
                        <StatusDot accent={STAGE_ACCENT[stage]} />
                        {assignment.verdict === "changes_requested"
                          ? "Changes requested"
                          : assignment.verdict === "approved"
                            ? "Approved"
                            : stage}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}

              {(pending ?? []).map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="text-ink">{task.title}</TableCell>
                  <TableCell>
                    {task.student_invites?.full_name || "Invited student"}
                  </TableCell>
                  <TableCell className="numeric text-body-mid">
                    {formatDue(task.due_at)}
                  </TableCell>
                  <TableCell>
                    <Badge>Queued until they join</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Container>
    </Band>
  )
}
