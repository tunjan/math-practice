"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Users } from "lucide-react"
import { cn } from "cn"

import { Button, ButtonLink } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { deleteEvent, resetCalendarLink, saveEvent } from "@/lib/calendar/actions"
import {
  addMonths,
  formatMonth,
  monthOf,
  weekStart,
  type DayKey,
  type MonthKey,
} from "@/lib/calendar/dates"
import {
  placeByDay,
  plansByWeek,
  type CalendarItem,
  type EventItem,
  type Person,
  type WeekPlan,
} from "@/lib/calendar/model"

import { DayPanel } from "./day-panel"
import {
  EventDialog,
  type DeleteEventAction,
  type EventDraft,
  type SaveEventAction,
} from "./event-dialog"
import { MonthGrid } from "./month-grid"
import { SubscribeDialog, type ResetLinkAction } from "./subscribe-dialog"

/**
 * A day chosen by keyboard in a neighbouring month. The view remounts when the
 * month changes, and the new instance picks this up so focus lands where the
 * arrow key pointed, not on the 1st.
 */
let pendingSelection: { month: MonthKey; day: DayKey } | null = null

/**
 * The calendar screen in the Dub page anatomy (DESIGN.md › Layout): a 64px
 * header with the one primary action, a toolbar row, then the month card with
 * the selected day's agenda beside it.
 *
 * The month comes from the server (it decides what to load); the selected
 * day is local, mirrored into the URL with replaceState so a refresh or a
 * shared link reopens the same day without a round trip on every click.
 * Adjacent months are prefetched, so paging through them is instant.
 */
export function CalendarView({
  role,
  basePath,
  month,
  selected: initialSelected,
  today,
  timeZone,
  items,
  plans = [],
  students = [],
  studentId = null,
  feedUrl,
  saveAction = saveEvent,
  deleteAction = deleteEvent,
  resetAction = resetCalendarLink,
}: {
  role: "tutor" | "student"
  basePath: string
  month: MonthKey
  selected: DayKey
  today: DayKey
  timeZone: string
  items: CalendarItem[]
  /** Planned syllabus topics as week bars. */
  plans?: WeekPlan[]
  /** Tutor only: the roster, for filtering and sharing. */
  students?: Person[]
  studentId?: string | null
  feedUrl: string
  /** Injectable; default to the real server actions. */
  saveAction?: SaveEventAction
  deleteAction?: DeleteEventAction
  resetAction?: ResetLinkAction
}) {
  const router = useRouter()
  const gridRef = React.useRef<HTMLDivElement>(null)
  const monthTitleId = React.useId()

  const [selected, setSelected] = React.useState<DayKey>(() =>
    pendingSelection?.month === month ? pendingSelection.day : initialSelected
  )
  const [draft, setDraft] = React.useState<EventDraft | null>(null)

  const placements = React.useMemo(() => placeByDay(items, timeZone), [items, timeZone])
  const weekPlans = React.useMemo(() => plansByWeek(plans), [plans])
  // Several students' plans share a week only on the tutor's unfiltered view.
  const showPerson = role === "tutor" && !studentId
  const planHref = React.useCallback(
    (plan: WeekPlan) => (role === "tutor" ? `/tutor/students/${plan.studentId}` : "/student/syllabus"),
    [role]
  )

  const href = React.useCallback(
    (next: { month?: MonthKey; day?: DayKey; student?: string | null }) => {
      const params = new URLSearchParams()
      if (next.month) params.set("month", next.month)
      if (next.day) params.set("day", next.day)
      const student = next.student === undefined ? studentId : next.student
      if (student) params.set("student", student)
      const query = params.toString()
      return query ? `${basePath}?${query}` : basePath
    },
    [basePath, studentId]
  )

  const focusDay = React.useCallback((day: DayKey) => {
    gridRef.current?.querySelector<HTMLElement>(`[data-day="${day}"]`)?.focus()
  }, [])

  // Arrived here by arrowing out of the previous month: finish the move.
  React.useEffect(() => {
    if (pendingSelection?.month !== month) return
    const day = pendingSelection.day
    pendingSelection = null
    window.history.replaceState(null, "", href({ month, day }))
    focusDay(day)
  }, [month, href, focusDay])

  const select = React.useCallback(
    (day: DayKey, { focus }: { focus: boolean }) => {
      if (monthOf(day) !== month) {
        // Navigate to the plain month URL, the one that was prefetched.
        pendingSelection = { month: monthOf(day), day }
        router.push(href({ month: monthOf(day) }), { scroll: false })
        return
      }
      setSelected(day)
      window.history.replaceState(null, "", href({ month, day }))
      if (focus) focusDay(day)
    },
    [month, href, router, focusDay]
  )

  const openNew = React.useCallback(
    (day: DayKey) =>
      setDraft({ mode: "create", day, share: role === "tutor" ? (studentId ?? "") : "" }),
    [role, studentId]
  )
  const openEdit = React.useCallback((event: EventItem) => setDraft({ mode: "edit", event }), [])

  const inThisMonth = today.startsWith(month)

  // N adds an event on the selected day; T jumps to today. Never while typing
  // or while a dialog is open.
  const onShortcut = React.useEffectEvent((key: "n" | "t") => {
    if (key === "n") openNew(selected)
    else if (inThisMonth) select(today, { focus: false })
    else router.push(href({}), { scroll: false })
  })
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest("input, textarea, select, [contenteditable], [role=dialog], [role=alertdialog], [role=listbox]"))
        return
      if (document.querySelector("[role=dialog], [role=alertdialog]")) return
      const key = event.key.toLowerCase()
      if (key !== "n" && key !== "t") return
      event.preventDefault()
      onShortcut(key)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <div className="dub flex flex-1 flex-col bg-surface">
      <header className="border-b border-outline">
        <div className="mx-auto flex h-12 w-full max-w-screen-xl items-center justify-between gap-4 px-3 sm:h-16 lg:px-6">
          <h1 className="text-lg leading-7 font-semibold text-on-surface">Calendar</h1>
          <Button variant="primary" className="h-9 gap-2 rounded-lg px-3 sm:h-10" onClick={() => openNew(selected)}>
            <Plus aria-hidden />
            New event
            <Kbd className="hidden h-5 min-w-5 rounded-sm border-0 bg-neutral-700 px-1.5 text-xs font-light text-neutral-300 md:inline-flex">
              N
            </Kbd>
          </Button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col gap-4 px-3 pt-5 pb-12 lg:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                inThisMonth ? (
                  <Button
                    className={controlClass}
                    disabled={selected === today}
                    onClick={() => select(today, { focus: false })}
                  />
                ) : (
                  <ButtonLink className={controlClass} href={href({})} prefetch scroll={false} />
                )
              }
            >
              Today
            </TooltipTrigger>
            <TooltipContent className={TOOLTIP_CLASS}>
              <Kbd className="h-5 min-w-5 rounded-sm px-1.5 text-xs font-light">T</Kbd>
            </TooltipContent>
          </Tooltip>

          <div className="flex h-10 overflow-hidden rounded-lg border border-outline">
            <Link
              href={href({ month: addMonths(month, -1) })}
              prefetch
              scroll={false}
              aria-label={`Previous month, ${formatMonth(addMonths(month, -1))}`}
              className={stepperClass}
            >
              <ChevronLeft aria-hidden className="size-4" />
            </Link>
            <Link
              href={href({ month: addMonths(month, 1) })}
              prefetch
              scroll={false}
              aria-label={`Next month, ${formatMonth(addMonths(month, 1))}`}
              className={cn(stepperClass, "border-l border-outline")}
            >
              <ChevronRight aria-hidden className="size-4" />
            </Link>
          </div>

          <h2 id={monthTitleId} aria-live="polite" className="ml-2 text-base font-semibold text-on-surface">
            {formatMonth(month)}
          </h2>

          <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
            {role === "tutor" && students.length > 0 ? (
              <StudentFilter
                students={students}
                value={studentId}
                onChange={(next) => router.push(href({ month, student: next }), { scroll: false })}
              />
            ) : null}
            <SubscribeDialog feedUrl={feedUrl} resetAction={resetAction} />
          </div>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div ref={gridRef} className="min-w-0">
            <MonthGrid
              month={month}
              today={today}
              selected={selected}
              placements={placements}
              plans={weekPlans}
              showPerson={showPerson}
              onSelect={select}
              labelledBy={monthTitleId}
            />
          </div>
          <DayPanel
            day={selected}
            today={today}
            role={role}
            placements={placements.get(selected) ?? []}
            plans={weekPlans.get(weekStart(selected)) ?? []}
            planHref={planHref}
            showPerson={showPerson}
            onEdit={openEdit}
            className="lg:sticky lg:top-4"
          />
        </div>
      </div>

      <EventDialog
        draft={draft}
        onClose={() => setDraft(null)}
        role={role}
        timeZone={timeZone}
        today={today}
        students={students}
        saveAction={saveAction}
        deleteAction={deleteAction}
      />
    </div>
  )
}

/** DESIGN.md › Tooltip: white, hairline, 12px radius. Portalled, so scoped here. */
const TOOLTIP_CLASS =
  "dub rounded-xl border border-outline bg-surface px-2 py-1.5 text-sm text-on-surface-secondary shadow-sm **:data-[side]:hidden"

/** DESIGN.md › Buttons (secondary): 40px, 8px radius, hairline. */
const controlClass = "h-10 rounded-lg border-outline px-3"

const stepperClass = cn(
  "flex w-10 items-center justify-center bg-surface text-on-surface-muted",
  "transition-colors duration-75 hover:bg-surface-muted hover:text-on-surface"
)

const ALL = "all"

/** Tutor only: narrow the month to one student. */
function StudentFilter({
  students,
  value,
  onChange,
}: {
  students: Person[]
  value: string | null
  onChange: (student: string | null) => void
}) {
  const selected = students.find((s) => s.id === value)
  return (
    <Select
      value={value ?? ALL}
      onValueChange={(next) => onChange(next && next !== ALL ? (next as string) : null)}
    >
      <SelectTrigger
        aria-label="Show calendar for"
        className={cn(
          "flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-outline bg-surface px-3 text-sm text-on-surface outline-none sm:w-52 sm:flex-none",
          "transition-[border-color,box-shadow] duration-150 hover:bg-surface-muted",
          "data-popup-open:border-neutral-500 data-popup-open:ring-4 data-popup-open:ring-neutral-200"
        )}
      >
        <Users aria-hidden className="size-4 shrink-0 text-on-surface-muted" />
        <span className="min-w-0 flex-1 truncate text-left">{selected?.name ?? "All students"}</span>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-on-surface-muted" />
      </SelectTrigger>
      <SelectContent align="end" className="dub min-w-52 rounded-lg p-1">
        <SelectItem value={ALL} className="h-9 rounded-md text-sm">
          All students
        </SelectItem>
        <SelectSeparator className="-mx-1 my-1" />
        {students.map((student) => (
          <SelectItem key={student.id} value={student.id} className="h-9 rounded-md text-sm">
            {student.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
