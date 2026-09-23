import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { SignedFile } from "@/components/assignments/file-list"
import type { TaskData } from "@/components/student/task-dialog"
import { MATERIALS_BUCKET, SUBMISSIONS_BUCKET } from "@/lib/assignments/files"
import { asStage, boardColumn, type BoardColumn, type ReviewVerdict } from "@/lib/assignments/model"
import { signFiles } from "@/lib/assignments/signing"
import type { HandIn, Review, WorkFile } from "@/lib/student/task-trail"
import type { Database } from "@/lib/supabase/database.types"

type Supabase = SupabaseClient<Database>

/** A task with everything the list and the dialog need, so opening one is instant. */
export type StudentTask = TaskData & {
  column: BoardColumn
  openedAt: string | null
  submittedAt: string | null
  reviewedAt: string | null
}

const ASSIGNMENT_COLUMNS = `id, title, description, type, due_at, stage, verdict, feedback, reviewed_at,
  student_opened_at, submitted_at, created_at, completion_pct,
  superseded_verdict, superseded_feedback, superseded_reviewed_at, superseded_submitted_at,
  categories(name)`

const MATERIAL_COLUMNS = "id, assignment_id, file_name, mime_type, size_bytes, storage_path"
const SUBMISSION_COLUMNS =
  "id, assignment_id, file_name, mime_type, size_bytes, storage_path, created_at, revision, handed_in_at"

/**
 * Every task set for this student, fully loaded: brief, attachments, hand-ins
 * and drafts, with signed URLs. Four round trips however many tasks there are
 * (assignments, then files and submissions together, then one signing call
 * per bucket), so the page can open any task without going back to the server.
 */
export async function loadStudentTasks(supabase: Supabase, studentId: string): Promise<StudentTask[]> {
  const { data: assignments } = await supabase
    .from("assignments")
    .select(ASSIGNMENT_COLUMNS)
    .eq("student_id", studentId)
    .order("due_at", { ascending: true })

  if (!assignments || assignments.length === 0) return []
  const ids = assignments.map((row) => row.id)

  const [{ data: materialRows }, { data: submissionRows }] = await Promise.all([
    supabase.from("assignment_files").select(MATERIAL_COLUMNS).in("assignment_id", ids).order("sort_order"),
    supabase
      .from("submissions")
      .select(SUBMISSION_COLUMNS)
      .in("assignment_id", ids)
      .order("revision", { ascending: true })
      .order("created_at", { ascending: true }),
  ])

  const [materials, submissions] = await Promise.all([
    signFiles(supabase, MATERIALS_BUCKET, materialRows ?? []),
    signFiles(supabase, SUBMISSIONS_BUCKET, submissionRows ?? []),
  ])

  const materialsByTask = groupBy(materialRows ?? [], materials)
  const submissionsByTask = groupBy(submissionRows ?? [], submissions)

  return assignments.map((assignment) =>
    shapeTask(
      assignment,
      studentId,
      (materialsByTask.get(assignment.id) ?? []).map((entry) => entry.file),
      submissionsByTask.get(assignment.id) ?? []
    )
  )
}

/**
 * One task, or null when it doesn't exist or isn't this student's (row-level
 * security hides it). For the dialog opened over the calendar.
 */
export async function loadStudentTask(
  supabase: Supabase,
  studentId: string,
  id: string
): Promise<StudentTask | null> {
  const { data: assignment } = await supabase
    .from("assignments")
    .select(ASSIGNMENT_COLUMNS)
    .eq("id", id)
    .maybeSingle()

  if (!assignment) return null

  const [{ data: materialRows }, { data: submissionRows }] = await Promise.all([
    supabase.from("assignment_files").select(MATERIAL_COLUMNS).eq("assignment_id", id).order("sort_order"),
    supabase
      .from("submissions")
      .select(SUBMISSION_COLUMNS)
      .eq("assignment_id", id)
      .order("revision", { ascending: true })
      .order("created_at", { ascending: true }),
  ])

  const [materials, submissions] = await Promise.all([
    signFiles(supabase, MATERIALS_BUCKET, materialRows ?? []),
    signFiles(supabase, SUBMISSIONS_BUCKET, submissionRows ?? []),
  ])

  return shapeTask(
    assignment,
    studentId,
    materials,
    (submissionRows ?? []).map((row, index) => ({ row, file: submissions[index]! }))
  )
}

type AssignmentRow = {
  id: string
  title: string
  description: string | null
  type: TaskData["type"]
  due_at: string
  stage: string | null
  verdict: string | null
  feedback: string | null
  reviewed_at: string | null
  student_opened_at: string | null
  submitted_at: string | null
  created_at: string
  completion_pct: number
  superseded_verdict: string | null
  superseded_feedback: string | null
  superseded_reviewed_at: string | null
  superseded_submitted_at: string | null
  categories: { name: string } | null
}

type SubmissionRow = { id: string; revision: number; handed_in_at: string | null }

/** Rows and their signed files arrive in the same order; pair them by task. */
function groupBy<R extends { assignment_id: string }>(
  rows: R[],
  signed: SignedFile[]
): Map<string, { row: R; file: SignedFile }[]> {
  const byTask = new Map<string, { row: R; file: SignedFile }[]>()
  rows.forEach((row, index) => {
    const entry = { row, file: signed[index]! }
    const list = byTask.get(row.assignment_id)
    if (list) list.push(entry)
    else byTask.set(row.assignment_id, [entry])
  })
  return byTask
}

function shapeTask(
  assignment: AssignmentRow,
  studentId: string,
  materials: SignedFile[],
  submissions: { row: SubmissionRow; file: SignedFile }[]
): StudentTask {
  // Rows are one file each; group handed-in ones by revision, keep drafts apart.
  const byRevision = new Map<number, HandIn>()
  const draft: WorkFile[] = []
  for (const { row, file } of submissions) {
    const work = { ...file, submissionId: row.id }
    if (row.handed_in_at === null) {
      draft.push(work)
      continue
    }
    const handIn = byRevision.get(row.revision)
    if (handIn) handIn.files.push(work)
    else byRevision.set(row.revision, { revision: row.revision, at: row.handed_in_at, files: [work] })
  }

  const reviews: Review[] = []
  if (assignment.verdict && assignment.reviewed_at) {
    reviews.push({
      verdict: assignment.verdict as ReviewVerdict,
      feedback: assignment.feedback,
      at: assignment.reviewed_at,
      handedInAt: assignment.submitted_at,
    })
  }
  if (assignment.superseded_verdict && assignment.superseded_reviewed_at) {
    reviews.push({
      verdict: assignment.superseded_verdict as ReviewVerdict,
      feedback: assignment.superseded_feedback,
      at: assignment.superseded_reviewed_at,
      handedInAt: assignment.superseded_submitted_at,
    })
  }

  const stage = asStage(assignment.stage)
  const verdict = assignment.verdict as ReviewVerdict | null

  return {
    id: assignment.id,
    studentId,
    title: assignment.title,
    type: assignment.type,
    topic: assignment.categories?.name ?? null,
    description: assignment.description,
    dueAt: assignment.due_at,
    assignedAt: assignment.created_at,
    stage,
    verdict,
    completionPct: assignment.completion_pct,
    materials,
    handIns: Array.from(byRevision.values()).sort((a, b) => a.revision - b.revision),
    draft,
    reviews,
    column: boardColumn({
      stage,
      verdict,
      completionPct: assignment.completion_pct,
      hasDraft: draft.length > 0,
    }),
    openedAt: assignment.student_opened_at,
    submittedAt: assignment.submitted_at,
    reviewedAt: assignment.reviewed_at,
  }
}
