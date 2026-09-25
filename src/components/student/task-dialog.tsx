import * as React from "react"

import { cn } from "cn"
import type { SignedFile } from "@/components/assignments/file-list"
import { MathProse } from "@/components/assignments/math-prose"
import { TaskComments } from "@/components/assignments/task-comments"
import { DifficultyMeter } from "@/components/aviary/difficulty-meter"
import { AttachmentTiles, FileLinks } from "@/components/student/file-chip"
import { UnsubmitControl, WorkTray, type TaskActions } from "@/components/student/hand-in"
import { LateNotice } from "@/components/student/late-notice"
import type { TaskComment } from "@/lib/assignments/comment-model"
import { formatDue, isOverdue, relativeLate, relativeToNow } from "@/lib/assignments/dates"
import { TYPE_LABEL, type AssignmentType, type ReviewVerdict, type Stage } from "@/lib/assignments/model"
import { DIFFICULTY_LABEL, DIFFICULTY_POINTS, type Difficulty } from "@/lib/aviary/difficulty"
import {
  phaseOf,
  TASK_TITLE_ID,
  type HandIn,
  type Phase,
  type Review,
  type WorkFile,
} from "@/lib/student/task-trail"

export type TaskData = {
  id: string
  studentId: string
  title: string
  type: AssignmentType
  difficulty: Difficulty
  topic: string | null
  description: string | null
  dueAt: string
  assignedAt: string
  stage: Stage
  verdict: ReviewVerdict | null
  completionPct: number
  materials: SignedFile[]
  /** Oldest first. */
  handIns: HandIn[]
  draft: WorkFile[]
  reviews: Review[]
  /** Oldest first. */
  comments: TaskComment[]
}

/**
 * A task, read top to bottom as the exchange it is:
 *
 *   what it is        title, with type and topic above, then its status
 *                     and deadline on one line
 *   what was asked    one card: the tutor's attachments on top, their
 *                     instructions as its text
 *   what was said     the thread between the student and the tutor
 *   what you send     the tray, always the student's own files and the one
 *                     action the moment allows
 *
 * The tutor's files are cards; the student's are chips in the tray, so
 * nothing needs a heading to say whose is whose.
 */
export function TaskDialogBody({
  task,
  timeZone,
  viewerName,
  actions,
  titleId = TASK_TITLE_ID,
}: {
  task: TaskData
  timeZone: string
  /** The student's name, for their own comments. */
  viewerName: string
  actions?: TaskActions
  titleId?: string
}) {
  const phase = phaseOf(task.stage, task.verdict)
  const tags = [TYPE_LABEL[task.type], task.topic].filter((tag): tag is string => Boolean(tag))

  return (
    <>
      {/* One scroller on a phone; from `sm` the header stays put. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain sm:overflow-visible">
        <header className="flex shrink-0 flex-col gap-3 px-6 pt-6 pr-16 pb-5 max-sm:pt-4">
          <ul role="list" aria-label="About this task" className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-outline bg-surface-sunken px-2 py-px text-xs leading-4 font-medium text-on-surface-secondary"
              >
                {tag}
              </li>
            ))}
            <li className="inline-flex items-center gap-1.5 rounded-full border border-outline bg-surface-sunken px-2 py-px text-xs leading-4 font-medium text-on-surface-secondary">
              <DifficultyMeter difficulty={task.difficulty} className="h-2.5 text-on-surface-muted" />
              {DIFFICULTY_LABEL[task.difficulty]}
              <span className="font-normal text-on-surface-muted">
                {task.verdict === "approved" ? "earned " : null}+{DIFFICULTY_POINTS[task.difficulty]}
              </span>
            </li>
          </ul>
          <h2
            id={titleId}
            className="font-display text-2xl leading-[1.33] font-medium text-pretty text-on-surface"
          >
            {task.title}
          </h2>
          <StatusLine task={task} phase={phase} timeZone={timeZone} />
        </header>

        <div className="flex flex-col gap-5 border-t border-outline px-6 pt-5 pb-6 sm:min-h-0 sm:flex-1 sm:overflow-y-auto sm:overscroll-contain">
          <TutorFeedback task={task} />
          <Brief task={task} />
          <TaskComments
            taskId={task.id}
            comments={task.comments}
            viewer={{ role: "student", name: viewerName }}
            timeZone={timeZone}
            className="mt-3"
          />
        </div>
      </div>

      <Tray task={task} phase={phase} timeZone={timeZone} actions={actions} />
    </>
  )
}

/* ── Where it stands ──────────────────────────────────────────────────────── */

/** Past due while the next move is still the student's. */
function openAndOverdue(task: TaskData): boolean {
  return isOverdue(task.dueAt) && (task.stage === "assigned" || task.stage === "opened")
}

/** Only the states the tray doesn't already make obvious get a pill. */
function statusOf(task: TaskData, phase: Phase): { label: string; className: string } | null {
  if (phase === "approved")
    return { label: "Approved", className: "border-[#bbf7d0] bg-success-container text-on-success-container" }
  if (phase === "waiting")
    return { label: "With your tutor", className: "border-[#bfdbfe] bg-info-container text-on-info-container" }
  if (task.verdict === "changes_requested")
    return { label: "Changes requested", className: "border-[#fed7aa] bg-warning-container text-on-warning-container" }
  return null
}

/** The status, if any, and the deadline, on one line under the title. */
function StatusLine({ task, phase, timeZone }: { task: TaskData; phase: Phase; timeZone: string }) {
  const status = statusOf(task, phase)
  const overdue = openAndOverdue(task)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {status ? (
        <span className={cn("rounded-full border px-2 py-px text-xs leading-4 font-medium", status.className)}>
          {status.label}
        </span>
      ) : null}
      <span className="flex flex-wrap items-center gap-x-2 text-sm">
        <span className="text-on-surface-muted">Due</span>
        <time dateTime={task.dueAt} className="font-mono text-[13px] text-on-surface-secondary">
          {formatDue(task.dueAt, timeZone)}
        </time>
        {phase === "working" ? (
          <span
            suppressHydrationWarning
            className={cn("text-xs", overdue ? "font-medium text-error" : "text-on-surface-muted")}
          >
            {overdue ? relativeLate(task.dueAt) : relativeToNow(task.dueAt)}
          </span>
        ) : null}
      </span>
    </div>
  )
}

/* ── What was asked ──────────────────────────────────────────────────────── */

/**
 * The brief as one card across the dialog, framed twice like the dialog
 * itself: a grey tray with an inset hairline around a white card with its
 * own. Attachments sit on top as tiles; the instructions are the card's text.
 */
function Brief({ task }: { task: TaskData }) {
  const files = task.materials.length > 0
  if (!files && !task.description) {
    return <p className="text-sm text-on-surface-muted">No instructions yet.</p>
  }

  return (
    <div className="rounded-xl bg-surface-sunken p-1 ring-1 ring-outline ring-inset">
      {/* The card clips the tiles to its corners and draws its hairline over
          them, so image and border share one curve. */}
      <div className="relative flex flex-col overflow-hidden rounded-lg bg-surface after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit] after:ring-1 after:ring-outline after:ring-inset">
        {files ? (
          <AttachmentTiles
            files={task.materials}
            className={cn(task.description && "border-b border-outline")}
          />
        ) : null}
        {task.description ? <MathProse className="px-4 pt-3.5 pb-4">{task.description}</MathProse> : null}
      </div>
    </div>
  )
}

/* ── What the tutor said ──────────────────────────────────────────────────── */

/**
 * The note that came with the current verdict. Changes requested reads as
 * something to act on, so it sits first and in the warning container.
 */
function TutorFeedback({ task }: { task: TaskData }) {
  const feedback = task.verdict ? task.reviews[0]?.feedback : null
  if (!feedback) return null
  const revise = task.verdict === "changes_requested"

  return (
    <section
      className={cn(
        "flex flex-col gap-2 rounded-md border px-4 py-3",
        revise ? "border-[#fed7aa] bg-warning-container" : "border-outline bg-surface-sunken"
      )}
    >
      <h3 className={cn("text-sm font-medium", revise ? "text-on-warning-container" : "text-on-surface")}>
        {revise ? "What to change" : "Feedback from your tutor"}
      </h3>
      <MathProse>{feedback}</MathProse>
    </section>
  )
}

/* ── The tray ──────────────────────────────────────────────────────────────── */

function Tray({
  task,
  phase,
  timeZone,
  actions,
}: {
  task: TaskData
  phase: Phase
  timeZone: string
  actions?: TaskActions
}) {
  const latest = task.handIns.at(-1)?.files ?? []
  if (phase === "approved" && latest.length === 0) return null

  return (
    <section
      aria-label="Your work"
      className="flex shrink-0 flex-col gap-3 border-t border-outline bg-surface-muted px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4"
    >
      {phase === "working" ? <LateNotice dueAt={task.dueAt} /> : null}

      {phase === "working" ? (
        <WorkTray
          assignmentId={task.id}
          studentId={task.studentId}
          draft={task.draft}
          actions={actions}
        />
      ) : null}

      {phase === "waiting" ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <FileLinks files={latest} label="Handed in" />
            </div>
            <UnsubmitControl assignmentId={task.id} action={actions?.unsubmit} />
          </div>
          {isOverdue(task.dueAt) ? (
            <p className="text-xs text-on-surface-muted">Handing in again now will count as late.</p>
          ) : null}
        </>
      ) : null}

      {phase === "approved" ? <FileLinks files={latest} label="Handed in" /> : null}
    </section>
  )
}

/* ── Other states ──────────────────────────────────────────────────────────── */

function Bar({ className }: { className: string }) {
  return <span className={cn("block rounded-sm bg-surface-sunken motion-safe:animate-pulse", className)} />
}

/** The dialog's shape while the task loads, so opening feels immediate. */
export function TaskDialogSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col">
      <h2 id={TASK_TITLE_ID} className="sr-only">
        Loading task
      </h2>
      <div className="flex flex-col gap-3 px-6 pt-6 pb-5">
        <Bar className="h-3 w-28" />
        <Bar className="h-5 w-72 max-w-[70%]" />
        <Bar className="h-4 w-48" />
      </div>
      <div className="flex flex-col gap-3 border-t border-outline px-6 pt-5 pb-10">
        <div className="flex gap-2">
          <Bar className="h-9 w-40" />
          <Bar className="h-9 w-32" />
        </div>
        <Bar className="mt-2 h-4 w-full" />
        <Bar className="h-4 w-5/6" />
        <Bar className="h-4 w-2/3" />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-outline bg-surface-muted px-6 py-4">
        <Bar className="h-9 w-44" />
        <Bar className="h-10 w-24" />
      </div>
    </div>
  )
}

export function TaskUnavailable() {
  return (
    <header className="flex flex-col gap-1.5 px-6 pt-6 pr-16 pb-6">
      <h2 id={TASK_TITLE_ID} className="font-display text-2xl leading-[1.33] font-medium text-on-surface">
        This task isn&apos;t available
      </h2>
      <p className="text-sm text-on-surface-muted">It may have been removed by your tutor.</p>
    </header>
  )
}
