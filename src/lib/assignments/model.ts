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

export const STAGE_ACCENT = {
  assigned: "mute",
  opened: "dusk",
  submitted: "breeze",
  reviewed: "twilight",
} as const

export const TYPE_LABEL: Record<AssignmentType, string> = {
  problem_set: "Problem set",
  reading_notes: "Reading notes",
}

/** The accent names <StatusDot /> accepts, kept in one place. */
export type DotAccentLike =
  | "mute"
  | "sunset"
  | "sunsetSoft"
  | "dusk"
  | "twilight"
  | "breeze"
  | "danger"
  | "ink"

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

export function statusAccent(
  stage: Stage,
  verdict: ReviewVerdict | null,
  overdue: boolean
): "mute" | "dusk" | "breeze" | "twilight" | "sunset" | "danger" {
  if (verdict === "approved") return "twilight"
  if (verdict === "changes_requested") return "sunset"
  if (overdue) return "danger"
  return STAGE_ACCENT[stage]
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
  topicAccent: string
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
  student: "Student A–Z",
  title: "Title A–Z",
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
