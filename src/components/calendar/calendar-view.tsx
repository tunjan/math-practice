"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, ChevronsUpDown, Plus, Users } from "lucide-react"
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
  type DayKey,
  type MonthKey,
} from "@/lib/calendar/dates"
import {
  placeByDay,
  type CalendarItem,
  type DayPlacement,
  type EventItem,
  type Person,
} from "@/lib/calendar/model"

import { DayPanel, TOOLTIP_CLASS } from "./day-panel"
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
 * The calendar screen, in the Dub idiom of the student task page: a display
 * heading over a ruled column, a toolbar band, then the month as a ledger
 * with the selected day's cards beside it.
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
  /** Tutor only: the roster, for filtering and sharing. */
  students?: Person[]
  studentId?: string | null
  feedUrl: string
  /** Swapped out by the styleguide, which must never write. */
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

  const filteredStudent = students.find((s) => s.id === studentId)
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
      {/* Anchored to the sidebar: its edge is the column's left rule, so only
          the right rule is drawn. */}
      <div className="flex w-full max-w-[1320px] flex-1 flex-col border-outline min-[1320px]:border-r">
        <header className="relative flex flex-col gap-6 overflow-hidden px-4 pt-10 pb-8 sm:flex-row sm:items-end sm:justify-between sm:px-12 sm:pt-14 sm:pb-10">
          <div className="relative flex min-w-0 flex-col gap-3">
            <h1 className="animate-slide-up-fade font-display text-3xl leading-[1.2] font-medium text-on-surface sm:text-4xl sm:leading-[1.15]">
              Calendar
            </h1>
            <p
              style={{ animationDelay: "80ms" }}
              className="max-w-lg animate-slide-up-fade text-base text-pretty text-on-surface-muted sm:text-lg sm:leading-7"
            >
              {summarise(placements, month, filteredStudent?.name)}
            </p>
          </div>
          <div
            style={{ animationDelay: "120ms" }}
            className="relative flex shrink-0 animate-slide-up-fade items-center gap-2"
          >
            <SubscribeDialog feedUrl={feedUrl} resetAction={resetAction} />
            <Button variant="primary" className="pr-2.5" onClick={() => openNew(selected)}>
              <Plus aria-hidden />
              New event
              <Kbd className="ml-1 h-5 min-w-5 rounded border-white/20 max-sm:hidden bg-white/10 px-1 text-[11px] text-white/80">
                N
              </Kbd>
            </Button>
          </div>
        </header>

        <div
          style={{ animationDelay: "160ms" }}
          className="flex animate-slide-up-fade flex-wrap items-center gap-3 border-t border-outline px-4 py-3 sm:px-12"
        >
          <h2
            id={monthTitleId}
            aria-live="polite"
            className="min-w-0 font-display text-xl leading-7 font-medium text-on-surface sm:w-48"
          >
            {formatMonth(month)}
          </h2>

          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-md border border-outline-strong shadow-[0_1px_2px_rgb(0_0_0/0.05)]">
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
                className={cn(stepperClass, "border-l border-outline-strong")}
              >
                <ChevronRight aria-hidden className="size-4" />
              </Link>
            </div>

            <Tooltip>
              <TooltipTrigger
                render={
                  inThisMonth ? (
                    <Button
                      size="sm"
                      disabled={selected === today}
                      onClick={() => select(today, { focus: false })}
                    />
                  ) : (
                    <ButtonLink size="sm" href={href({})} prefetch scroll={false} />
                  )
                }
              >
                Today
              </TooltipTrigger>
              <TooltipContent className={TOOLTIP_CLASS}>
                <span className="inline-flex items-center gap-2">
                  Jump to today
                  <Kbd className="h-5 min-w-5 rounded px-1 text-[11px]">T</Kbd>
                </span>
              </TooltipContent>
            </Tooltip>
          </div>

          {role === "tutor" && students.length > 0 ? (
            <StudentFilter
              students={students}
              value={studentId}
              onChange={(next) => router.push(href({ month, student: next }), { scroll: false })}
            />
          ) : null}
        </div>

        <div
          style={{ animationDelay: "240ms" }}
          className="grid flex-1 animate-slide-up-fade items-start border-t border-outline xl:grid-cols-[minmax(0,1fr)_380px]"
        >
          <div className="flex min-w-0 flex-col">
            <div ref={gridRef}>
              <MonthGrid
                month={month}
                today={today}
                selected={selected}
                placements={placements}
                onSelect={select}
                labelledBy={monthTitleId}
              />
            </div>
            <Legend />
          </div>

          <div className="self-stretch border-t border-outline xl:border-t-0 xl:border-l">
            <DayPanel
              day={selected}
              today={today}
              role={role}
              placements={placements.get(selected) ?? []}
              onAdd={() => openNew(selected)}
              onEdit={openEdit}
              className="xl:sticky xl:top-0"
            />
          </div>
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

const stepperClass = cn(
  "flex size-8 items-center justify-center bg-surface text-on-surface-secondary",
  "transition-colors duration-150 hover:bg-surface-muted hover:text-on-surface"
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
          "flex h-8 w-full items-center gap-2 rounded-md border border-outline-strong bg-surface pr-2 pl-2.5 text-sm font-medium text-on-surface shadow-[0_1px_2px_rgb(0_0_0/0.05)] outline-none sm:ml-auto sm:w-56",
          "transition-colors duration-150 hover:border-on-surface-muted data-popup-open:border-on-surface-muted"
        )}
      >
        <Users aria-hidden className="size-4 shrink-0 text-on-surface-muted" />
        <span className="min-w-0 flex-1 truncate text-left">{selected?.name ?? "All students"}</span>
        <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-on-surface-muted" />
      </SelectTrigger>
      <SelectContent align="end" className="dub min-w-56 rounded-md p-1">
        <SelectItem value={ALL} className="h-8 rounded-sm text-sm">
          All students
        </SelectItem>
        <SelectSeparator className="-mx-1 my-1" />
        {students.map((student) => (
          <SelectItem key={student.id} value={student.id} className="h-8 rounded-sm text-sm">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-outline bg-surface-sunken text-[10px] font-medium text-on-surface-secondary">
              {initials(student.name)}
            </span>
            {student.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}

function Legend() {
  return (
    <div
      aria-hidden
      className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-outline px-4 py-3 text-xs text-on-surface-muted sm:px-6"
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-on-surface-secondary" />
        Deadline, coloured by status
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-1.5 rounded-full border border-on-surface-muted" />
        Event
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-4 rounded-sm bg-surface-sunken ring-1 ring-outline" />
        All day
      </span>
      <span className="ml-auto hidden items-center gap-1.5 md:inline-flex">
        <Kbd className="h-5 min-w-5 rounded px-1 text-[11px]">←</Kbd>
        <Kbd className="h-5 min-w-5 rounded px-1 text-[11px]">→</Kbd>
        to move between days
      </span>
    </div>
  )
}

/** "4 deadlines, 1 unit due and 2 events in September." Counts each item once. */
function summarise(
  placements: Map<DayKey, DayPlacement[]>,
  month: MonthKey,
  studentName: string | undefined
): string {
  const seen = new Set<string>()
  let deadlines = 0
  let units = 0
  let events = 0
  for (const [day, list] of placements) {
    if (!day.startsWith(month)) continue
    for (const { item } of list) {
      const key = `${item.type}:${item.id}`
      if (seen.has(key)) continue
      seen.add(key)
      if (item.type === "deadline") deadlines++
      else if (item.type === "milestone") units++
      else events++
    }
  }

  const monthName = formatMonth(month).split(" ")[0]
  const scope = studentName ? ` for ${studentName}` : ""
  if (deadlines + units + events === 0) return `Nothing in ${monthName}${scope} yet.`

  const parts: string[] = []
  if (deadlines) parts.push(`${deadlines} ${deadlines === 1 ? "deadline" : "deadlines"}`)
  if (units) parts.push(`${units} ${units === 1 ? "unit" : "units"} due`)
  if (events) parts.push(`${events} ${events === 1 ? "event" : "events"}`)
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : parts[0]
  return `${list} in ${monthName}${scope}.`
}
