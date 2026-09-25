"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { Paperclip } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { DifficultyMeter } from "@/components/aviary/difficulty-meter"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

import { formatDue, formatShortDate, isOverdue, relativeLate, relativeToNow } from "@/lib/assignments/dates"
import { TYPE_LABEL, type AssignmentType, type BoardColumn } from "@/lib/assignments/model"
import { DIFFICULTY_LABEL, DIFFICULTY_POINTS, type Difficulty } from "@/lib/aviary/difficulty"
import { startTask } from "@/lib/student/actions"
import { TopicTags } from "@/components/syllabus/topic-tags"
import type { TopicTag } from "@/lib/syllabus/model"

export type BoardTask = {
  id: string
  title: string
  type: AssignmentType
  difficulty: Difficulty
  dueAt: string
  column: BoardColumn
  completionPct: number
  openedAt: string | null
  submittedAt: string | null
  reviewedAt: string | null
  topic: string | null
  topics: TopicTag[]
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

/**
 * The only colour on the board, from DESIGN.md: a dot by each lane's name in
 * its hue's 600, and a badge count (100 fill, 300 border, 700 text for AA)
 * once something is in it. Empty lanes stay neutral. Blue is new work,
 * purple is underway, orange (attention) needs acting on, yellow (pending)
 * waits on the tutor, green (success) is done.
 */
const LANE_COLOUR: Record<BoardColumn, { dot: string; count: string }> = {
  assigned: { dot: "bg-blue-600", count: "border-blue-300 bg-blue-100 text-blue-700" },
  in_progress: { dot: "bg-purple-600", count: "border-purple-300 bg-purple-100 text-purple-700" },
  revise: { dot: "bg-orange-600", count: "border-orange-300 bg-orange-100 text-orange-700" },
  submitted: { dot: "bg-yellow-600", count: "border-yellow-300 bg-yellow-100 text-yellow-800" },
  finished: { dot: "bg-green-600", count: "border-green-300 bg-green-100 text-green-700" },
}

/**
 * Where a card may be dragged, from the lane it sits in. Starting is only a
 * matter of saying so; handing in needs work attached, so dropping there opens
 * the task at its hand-in tray instead of moving the card.
 */
const MOVES: Partial<Record<BoardColumn, BoardColumn[]>> = {
  assigned: ["in_progress", "submitted"],
  in_progress: ["submitted"],
}

const noop = () => () => {}

/** The drop highlight, in the lane's own hue. */
const LANE_DROP: Partial<Record<BoardColumn, string>> = {
  in_progress: "bg-purple-50 outline-purple-400",
  submitted: "bg-yellow-50 outline-yellow-500",
}

type DropState = "idle" | "target" | "blocked"

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
 * tone, not boxes; a bracket above them says whose turn each one is. A card
 * the student hasn't handed in can be dragged forward (see MOVES); otherwise
 * cards move by what happens in the task. Nothing here navigates: a task
 * opens in place through `onOpen`. Below `xl` the lanes scroll sideways and
 * snap. Touch needs a short press before a card lifts, so lanes still scroll.
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
  const [shownTasks, move] = React.useOptimistic(
    tasks,
    (state: BoardTask[], next: { id: string; column: BoardColumn }) =>
      state.map((task) => (task.id === next.id ? { ...task, column: next.column } : task))
  )
  const [dragging, setDragging] = React.useState<BoardTask | null>(null)
  // The overlay portals into <body>, which only exists once hydrated.
  const mounted = React.useSyncExternalStore(noop, () => true, () => false)
  // A drag that ends where it began still fires a click; don't open the task.
  const draggedAt = React.useRef(0)
  const open = React.useCallback(
    (id: string) => {
      if (Date.now() - draggedAt.current > 150) onOpen?.(id)
    },
    [onOpen]
  )

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  )

  const drop = ({ active, over }: DragEndEvent) => {
    setDragging(null)
    draggedAt.current = Date.now()
    const task = shownTasks.find((candidate) => candidate.id === active.id)
    const to = over?.id as BoardColumn | undefined
    if (!task || !to || !MOVES[task.column]?.includes(to)) return

    if (to === "submitted") {
      onOpen?.(task.id)
      return
    }
    React.startTransition(async () => {
      move({ id: task.id, column: to })
      const result = await startTask(task.id)
      if (result.error) toast.error(result.error)
    })
  }

  const allowed = dragging ? (MOVES[dragging.column] ?? []) : []
  const dropStateOf = (lane: BoardColumn): DropState =>
    !dragging || lane === dragging.column ? "idle" : allowed.includes(lane) ? "target" : "blocked"

  const lanes = groupTasks(shownTasks)
  const yourTurn = lanes.slice(0, YOUR_TURN_LANES).reduce((sum, { tasks }) => sum + tasks.length, 0)
  const tutorTurn = lanes[YOUR_TURN_LANES]?.tasks.length ?? 0

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setDragging(shownTasks.find((task) => task.id === active.id) ?? null)}
      onDragCancel={() => {
        setDragging(null)
        draggedAt.current = Date.now()
      }}
      onDragEnd={drop}
    >
      <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 pb-2 [scrollbar-width:thin] snap-x snap-mandatory scroll-px-4 sm:-mx-8 sm:scroll-px-8 sm:px-8 xl:mx-0 xl:overflow-visible xl:px-0">
        <div className="grid min-w-[68rem] grid-cols-5 gap-x-3 gap-y-3 xl:min-w-0">
          <Turn className="col-span-3" label="Your turn" count={yourTurn} />
          <Turn className="col-span-1" label="Your tutor's turn" count={tutorTurn} />
          <div aria-hidden />

          {lanes.map(({ lane, tasks }) => (
            <LaneColumn
              key={lane.key}
              lane={lane}
              tasks={tasks}
              timeZone={timeZone}
              onOpen={open}
              dropState={dropStateOf(lane.key)}
              draggingId={dragging?.id ?? null}
            />
          ))}
        </div>
      </div>
      {/* Portalled: an animated (transformed) ancestor would otherwise become
          the overlay's containing block and throw it off the cursor. */}
      {!mounted
        ? null
        : createPortal(
            <DragOverlay
              className="dub"
              dropAnimation={{ duration: 180, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
              {dragging ? (
                <div className="cursor-grabbing rounded-lg shadow-overlay">
                  <Card task={dragging} timeZone={timeZone} />
                </div>
              ) : null}
            </DragOverlay>,
            document.body
          )}
    </DndContext>
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
  dropState,
  draggingId,
}: {
  lane: Lane
  tasks: BoardTask[]
  timeZone: string
  onOpen?: (id: string) => void
  dropState: DropState
  draggingId: string | null
}) {
  const { setNodeRef, isOver } = useDroppable({ id: lane.key, disabled: dropState !== "target" })
  const id = `lane-${lane.key}`
  const finished = lane.key === "finished"
  const shown = finished ? tasks.slice(0, FINISHED_VISIBLE) : tasks
  const older = finished ? tasks.slice(FINISHED_VISIBLE) : []

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={id}
      className={cn(
        "flex min-h-72 snap-start flex-col gap-2 rounded-xl bg-surface-sunken p-2",
        "outline-2 -outline-offset-2 outline-transparent transition-[background-color,outline-color,opacity] duration-150",
        dropState === "target" && "outline-dashed outline-outline-strong",
        dropState === "target" && isOver && cn("outline-solid", LANE_DROP[lane.key]),
        dropState === "blocked" && "opacity-50"
      )}
    >
      <div className="flex h-8 items-center gap-2 px-2">
        <span aria-hidden className={cn("size-2 shrink-0 rounded-full", LANE_COLOUR[lane.key].dot)} />
        <h2 id={id} className="text-sm font-medium text-on-surface">
          {lane.title}
        </h2>
        <span
          className={cn(
            "rounded-full border px-1.5 py-px font-mono text-xs font-medium",
            tasks.length > 0 ? LANE_COLOUR[lane.key].count : "border-transparent text-on-surface-muted"
          )}
        >
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
              <DraggableCard task={task} timeZone={timeZone} onOpen={onOpen} lifted={task.id === draggingId} />
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
                <DraggableCard task={task} timeZone={timeZone} onOpen={onOpen} lifted={task.id === draggingId} />
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
      <Badge variant="purple">New</Badge>
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

/** What the task is worth: earned once it is finished, on offer until then. */
function Points({ task }: { task: BoardTask }) {
  const points = DIFFICULTY_POINTS[task.difficulty]
  const earned = task.column === "finished"
  return (
    <span
      title={`${DIFFICULTY_LABEL[task.difficulty]}: ${points} points ${earned ? "earned" : "when approved"}`}
      className="inline-flex shrink-0 items-center gap-1.5 text-on-surface-muted"
    >
      <DifficultyMeter difficulty={task.difficulty} />
      <span className={cn("font-mono text-xs tabular-nums", earned && "text-on-surface")}>+{points}</span>
      <span className="sr-only">
        {DIFFICULTY_LABEL[task.difficulty]}, {points} points {earned ? "earned" : "when approved"}
      </span>
    </span>
  )
}

function metaOf(task: BoardTask): string {
  return [TYPE_LABEL[task.type], task.topic].filter(Boolean).join(" · ")
}

function notHandedIn(task: BoardTask): boolean {
  return task.column === "assigned" || task.column === "in_progress"
}

/** A card that can be dragged forward, when its lane allows a move. */
function DraggableCard({
  task,
  timeZone,
  onOpen,
  lifted,
}: {
  task: BoardTask
  timeZone: string
  onOpen?: (id: string) => void
  lifted: boolean
}) {
  const { setNodeRef, listeners } = useDraggable({ id: task.id, disabled: !MOVES[task.column] })
  return (
    <div ref={setNodeRef} {...listeners} className={cn("touch-manipulation transition-opacity duration-150", lifted && "opacity-40")}>
      <Card task={task} timeZone={timeZone} onOpen={onOpen} />
    </div>
  )
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
        <TopicTags tags={task.topics} max={3} inline className="mt-1" />
      </span>

      {task.column === "in_progress" ? <Progress value={task.completionPct} label="Done" hideLabel /> : null}

      <span className="flex items-center justify-between gap-2">
        <Moment task={task} timeZone={timeZone} className="truncate" />
        <span className="flex shrink-0 items-center gap-3">
          <Files count={task.materialCount} />
          <Points task={task} />
        </span>
      </span>
    </button>
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
