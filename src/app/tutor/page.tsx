import type { Metadata } from "next"
import Link from "next/link"
import { CalendarClock, CircleCheck, UserPlus } from "lucide-react"

import { EmptyState, Page, PageHeader } from "@/components/brand/primitives"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableIdentity,
  TableRow,
} from "@/components/brand/table"
import { NewTaskDialog } from "@/components/assignments/new-task-dialog"
import { StatusBadge } from "@/components/assignments/status-badge"
import { ButtonLink } from "@/components/ui/button"
import { Card, CardHeader, StatStrip } from "@/components/ui/card"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
import { formatDue, relativeToNow } from "@/lib/assignments/dates"
import { asStage, needsAttention, type AssignmentRow } from "@/lib/assignments/model"
import { loadTaskOptions } from "@/lib/assignments/task-options"

export const metadata: Metadata = { title: "Overview · Maths Tasks" }
export const dynamic = "force-dynamic"

const LIST_LIMIT = 6
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export default async function TutorOverviewPage() {
  const profile = await requireRole("tutor")
  const supabase = await createClient()

  const [{ data: assignments }, { count: studentCount }, taskOptions] = await Promise.all([
    supabase
      .from("assignments")
      .select(
        `id, title, type, due_at, stage, verdict, submitted_at, student_opened_at,
         profiles!assignments_student_id_fkey(id, full_name, email)`
      ),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student"),
    loadTaskOptions(supabase),
  ])

  const now = new Date()
  const tz = profile.timezone

  const rows: AssignmentRow[] = (assignments ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    type: a.type,
    dueAt: a.due_at,
    stage: asStage(a.stage),
    verdict: a.verdict,
    studentId: a.profiles?.id ?? "",
    studentName: a.profiles?.full_name || a.profiles?.email || "Unknown student",
    topic: null,
    topics: [],
    submittedAt: a.submitted_at,
    openedAt: a.student_opened_at,
  }))

  const handedIn = (row: AssignmentRow) =>
    row.stage === "submitted" || row.stage === "reviewed"
  const isOverdue = (row: AssignmentRow) =>
    !handedIn(row) && new Date(row.dueAt) < now

  const toReview = rows.filter((r) => r.stage === "submitted" && r.verdict === null)
  const overdue = rows.filter(isOverdue)
  const active = rows.filter((r) => r.verdict !== "approved")

  // Hand-ins first (oldest waiting longest), then overdue work, then returns.
  const rank = (row: AssignmentRow) =>
    row.stage === "submitted" && row.verdict === null ? 0 : isOverdue(row) ? 1 : 2
  const attention = rows
    .filter((row) => needsAttention(row, now))
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        (a.submittedAt ?? a.dueAt).localeCompare(b.submittedAt ?? b.dueAt)
    )

  const upcoming = rows
    .filter((row) => {
      const due = new Date(row.dueAt).getTime()
      return !handedIn(row) && due >= now.getTime() && due - now.getTime() <= WEEK_MS
    })
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))

  const firstName = profile.fullName.split(" ")[0]

  return (
    <Page>
      <PageHeader
        title={firstName ? `Hello, ${firstName}` : "Overview"}
        description={summary(toReview.length, overdue.length)}
        actions={
          <>
            <ButtonLink href="/tutor/students">
              <UserPlus aria-hidden />
              Invite student
            </ButtonLink>
            <NewTaskDialog {...taskOptions} />
          </>
        }
      />

      <StatStrip
        stats={[
          { label: "To review", value: toReview.length },
          { label: "Overdue", value: overdue.length },
          { label: "Active tasks", value: active.length },
          { label: "Students", value: studentCount ?? 0 },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader
            title="Needs your attention"
            description="Hand-ins to review, overdue work and returned tasks."
            action={
              attention.length > 0 ? (
                <ButtonLink href="/tutor/assignments" size="sm">
                  View all
                </ButtonLink>
              ) : null
            }
          />
          {attention.length === 0 ? (
            <EmptyState
              icon={<CircleCheck />}
              title="All caught up"
              description="Hand-ins and overdue work will show up here."
            />
          ) : (
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Task</TableHead>
                  <TableHead className="hidden sm:table-cell">Due</TableHead>
                  <TableHead className="hidden w-px sm:table-cell">Status</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {attention.slice(0, LIST_LIMIT).map((row) => (
                  <TableRow key={row.id} className="relative">
                    <TableCell className="max-w-0 w-full">
                      <Link
                        href={`/tutor/assignments/${row.id}`}
                        className="after:absolute after:inset-0"
                      >
                        <TableIdentity primary={row.title} secondary={row.studentName} />
                      </Link>
                      <div className="mt-1.5 sm:hidden">
                        <StatusBadge
                          stage={row.stage}
                          verdict={row.verdict}
                          overdue={isOverdue(row)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap sm:table-cell">
                      <span className="mono-data-sm text-on-surface-secondary">
                        {formatDue(row.dueAt, tz)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <StatusBadge
                        stage={row.stage}
                        verdict={row.verdict}
                        overdue={isOverdue(row)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="self-start">
          <CardHeader title="Due this week" />
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarClock />}
              title="Nothing due in the next 7 days"
              className="py-10"
            />
          ) : (
            <ul role="list">
              {upcoming.slice(0, LIST_LIMIT).map((row) => (
                <li key={row.id} className="border-t border-outline first:border-t-0">
                  <Link
                    href={`/tutor/assignments/${row.id}`}
                    className="flex min-h-14 items-center justify-between gap-4 px-6 py-2 transition-colors hover:bg-surface-sunken"
                  >
                    <TableIdentity primary={row.title} secondary={row.studentName} />
                    <span className="flex shrink-0 flex-col items-end">
                      <span className="mono-data-sm text-on-surface">
                        {formatDue(row.dueAt, tz)}
                      </span>
                      <span className="body-sm text-on-surface-muted">
                        {relativeToNow(row.dueAt, now)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Page>
  )
}

function summary(toReview: number, overdue: number): string {
  if (toReview === 0 && overdue === 0) return "Nothing needs you right now."
  const parts: string[] = []
  if (toReview > 0) parts.push(`${toReview} ${toReview === 1 ? "hand-in" : "hand-ins"} to review`)
  if (overdue > 0) parts.push(`${overdue} overdue`)
  return `${parts.join(" and ")}.`.replace(/^./, (c) => c.toUpperCase())
}
