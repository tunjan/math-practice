import type { TopicTag } from "@/lib/syllabus/model"
import type { Database } from "@/lib/supabase/database.types"

export type AssignmentType = Database["public"]["Enums"]["assignment_type"]
export type ReviewVerdict = Database["public"]["Enums"]["review_verdict"]

/** The four-stage tracker. Derived in the database; mirrored here for the UI. */
export const STAGES = ["assigned", "opened", "submitted", "reviewed"] as const
export type Stage = (typeof STAGES)[number]

export const STAGE_LABEL: Record<Stage, string> = {
  assigned: "Assigned",
  opened: "Opened",
  submitted: "Submitted",
  reviewed: "Reviewed",
}

export const TYPE_LABEL: Record<AssignmentType, string> = {
  problem_set: "Problem set",
  reading_notes: "Reading notes",
}

export function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage)
}

export function asStage(value: string | null | undefined): Stage {
  return STAGES.includes(value as Stage) ? (value as Stage) : "assigned"
}

/**
 * What the tutor's list calls a row's state. This is the one place the tutor's
 * verdict and the derived stage are combined, so every view says the same thing.
 */
export function statusLabel(
  stage: Stage,
  verdict: ReviewVerdict | null
): string {
  if (verdict === "approved") return "Approved"
  if (verdict === "changes_requested") return "Changes requested"
  return STAGE_LABEL[stage]
}

/**
 * DESIGN.md › Colors: each semantic container answers one question about a
 * record's condition. Violet is new, accent is early stage, info is in flight,
 * warning is pending on someone, success is closed, error is blocked.
 */
export type StatusTone =
  | "violet"
  | "accent"
  | "info"
  | "warning"
  | "success"
  | "error"

export function assignmentStatus(
  stage: Stage,
  verdict: ReviewVerdict | null,
  overdue: boolean
): { label: string; tone: StatusTone } {
  if (verdict === "approved") return { label: "Approved", tone: "success" }
  if (verdict === "changes_requested")
    return { label: "Changes requested", tone: "warning" }
  if (overdue) return { label: "Overdue", tone: "error" }
  if (stage === "submitted") return { label: "Submitted", tone: "info" }
  if (stage === "opened") return { label: "Opened", tone: "accent" }
  return { label: "Assigned", tone: "violet" }
}

/**
 * The student's board, left to right in the order work travels. Columns are
 * read off the same evidence as the stage and verdict, never stored, so a card
 * moves only when something real happens: the student reports progress, hands
 * work in, or the tutor reviews it. Handing revised work in again clears the
 * verdict, which sends a "Feedback" card back to "Submitted".
 *
 * "In progress" keys off the student's own progress report rather than the
 * open receipt, because opening a task once is not the same as starting it.
 */
export const BOARD_COLUMNS = [
  "assigned",
  "in_progress",
  "submitted",
  "revise",
  "finished",
] as const
export type BoardColumn = (typeof BOARD_COLUMNS)[number]

export const BOARD_COLUMN_LABEL: Record<BoardColumn, string> = {
  assigned: "Assigned",
  in_progress: "In progress",
  submitted: "Submitted",
  revise: "Feedback",
  finished: "Finished",
}

export const BOARD_COLUMN_HINT: Record<BoardColumn, string> = {
  assigned: "New from your tutor",
  in_progress: "You're working on these",
  submitted: "Waiting for your tutor",
  revise: "Revise and hand in again",
  finished: "Approved by your tutor",
}

export const BOARD_COLUMN_EMPTY: Record<BoardColumn, string> = {
  assigned: "No new tasks",
  in_progress: "Tasks you start appear here",
  submitted: "Nothing waiting for review",
  revise: "No feedback to act on",
  finished: "Approved work lands here",
}

export const BOARD_COLUMN_TONE = {
  assigned: "violet",
  in_progress: "accent",
  submitted: "info",
  revise: "warning",
  finished: "success",
} as const satisfies Record<BoardColumn, StatusTone>

export function boardColumn(task: {
  stage: Stage
  verdict: ReviewVerdict | null
  completionPct: number
  /** Files saved but not handed in, e.g. after an unsubmit. */
  hasDraft: boolean
}): BoardColumn {
  if (task.verdict === "approved") return "finished"
  if (task.verdict === "changes_requested") return "revise"
  if (task.stage === "submitted") return "submitted"
  if (task.completionPct > 0 || task.hasDraft) return "in_progress"
  return "assigned"
}

export const FILTERS = ["attention", "active", "approved", "all"] as const
export type Filter = (typeof FILTERS)[number]

export const FILTER_LABEL: Record<Filter, string> = {
  attention: "Attention",
  active: "Active",
  approved: "Approved",
  all: "All",
}

export const FILTER_HINT: Record<Filter, string> = {
  attention: "Waiting on you, or past due",
  active: "Not yet approved",
  approved: "Signed off",
  all: "Everything",
}

export type AssignmentRow = {
  id: string
  title: string
  type: AssignmentType
  dueAt: string
  stage: Stage
  verdict: ReviewVerdict | null
  studentName: string
  studentId: string
  topic: string | null
  /** Syllabus subtopics, in syllabus order. */
  topics: TopicTag[]
  submittedAt: string | null
  openedAt: string | null
}

/**
 * "Attention" is the queue the tutor should actually work through: anything
 * submitted and not yet reviewed, plus anything overdue that has not been
 * handed in. Deliberately not "everything unfinished" — a task due next week
 * needs nothing from anyone yet.
 */
export function needsAttention(row: AssignmentRow, now = new Date()): boolean {
  const awaitingReview = row.stage === "submitted" && row.verdict === null
  const overdueUnsubmitted =
    row.stage !== "submitted" &&
    row.stage !== "reviewed" &&
    new Date(row.dueAt) < now
  const returnedForRevision = row.verdict === "changes_requested"
  return awaitingReview || overdueUnsubmitted || returnedForRevision
}

export function matchesFilter(
  row: AssignmentRow,
  filter: Filter,
  now = new Date()
): boolean {
  switch (filter) {
    case "attention":
      return needsAttention(row, now)
    case "active":
      return row.verdict !== "approved"
    case "approved":
      return row.verdict === "approved"
    case "all":
      return true
  }
}

export function matchesSearch(row: AssignmentRow, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    row.title.toLowerCase().includes(q) ||
    row.studentName.toLowerCase().includes(q) ||
    (row.topic?.toLowerCase().includes(q) ?? false)
  )
}

export const SORTS = ["due-asc", "due-desc", "student", "title"] as const
export type Sort = (typeof SORTS)[number]

export const SORT_LABEL: Record<Sort, string> = {
  "due-asc": "Due soonest",
  "due-desc": "Due latest",
  student: "Student A-Z",
  title: "Title A-Z",
}

export function compareRows(a: AssignmentRow, b: AssignmentRow, sort: Sort) {
  switch (sort) {
    case "due-asc":
      return a.dueAt.localeCompare(b.dueAt)
    case "due-desc":
      return b.dueAt.localeCompare(a.dueAt)
    case "student":
      return a.studentName.localeCompare(b.studentName) ||
        a.dueAt.localeCompare(b.dueAt)
    case "title":
      return a.title.localeCompare(b.title)
  }
}
