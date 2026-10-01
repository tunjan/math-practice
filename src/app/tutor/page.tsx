import type { Metadata } from "next"

import { TutorOverview, TutorWelcome, type OverviewRow } from "@/components/tutor/tutor-overview"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
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

  // Nobody enrolled, nobody invited, nothing set: a tutor's first visit.
  if (taskOptions.recipients.length === 0 && rows.length === 0) {
    return <TutorWelcome firstName={firstName} />
  }

  const withOverdue = (row: AssignmentRow): OverviewRow => ({ ...row, overdue: isOverdue(row) })

  return (
    <TutorOverview
      stats={[
        { label: "To review", value: toReview.length },
        { label: "Overdue", value: overdue.length },
        { label: "Active tasks", value: active.length },
        { label: "Students", value: studentCount ?? 0 },
      ]}
      attention={attention.slice(0, LIST_LIMIT).map(withOverdue)}
      upcoming={upcoming.slice(0, LIST_LIMIT).map(withOverdue)}
      hasTasks={rows.length > 0}
      now={now}
      timeZone={tz}
      taskOptions={taskOptions}
    />
  )
}
