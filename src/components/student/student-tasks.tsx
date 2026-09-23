"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { TaskList, type BoardTask } from "@/components/student/task-board"
import { TaskDialogBody, TaskUnavailable } from "@/components/student/task-dialog"
import { TaskDialogShell } from "@/components/student/task-dialog-frame"
import { isOverdue } from "@/lib/assignments/dates"
import { formatDayShort, type DayKey } from "@/lib/calendar/dates"
import { recordOpen } from "@/lib/student/actions"
import type { StudentTask } from "@/lib/student/load-task"

/** Signed file URLs last an hour; refresh them quietly before they rot. */
const STALE_AFTER_MS = 50 * 60_000

/** The unit the student is on, for the link to their plan. */
export type PlanGlance = { unitTitle: string; dueOn: DayKey; selfPct: number | null }

/**
 * The student's task page. The list and every task's detail arrive together,
 * so a task opens as a plain dialog on top of the list: no navigation, no
 * loading state. The open task is mirrored in `?task=` with a history entry,
 * so Back closes it and the URL can be shared or refreshed.
 */
export function StudentTasks({
  firstName,
  tasks,
  plan = null,
  timeZone,
}: {
  firstName: string
  tasks: StudentTask[]
  plan?: PlanGlance | null
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
          {plan ? (
            <Link
              href="/student/plan"
              style={{ animationDelay: "120ms" }}
              className="group/plan mt-1 flex w-fit max-w-full animate-slide-up-fade items-center gap-3 rounded-full border border-outline py-1.5 pr-3 pl-4 text-sm transition-colors hover:bg-surface-sunken"
            >
              <span className="truncate">
                <span className="text-on-surface-muted">Now </span>
                <span className="font-medium text-on-surface">{plan.unitTitle}</span>
              </span>
              <span className="shrink-0 font-mono text-xs text-on-surface-muted">
                due {formatDayShort(plan.dueOn)}
                {plan.selfPct !== null ? ` · ${plan.selfPct}%` : null}
              </span>
              <ArrowRight
                aria-hidden
                className="size-4 shrink-0 text-on-surface-muted transition-transform group-hover/plan:translate-x-0.5"
              />
            </Link>
          ) : null}
        </header>

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
          <TaskDialogBody key={shown.id} task={shown} timeZone={timeZone} />
        ) : shownId ? (
          <TaskUnavailable />
        ) : null}
      </TaskDialogShell>
    </div>
  )
}

function toBoardTask(task: StudentTask): BoardTask {
  return {
    id: task.id,
    title: task.title,
    type: task.type,
    dueAt: task.dueAt,
    column: task.column,
    completionPct: task.completionPct,
    openedAt: task.openedAt,
    submittedAt: task.submittedAt,
    reviewedAt: task.reviewedAt,
    topic: task.topic,
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
