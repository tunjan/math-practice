"use client"

import { Paperclip } from "lucide-react"
import { cn } from "cn"

import { formatDue, formatShortDate, isOverdue, relativeLate, relativeToNow } from "@/lib/assignments/dates"
import { TYPE_LABEL, type AssignmentType, type BoardColumn } from "@/lib/assignments/model"

export type BoardTask = {
  id: string
  title: string
  type: AssignmentType
  dueAt: string
  column: BoardColumn
  completionPct: number
  openedAt: string | null
  submittedAt: string | null
  reviewedAt: string | null
  topic: string | null
  materialCount: number
}

/* ── Columns ──────────────────────────────────────────────────────────────── */

/** Finished work only grows; older cards fold away behind a disclosure. */
const FINISHED_VISIBLE = 5

type Lane = {
  key: BoardColumn
  title: string
  empty: string
  /** Newest-relevant first for this lane. */
  sort: (a: BoardTask, b: BoardTask) => number
}

const byDue = (a: BoardTask, b: BoardTask) => a.dueAt.localeCompare(b.dueAt)
const byLatest = (field: "submittedAt" | "reviewedAt") => (a: BoardTask, b: BoardTask) =>
  (b[field] ?? "").localeCompare(a[field] ?? "")

/**
 * Left to right is the life of a task. The first three are the student's to
 * move; "Handed in" waits on the tutor; "Finished" is the record.
 */
const LANES: Lane[] = [
  { key: "assigned", title: "To start", empty: "Nothing new from your tutor.", sort: byDue },
  { key: "in_progress", title: "In progress", empty: "Tasks you start move here.", sort: byDue },
  { key: "revise", title: "Feedback", empty: "No changes asked for.", sort: byLatest("reviewedAt") },
  { key: "submitted", title: "Handed in", empty: "Nothing waiting on your tutor.", sort: byLatest("submittedAt") },
  { key: "finished", title: "Finished", empty: "Approved work collects here.", sort: byLatest("reviewedAt") },
]

/** How many lanes, from the left, are the student's turn. */
const YOUR_TURN_LANES = 3

export function groupTasks(tasks: BoardTask[]) {
  return LANES.map((lane) => ({
    lane,
    tasks: tasks.filter((task) => task.column === lane.key).sort(lane.sort),
  }))
}

/* ── The board ────────────────────────────────────────────────────────────── */

/**
 * The student's tasks as a board, one lane per stage. Lanes are trays of
 * tone, not boxes; a bracket above them says whose turn each one is. Cards
 * move by what the student does in the task (start, hand in), so there is no
 * dragging. Nothing here navigates: a task opens in place through `onOpen`.
 * Below `xl` the lanes scroll sideways and snap.
 */
export function TaskList({
  tasks,
  timeZone,
  onOpen,
}: {
  tasks: BoardTask[]
  timeZone: string
  onOpen?: (id: string) => void
}) {
  const lanes = groupTasks(tasks)
  const yourTurn = lanes.slice(0, YOUR_TURN_LANES).reduce((sum, { tasks }) => sum + tasks.length, 0)
  const tutorTurn = lanes[YOUR_TURN_LANES]?.tasks.length ?? 0

  return (
    <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 pb-2 [scrollbar-width:thin] snap-x snap-mandatory scroll-px-4 sm:-mx-8 sm:scroll-px-8 sm:px-8 xl:mx-0 xl:overflow-visible xl:px-0">
      <div className="grid min-w-[68rem] grid-cols-5 gap-x-3 gap-y-3 xl:min-w-0">
        <Turn className="col-span-3" label="Your turn" count={yourTurn} />
        <Turn className="col-span-1" label="Your tutor's turn" count={tutorTurn} />
        <div aria-hidden />

        {lanes.map(({ lane, tasks }) => (
          <LaneColumn key={lane.key} lane={lane} tasks={tasks} timeZone={timeZone} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

/** The bracket over a run of lanes: a hairline with its ends turned down. */
function Turn({ label, count, className }: { label: string; count: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 px-1", className)}>
      <span className="text-xs font-medium whitespace-nowrap text-on-surface-secondary">{label}</span>
      <span className="font-mono text-xs text-on-surface-muted">{count}</span>
      <span aria-hidden className="h-2 flex-1 translate-y-1 rounded-tr-sm border-t border-r border-outline-strong" />
    </div>
  )
}

function LaneColumn({
  lane,
  tasks,
  timeZone,
  onOpen,
}: {
  lane: Lane
  tasks: BoardTask[]
  timeZone: string
  onOpen?: (id: string) => void
}) {
  const id = `lane-${lane.key}`
  const finished = lane.key === "finished"
  const shown = finished ? tasks.slice(0, FINISHED_VISIBLE) : tasks
  const older = finished ? tasks.slice(FINISHED_VISIBLE) : []

  return (
    <section
      aria-labelledby={id}
      className="flex min-h-72 snap-start flex-col gap-2 rounded-xl bg-surface-sunken p-2"
    >
      <div className="flex h-8 items-center gap-2 px-2">
        <h2 id={id} className="text-sm font-medium text-on-surface">
          {lane.title}
        </h2>
        <span className="font-mono text-xs text-on-surface-muted">
          {tasks.length}
          <span className="sr-only">{tasks.length === 1 ? " task" : " tasks"}</span>
        </span>
      </div>

      {tasks.length === 0 ? (
        <p className="px-2 py-1 text-sm text-pretty text-on-surface-muted">{lane.empty}</p>
      ) : (
        <ul role="list" className="flex flex-col gap-2">
          {shown.map((task) => (
            <li key={task.id}>
              <Card task={task} timeZone={timeZone} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      {older.length > 0 ? (
        <details className="group/more">
          <summary className="flex h-8 cursor-pointer list-none items-center justify-center rounded-lg text-sm font-medium text-on-surface-muted transition-colors duration-150 hover:bg-surface-hover hover:text-on-surface [&::-webkit-details-marker]:hidden">
            <span className="group-open/more:hidden">Show {older.length} older</span>
            <span className="hidden group-open/more:inline">Show fewer</span>
          </summary>
          <ul role="list" className="mt-2 flex flex-col gap-2">
            {older.map((task) => (
              <li key={task.id}>
                <Card task={task} timeZone={timeZone} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  )
}

/* ── One task ─────────────────────────────────────────────────────────────── */

/** A state worth naming above the title. The lane says the rest; overdue is carried by the date. */
function stateOf(task: BoardTask): React.ReactNode {
  if (task.column === "assigned" && task.openedAt === null) return (
      <span className="rounded-full border border-violet/30 bg-violet-container px-2 py-px text-xs font-medium text-on-violet-container">
        New
      </span>
    )
  return null
}

/** The one date that matters for a task where it sits, always labelled. */
function momentOf(task: BoardTask, timeZone: string): { text: string; iso: string; late: boolean } {
  switch (task.column) {
    case "submitted": {
      const iso = task.submittedAt ?? task.dueAt
      return { text: `Handed in ${relativeToNow(iso)}`, iso, late: false }
    }
    case "revise": {
      const iso = task.reviewedAt ?? task.dueAt
      return { text: `Reviewed ${relativeToNow(iso)}`, iso, late: false }
    }
    case "finished": {
      const iso = task.reviewedAt ?? task.dueAt
      return { text: `Approved ${formatShortDate(iso, timeZone)}`, iso, late: false }
    }
    default: {
      const late = isOverdue(task.dueAt)
      return {
        text: late ? capitalise(relativeLate(task.dueAt)) : `Due ${relativeToNow(task.dueAt)}`,
        iso: task.dueAt,
        late,
      }
    }
  }
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function Moment({ task, timeZone, className }: { task: BoardTask; timeZone: string; className?: string }) {
  const moment = momentOf(task, timeZone)
  return (
    <time
      suppressHydrationWarning
      dateTime={moment.iso}
      title={formatDue(moment.iso, timeZone)}
      className={cn("text-xs whitespace-nowrap", moment.late ? "font-medium text-error" : "text-on-surface-muted", className)}
    >
      {moment.text}
    </time>
  )
}

function Files({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-on-surface-muted">
      <Paperclip className="size-3.5" aria-hidden />
      <span className="font-mono text-xs">{count}</span>
      <span className="sr-only">{count === 1 ? "file" : "files"}</span>
    </span>
  )
}

function metaOf(task: BoardTask): string {
  return [TYPE_LABEL[task.type], task.topic].filter(Boolean).join(" · ")
}

function notHandedIn(task: BoardTask): boolean {
  return task.column === "assigned" || task.column === "in_progress"
}

/** One task on the board. The whole card opens it. */
function Card({ task, timeZone, onOpen }: { task: BoardTask; timeZone: string; onOpen?: (id: string) => void }) {
  const state = stateOf(task)
  const late = notHandedIn(task) && isOverdue(task.dueAt)
  return (
    <button
      type="button"
      onClick={() => onOpen?.(task.id)}
      aria-haspopup="dialog"
      className={cn(
        "flex w-full flex-col gap-3 rounded-lg border bg-surface p-3 text-left",
        "transition-[border-color,filter] duration-150 hover:border-outline-strong hover:drop-shadow-[0_2px_4px_#222A350D]",
        late ? "border-error/40" : "border-outline"
      )}
    >
      <span className="flex flex-col gap-1">
        {state ? <span className="flex">{state}</span> : null}
        <span className="line-clamp-3 text-sm leading-5 font-medium text-pretty text-on-surface">{task.title}</span>
        <span className="truncate text-xs text-on-surface-muted">{metaOf(task)}</span>
      </span>

      {task.column === "in_progress" ? <Progress pct={task.completionPct} /> : null}

      <span className="flex items-center justify-between gap-2">
        <Moment task={task} timeZone={timeZone} className="truncate" />
        <Files count={task.materialCount} />
      </span>
    </button>
  )
}

function Progress({ pct }: { pct: number }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className="h-1 flex-1 overflow-hidden rounded-full bg-surface-sunken">
        <span className="block h-full rounded-full bg-on-surface" style={{ width: `${pct}%` }} />
      </span>
      <span className="font-mono text-xs text-on-surface-secondary">
        {pct}%<span className="sr-only"> done</span>
      </span>
    </span>
  )
}

/* ── Loading ───────────────────────────────────────────────────────────────── */

function Bar({ className }: { className: string }) {
  return <span className={cn("block rounded-sm bg-surface-sunken motion-safe:animate-pulse", className)} />
}

/** The page's shape while it loads. */
export function TaskPageSkeleton() {
  return (
    <div className="dub flex flex-1 flex-col bg-surface">
      <div aria-busy="true" className="mx-auto flex w-full max-w-screen-xl flex-col gap-10 overflow-hidden px-4 pt-10 pb-20 sm:px-8 sm:pt-14">
        <div className="flex flex-col gap-3">
          <Bar className="h-9 w-64" />
          <Bar className="h-5 w-80 max-w-full" />
        </div>
        <div className="grid min-w-[68rem] grid-cols-5 gap-3 xl:min-w-0">
          {[2, 1, 1, 1, 2].map((cards, lane) => (
            <div key={lane} className="flex min-h-72 flex-col gap-2 rounded-xl bg-surface-sunken p-2">
              <Bar className="mx-2 my-2.5 h-3 w-20 bg-outline" />
              {Array.from({ length: cards }, (_, index) => (
                <div key={index} className="flex flex-col gap-2 rounded-lg border border-outline bg-surface p-3">
                  <Bar className="h-4 w-full" />
                  <Bar className="h-3 w-24" />
                  <Bar className="mt-2 h-3 w-20" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
