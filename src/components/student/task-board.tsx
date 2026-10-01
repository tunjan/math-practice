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
import { Flag } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { DifficultyMeter } from "@/components/assignments/difficulty-meter"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

import { dueSoon, formatDue, formatShortDate, isOverdue, relativeLate, relativeToNow, timeLeft } from "@/lib/assignments/dates"
import { type AssignmentType, type BoardColumn } from "@/lib/assignments/model"
import { DIFFICULTY_LABEL, type Difficulty } from "@/lib/assignments/difficulty"
import { startTask } from "@/lib/student/actions"
import { topicColor, type TopicTag } from "@/lib/syllabus/model"

export type BoardTask = {
  id: string
  title: string
  type: AssignmentType
  difficulty: Difficulty
  dueAt: string
  column: BoardColumn
  exerciseCount: number
  exercisesDone: number
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
 * its hue's 600. The count badge stays neutral regardless of lane colour.
 * Blue is new work, purple is underway, orange (attention) needs acting on,
 * yellow (pending) waits on the tutor, green (success) is done.
 */
const LANE_COLOUR: Record<BoardColumn, { dot: string }> = {
  assigned: { dot: "bg-info" },
  in_progress: { dot: "bg-violet" },
  revise: { dot: "bg-warning" },
  submitted: { dot: "bg-warning" },
  finished: { dot: "bg-success" },
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
  in_progress: "bg-violet-container/50 outline-violet/40",
  submitted: "bg-warning/10 outline-warning/60",
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
 * the student hasn't handed in can be dragged forward (see MOVES), and one not
 * yet started carries a Start button that does the same without a drag;
 * otherwise cards move by what happens in the task. Nothing here navigates: a task
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

  const start = React.useCallback(
    (id: string) => {
      React.startTransition(async () => {
        move({ id, column: "in_progress" })
        const result = await startTask(id)
        if (result.error) toast.error(result.error)
      })
    },
    [move]
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
    start(task.id)
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
              onStart={start}
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
             
              dropAnimation={{ duration: 180, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
              {dragging ? (
                <div className="cursor-grabbing rounded-lg shadow-lg">
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
      <span className="text-xs font-medium whitespace-nowrap text-foreground/80">{label}</span>
      <span className="font-mono text-xs text-muted-foreground">{count}</span>
      <span aria-hidden className="h-2 flex-1 translate-y-1 rounded-tr-md border-t border-r border-input" />
    </div>
  )
}

function LaneColumn({
  lane,
  tasks,
  timeZone,
  onOpen,
  onStart,
  dropState,
  draggingId,
}: {
  lane: Lane
  tasks: BoardTask[]
  timeZone: string
  onOpen?: (id: string) => void
  onStart?: (id: string) => void
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
        "flex min-h-72 snap-start flex-col gap-2 rounded-2xl bg-muted p-2",
        "outline-2 -outline-offset-2 outline-transparent transition-[background-color,outline-color,opacity] duration-150",
        dropState === "target" && "outline-dashed outline-input",
        dropState === "target" && isOver && cn("outline-solid", LANE_DROP[lane.key]),
        dropState === "blocked" && "opacity-50"
      )}
    >
      <div className="flex h-8 items-center gap-2 px-2">
        <span aria-hidden className={cn("size-2 shrink-0 rounded-full", LANE_COLOUR[lane.key].dot)} />
        <h2 id={id} className="text-sm font-medium text-foreground">
          {lane.title}
        </h2>
        <span
          className={cn(
            "rounded-full border px-1.5 py-px font-mono text-xs font-medium",
            tasks.length > 0
              ? "border-border bg-muted text-muted-foreground"
              : "border-transparent text-muted-foreground"
          )}
        >
          {tasks.length}
          <span className="sr-only">{tasks.length === 1 ? " task" : " tasks"}</span>
        </span>
      </div>

      {tasks.length === 0 ? (
        <p className="px-2 py-1 text-sm text-pretty text-muted-foreground">{lane.empty}</p>
      ) : (
        <ul role="list" className="flex flex-col gap-2">
          {shown.map((task) => (
            <li key={task.id}>
              <DraggableCard task={task} timeZone={timeZone} onOpen={onOpen} onStart={onStart} lifted={task.id === draggingId} />
            </li>
          ))}
        </ul>
      )}

      {older.length > 0 ? (
        <Collapsible className="group/more">
          <CollapsibleTrigger className="flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium text-muted-foreground transition-colors duration-150 outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/25">
            <span className="group-data-open/more:hidden">Show {older.length} older</span>
            <span className="hidden group-data-open/more:inline">Show fewer</span>
          </CollapsibleTrigger>
          <CollapsibleContent render={<ul role="list" />} className="mt-2 flex flex-col gap-2">
            {older.map((task) => (
              <li key={task.id}>
                <DraggableCard task={task} timeZone={timeZone} onOpen={onOpen} onStart={onStart} lifted={task.id === draggingId} />
              </li>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </section>
  )
}

/* ── One task ─────────────────────────────────────────────────────────────── */

/** A state worth naming beside the title. The lane says the rest; overdue is carried by the date. */
function stateOf(task: BoardTask): React.ReactNode {
  if (task.column === "assigned" && task.openedAt === null) return (
      <span className="inline-flex h-5 shrink-0 items-center gap-1.5 text-xs font-medium text-info">
        <span aria-hidden className="size-1.5 rounded-full bg-info" />
        New
      </span>
    )
  return null
}

type Urgency = "none" | "soon" | "late"

/**
 * The one date that matters for a task where it sits, always labelled. Work
 * not yet handed in warns in amber the day before and the day it's due, so
 * red is never the first the student hears of a deadline.
 */
function momentOf(task: BoardTask, timeZone: string): { text: string; iso: string; urgency: Urgency } {
  switch (task.column) {
    case "submitted": {
      const iso = task.submittedAt ?? task.dueAt
      return { text: `Handed in ${relativeToNow(iso)}`, iso, urgency: "none" }
    }
    case "revise": {
      const iso = task.reviewedAt ?? task.dueAt
      return { text: `Reviewed ${relativeToNow(iso)}`, iso, urgency: "none" }
    }
    case "finished": {
      const iso = task.reviewedAt ?? task.dueAt
      return { text: `Approved ${formatShortDate(iso, timeZone)}`, iso, urgency: "none" }
    }
    default: {
      if (isOverdue(task.dueAt)) {
        return { text: capitalise(relativeLate(task.dueAt)), iso: task.dueAt, urgency: "late" }
      }
      const soon = dueSoon(task.dueAt, timeZone)
      return {
        text: soon ? `Due ${soon}` : timeLeft(task.dueAt, timeZone),
        iso: task.dueAt,
        urgency: soon ? "soon" : "none",
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
    <Hint label={formatDue(moment.iso, timeZone)}>
      <time
        suppressHydrationWarning
        dateTime={moment.iso}
        className={cn(
          "flex min-w-0 items-center gap-1.5 text-xs whitespace-nowrap",
          moment.urgency === "late" && "font-medium text-destructive",
          moment.urgency === "soon" && "font-medium text-warning",
          moment.urgency === "none" && "text-muted-foreground",
          className
        )}
      >
        <Flag className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{moment.text}</span>
      </time>
    </Hint>
  )
}

/** How hard the task is, shown as bars only — no point value. */
function DifficultyIndicator({ task }: { task: BoardTask }) {
  return (
    <Hint label={DIFFICULTY_LABEL[task.difficulty]}>
      <span className="inline-flex shrink-0 items-center text-muted-foreground">
        <DifficultyMeter difficulty={task.difficulty} />
        <span className="sr-only">{DIFFICULTY_LABEL[task.difficulty]}</span>
      </span>
    </Hint>
  )
}

/**
 * What the task covers, as one small tag: the first subtopic's code in its
 * strand's colour, with the full names on hover. Tasks without syllabus tags
 * fall back to the tutor's category, if any.
 */
function CoverageTag({ task }: { task: BoardTask }) {
  const [first, ...rest] = task.topics
  if (!first) {
    return task.topic ? (
      <Badge render={<span />} variant="neutral" className="min-w-0 shrink">
        <span className="truncate">{task.topic}</span>
      </Badge>
    ) : null
  }
  return (
    <Hint label={task.topics.map((t) => `${t.code} ${t.title}`).join("\n")}>
      <span className="inline-flex w-fit max-w-full">
        <Badge render={<span />} variant={topicColor(first.topic)} className="tabular-nums">
          {first.code}
          {rest.length > 0 ? <span className="opacity-60">+{rest.length}</span> : null}
        </Badge>
      </span>
    </Hint>
  )
}

/**
 * A hover hint on part of a card. The trigger is the child itself, kept a
 * plain element: the card around it is already the button.
 */
function Hint({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent>
        <span className="whitespace-pre-line">{label}</span>
      </TooltipContent>
    </Tooltip>
  )
}

function notHandedIn(task: BoardTask): boolean {
  return task.column === "assigned" || task.column === "in_progress"
}

/** A card that can be dragged forward, when its lane allows a move. */
function DraggableCard({
  task,
  timeZone,
  onOpen,
  onStart,
  lifted,
}: {
  task: BoardTask
  timeZone: string
  onOpen?: (id: string) => void
  onStart?: (id: string) => void
  lifted: boolean
}) {
  const movable = Boolean(MOVES[task.column])
  const { setNodeRef, listeners } = useDraggable({ id: task.id, disabled: !movable })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      className={cn(
        "touch-manipulation transition-opacity duration-150",
        movable && "[&_[data-task-card]]:cursor-grab",
        lifted && "opacity-40"
      )}
    >
      <Card task={task} timeZone={timeZone} onOpen={onOpen} onStart={onStart} />
    </div>
  )
}

/** Keeps a press on a control inside a card from lifting the card. */
const stopPress = (event: React.SyntheticEvent) => event.stopPropagation()

/**
 * One task on the board. The whole card opens it; a task not yet started also
 * has Start in its footer. Start sits over the card rather than inside it (a
 * button can't hold a button), in room the footer keeps free for it.
 */
function Card({
  task,
  timeZone,
  onOpen,
  onStart,
}: {
  task: BoardTask
  timeZone: string
  onOpen?: (id: string) => void
  onStart?: (id: string) => void
}) {
  const state = stateOf(task)
  const late = notHandedIn(task) && isOverdue(task.dueAt)
  const startable = task.column === "assigned"
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpen?.(task.id)}
        aria-haspopup="dialog"
        data-task-card={task.id}
        className={cn(
          "flex w-full cursor-pointer flex-col gap-3 rounded-lg border bg-background p-3 text-left",
          "transition-[border-color,filter] duration-150 hover:drop-shadow-[0_2px_4px_#222A350D]",
          late ? "border-destructive/40 hover:border-destructive/60" : "border-border hover:border-input"
        )}
      >
        <span className="flex items-start justify-between gap-2">
          <span className="line-clamp-3 text-sm leading-5 font-medium text-pretty text-foreground">{task.title}</span>
          {state}
        </span>

        {/* A single piece of work has nothing to count. */}
        {task.column === "in_progress" && task.exerciseCount > 1 ? (
          <Progress value={task.exercisesDone} max={task.exerciseCount} label="Exercises done" hideLabel />
        ) : null}

        <CoverageTag task={task} />

        <span className="-mx-3 flex items-center justify-between gap-2 border-t border-border px-3 pt-3">
          <Moment task={task} timeZone={timeZone} />
          <span className="flex shrink-0 items-center gap-2">
            <DifficultyIndicator task={task} />
            {startable ? <span aria-hidden className="w-10.5" /> : null}
          </span>
        </span>
      </button>
      {startable ? (
        <Button
          size="sm"
          aria-label={`Start ${task.title}`}
          onClick={() => onStart?.(task.id)}
          onMouseDown={stopPress}
          onTouchStart={stopPress}
          className="absolute right-1.5 bottom-1.5 h-7 w-12 rounded-sm px-0 text-xs after:absolute after:-inset-1.5"
        >
          Start
        </Button>
      ) : null}
    </div>
  )
}

/* ── Loading ───────────────────────────────────────────────────────────────── */

function Bar({ className }: { className: string }) {
  return <span className={cn("block rounded-md bg-muted motion-safe:animate-pulse", className)} />
}

/** The page's shape while it loads. */
export function TaskPageSkeleton() {
  return (
    <div className=" flex flex-1 flex-col bg-background">
      <div aria-busy="true" className="mx-auto flex w-full max-w-screen-xl flex-col gap-10 overflow-hidden px-4 pt-10 pb-20 sm:px-8 sm:pt-14">
        <div className="flex flex-col gap-3">
          <Bar className="h-9 w-64 sm:h-[41px]" />
          <Bar className="h-6 w-80 max-w-full sm:h-7" />
        </div>
        <div className="grid min-w-[68rem] grid-cols-5 gap-3 xl:min-w-0">
          <Bar className="col-span-5 mx-1 h-4 w-24" />
          {[2, 1, 1, 1, 2].map((cards, lane) => (
            <div key={lane} className="flex min-h-72 flex-col gap-2 rounded-2xl bg-muted p-2">
              <Bar className="mx-2 my-2.5 h-3 w-20 bg-border" />
              {Array.from({ length: cards }, (_, index) => (
                <div key={index} className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3">
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
