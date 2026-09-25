"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { BirdFigure } from "@/components/aviary/bird-figure"
import { TaskList, type BoardTask } from "@/components/student/task-board"
import { TaskDialogBody, TaskUnavailable } from "@/components/student/task-dialog"
import { TaskDialogShell } from "@/components/student/task-dialog-frame"
import { isOverdue } from "@/lib/assignments/dates"
import type { BirdArt, Outfit } from "@/lib/aviary/catalog"
import { recordOpen } from "@/lib/student/actions"
import type { StudentTask } from "@/lib/student/load-task"

/** Signed file URLs last an hour; refresh them quietly before they rot. */
const STALE_AFTER_MS = 50 * 60_000

/** The student's bird and points, for the link to their aviary. */
export type CompanionGlance = { bird: BirdArt; outfit: Outfit; balance: number }

/**
 * The student's task page. The list and every task's detail arrive together,
 * so a task opens as a plain dialog on top of the list: no navigation, no
 * loading state. The open task is mirrored in `?task=` with a history entry,
 * so Back closes it and the URL can be shared or refreshed.
 */
export function StudentTasks({
  firstName,
  tasks,
  companion = null,
  timeZone,
}: {
  firstName: string
  tasks: StudentTask[]
  companion?: CompanionGlance | null
  timeZone: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const openId = searchParams.get("task")

  // Keep showing the last task while the dialog animates out.
  const [shownId, setShownId] = React.useState(openId)
  if (openId !== null && openId !== shownId) setShownId(openId)

  // Whether we pushed the entry for the open task, so closing can pop it.
  const pushed = React.useRef(false)
  const recorded = React.useRef(new Set<string>())
  // When this data (and its signed URLs) arrived.
  const loadedAt = React.useRef(0)
  React.useEffect(() => {
    loadedAt.current = Date.now()
  }, [tasks])

  const shown = shownId ? tasks.find((task) => task.id === shownId) : undefined
  const boardTasks = React.useMemo(() => tasks.map(toBoardTask), [tasks])

  const open = (id: string) => {
    pushed.current = true
    window.history.pushState(null, "", `${pathname}?task=${encodeURIComponent(id)}`)
    if (Date.now() - loadedAt.current > STALE_AFTER_MS) router.refresh()
  }

  const close = () => {
    if (pushed.current) {
      pushed.current = false
      window.history.back()
    } else {
      window.history.replaceState(null, "", pathname)
    }
  }

  // The first look is recorded for the tutor, silently. The action
  // revalidates this page, so the list drops its "New" flag underneath.
  React.useEffect(() => {
    const task = openId ? tasks.find((candidate) => candidate.id === openId) : undefined
    if (!task || task.openedAt !== null || recorded.current.has(task.id)) return
    recorded.current.add(task.id)
    void recordOpen(task.id)
  }, [openId, tasks])

  return (
    <div className="dub flex flex-1 flex-col bg-surface">
      <div className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col gap-10 px-4 pt-10 pb-20 sm:px-8 sm:pt-14">
        <div className="flex items-start justify-between gap-6">
          <header className="flex min-w-0 flex-col gap-3">
            <h1 className="animate-slide-up-fade font-display text-3xl leading-[1.2] font-medium text-pretty text-on-surface sm:text-4xl sm:leading-[1.15]">
              {firstName ? `Hello, ${firstName}` : "Your tasks"}
            </h1>
            <p
              suppressHydrationWarning
              style={{ animationDelay: "80ms" }}
              className="max-w-lg animate-slide-up-fade text-base text-pretty text-on-surface-muted sm:text-lg sm:leading-7"
            >
              {summarise(tasks)}
            </p>
          </header>
          {companion ? <CompanionLink companion={companion} /> : null}
        </div>

        {tasks.length > 0 ? (
          <div className="animate-slide-up-fade" style={{ animationDelay: "160ms" }}>
            <TaskList tasks={boardTasks} timeZone={timeZone} onOpen={open} />
          </div>
        ) : null}
      </div>

      <TaskDialogShell
        open={openId !== null}
        onOpenChange={(next) => {
          if (!next) close()
        }}
        onClosed={() => setShownId(null)}
      >
        {shown ? (
          <TaskDialogBody key={shown.id} task={shown} timeZone={timeZone} viewerName={firstName} />
        ) : shownId ? (
          <TaskUnavailable />
        ) : null}
      </TaskDialogShell>
    </div>
  )
}

/** The student's bird, dressed, with their points: the way into the aviary. */
function CompanionLink({ companion }: { companion: CompanionGlance }) {
  const { bird, outfit, balance } = companion
  return (
    <Link
      href="/student/aviary"
      aria-label={`Aviary: ${bird.name}, ${balance} points to spend`}
      style={{ animationDelay: "120ms" }}
      className="group/bird hidden shrink-0 animate-slide-up-fade items-end gap-2 rounded-xl py-1 pr-3 pl-1 transition-colors hover:bg-surface-sunken sm:flex"
    >
      <BirdFigure
        bird={bird}
        outfit={outfit}
        className="w-[80px] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/bird:-translate-y-0.5"
      />
      <span className="flex flex-col pb-2">
        <span className="font-display text-2xl leading-none font-medium text-on-surface tabular-nums">
          {balance.toLocaleString("en-GB")}
        </span>
        <span className="mt-1 flex items-center gap-1 text-xs text-on-surface-muted">
          points
          <ArrowRight aria-hidden className="size-3 transition-transform group-hover/bird:translate-x-0.5" />
        </span>
      </span>
    </Link>
  )
}

function toBoardTask(task: StudentTask): BoardTask {
  return {
    id: task.id,
    title: task.title,
    type: task.type,
    difficulty: task.difficulty,
    dueAt: task.dueAt,
    column: task.column,
    completionPct: task.completionPct,
    openedAt: task.openedAt,
    submittedAt: task.submittedAt,
    reviewedAt: task.reviewedAt,
    topic: task.topic,
    topics: task.topics,
    materialCount: task.materials.length,
  }
}

/** Leads with what needs the student, in the words the list uses. */
function summarise(tasks: StudentTask[]): string {
  if (tasks.length === 0) return "Nothing set yet. When your tutor sets you work, it appears here."

  const count = (column: StudentTask["column"]) => tasks.filter((task) => task.column === column).length
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`
  const toStart = count("assigned")
  const inProgress = count("in_progress")
  const revise = count("revise")
  const withTutor = count("submitted")
  const overdue = tasks.filter(
    (task) => (task.column === "assigned" || task.column === "in_progress") && isOverdue(task.dueAt)
  ).length

  const parts: string[] = []
  if (toStart > 0) parts.push(`${plural(toStart, "task")} to start`)
  if (inProgress > 0) parts.push(`${inProgress} in progress`)
  if (revise > 0) parts.push(`${revise} with feedback to act on`)

  if (parts.length === 0) {
    if (withTutor > 0) return `Nothing to do right now. ${plural(withTutor, "task")} with your tutor.`
    return "You're all caught up. Everything you've handed in has been approved."
  }

  const lead = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`
  const sentence = lead.charAt(0).toUpperCase() + lead.slice(1)
  return overdue > 0 ? `${sentence}. ${overdue} ${overdue === 1 ? "is" : "are"} overdue.` : `${sentence}.`
}
