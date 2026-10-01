"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Users } from "lucide-react"
import { cn } from "cn"

import { Button, ButtonLink } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { deleteEvent, resetCalendarLink, saveEvent } from "@/lib/calendar/actions"
import {
  addDays,
  addMonths,
  formatMonth,
  formatWeek,
  monthOf,
  weekStart,
  type DayKey,
  type MonthKey,
} from "@/lib/calendar/dates"
import {
  placeByDay,
  plansByWeek,
  type CalendarItem,
  type CalendarMode,
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
import { WeekGrid } from "./week-grid"

/**
 * A day chosen by keyboard in a neighbouring month. The view remounts when the
 * month changes, and the new instance picks this up so focus lands where the
 * arrow key pointed, not on the 1st.
 */
let pendingSelection: { month: MonthKey; day: DayKey } | null = null

/**
 * The calendar screen: a 64px page header with the one primary action, a
 * toolbar of 32px controls, then the month card with the selected day's
 * agenda beside it. shadcn Nova anatomy (compact controls, ring-edged cards,
 * semantic tokens) in the Dub palette: blue still means "you are here".
 *
 * The month comes from the server (it decides what to load); the selected
 * day and the view are local, mirrored into the URL with replaceState so a
 * refresh or a shared link reopens the same thing without a round trip on
 * every click. The week view shows the week of the selected day: a month's
 * data covers every week its grid touches, so switching views loads nothing.
 * Adjacent months are prefetched, so paging through them is instant.
 */
export function CalendarView({
  role,
  basePath,
  month,
  view: initialView = "month",
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
  view?: CalendarMode
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
  const [view, setView] = React.useState<CalendarMode>(initialView)
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
      if (view === "week") params.set("view", view)
      const student = next.student === undefined ? studentId : next.student
      if (student) params.set("student", student)
      const query = params.toString()
      return query ? `${basePath}?${query}` : basePath
    },
    [basePath, studentId, view]
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

  // Keep the address in step with the view, so a refresh reopens it.
  React.useEffect(() => {
    window.history.replaceState(null, "", href({ month, day: selected }))
    // Only when the view changes; selecting a day writes its own URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

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

  // N adds an event on the selected day; T jumps to today; M and W switch
  // views. Never while typing or while a dialog is open.
  const onShortcut = React.useEffectEvent((key: "n" | "t" | "m" | "w") => {
    if (key === "n") openNew(selected)
    else if (key === "m") setView("month")
    else if (key === "w") setView("week")
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
      if (key !== "n" && key !== "t" && key !== "m" && key !== "w") return
      event.preventDefault()
      onShortcut(key)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    // From xl up the page is exactly one screen: the month stretches to fill
    // it and the agenda scrolls on its own, so nothing sits below the fold.
    <div
      data-slot="calendar-view"
      className="dub flex flex-1 flex-col bg-card text-card-foreground xl:h-svh xl:max-h-svh xl:min-h-0"
    >
      <header data-slot="calendar-header" className="shrink-0 border-b border-border">
        <div className="flex h-12 w-full items-center justify-between gap-4 px-3 sm:h-16 lg:px-6">
          <h1 className="text-lg leading-7 font-semibold">Calendar</h1>
          <Button variant="primary" size="sm" shortcut="N" onClick={() => openNew(selected)}>
            <Plus aria-hidden />
            New event
          </Button>
        </div>
      </header>

      <div className="flex w-full flex-1 flex-col gap-4 px-3 pt-4 pb-12 lg:px-6 xl:min-h-0 xl:pb-6">
        <div data-slot="calendar-toolbar" className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5">
            {view === "week" ? (
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Previous week"
                  onClick={() => select(addDays(selected, -7), { focus: false })}
                >
                  <ChevronLeft aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Next week"
                  onClick={() => select(addDays(selected, 7), { focus: false })}
                >
                  <ChevronRight aria-hidden />
                </Button>
              </>
            ) : (
              <>
                <ButtonLink
                  variant="ghost"
                  size="icon-sm"
                  href={href({ month: addMonths(month, -1) })}
                  prefetch
                  scroll={false}
                  aria-label={`Previous month, ${formatMonth(addMonths(month, -1))}`}
                >
                  <ChevronLeft aria-hidden />
                </ButtonLink>
                <ButtonLink
                  variant="ghost"
                  size="icon-sm"
                  href={href({ month: addMonths(month, 1) })}
                  prefetch
                  scroll={false}
                  aria-label={`Next month, ${formatMonth(addMonths(month, 1))}`}
                >
                  <ChevronRight aria-hidden />
                </ButtonLink>
              </>
            )}
          </div>

          <h2
            id={monthTitleId}
            aria-live="polite"
            className="min-w-36 text-base leading-none font-medium tabular-nums"
          >
            {view === "week" ? formatWeek(weekStart(selected)) : formatMonth(month)}
          </h2>

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
            <TooltipContent className="dub">
              Go to today
              <Kbd className="h-5 min-w-5 border-0 px-1 text-xs font-light">T</Kbd>
            </TooltipContent>
          </Tooltip>

          <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
            <ToggleGroup
              aria-label="View"
              value={[view]}
              onValueChange={(next) => {
                const mode = next[0] as CalendarMode | undefined
                if (mode) setView(mode)
              }}
              className="h-8 shrink-0 gap-0.5 rounded-md bg-muted p-[3px]"
            >
              <ToggleGroupItem value="month" className={viewItemClass}>
                Month
              </ToggleGroupItem>
              <ToggleGroupItem value="week" className={viewItemClass}>
                Week
              </ToggleGroupItem>
            </ToggleGroup>
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

        <div className="grid items-start gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_300px] xl:grid-rows-[minmax(0,1fr)] xl:items-stretch 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <div ref={gridRef} className="min-w-0 xl:min-h-0">
            {view === "week" ? (
              <WeekGrid
                week={weekStart(selected)}
                today={today}
                selected={selected}
                timeZone={timeZone}
                placements={placements}
                plans={weekPlans.get(weekStart(selected)) ?? []}
                showPerson={showPerson}
                onSelect={select}
                labelledBy={monthTitleId}
              />
            ) : (
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
            )}
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
            className="xl:max-h-full xl:min-h-0 xl:self-start"
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

/** A segment of the view switch: the active one is raised off the muted track. */
const viewItemClass =
  "h-full rounded-sm px-2.5 text-sm font-medium text-muted-foreground hover:bg-transparent hover:text-foreground data-pressed:bg-card data-pressed:text-foreground data-pressed:shadow-xs"

const ALL = "all"

const filterItemClass = "h-8 gap-1.5 rounded-sm px-2 text-sm data-highlighted:bg-accent"

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
        data-slot="select-trigger"
        aria-label="Show calendar for"
        className={cn(
          "flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-md border border-input bg-transparent pr-2 pl-2.5 text-sm whitespace-nowrap outline-none select-none sm:w-48 sm:flex-none",
          "transition-colors hover:bg-muted/50 data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/15",
          "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground"
        )}
      >
        <Users aria-hidden />
        <span className="min-w-0 flex-1 truncate text-left">{selected?.name ?? "All students"}</span>
        <ChevronDown aria-hidden />
      </SelectTrigger>
      <SelectContent
        align="end"
        sideOffset={4}
        className="dub min-w-48 rounded-lg border-0 p-1 shadow-md ring-1 ring-foreground/10"
      >
        <SelectItem value={ALL} className={filterItemClass}>
          All students
        </SelectItem>
        <SelectSeparator className="-mx-1 my-1 bg-border" />
        {students.map((student) => (
          <SelectItem key={student.id} value={student.id} className={filterItemClass}>
            {student.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
