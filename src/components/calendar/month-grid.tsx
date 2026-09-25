"use client"

import * as React from "react"
import { cn } from "cn"

import { TONE_DOT } from "@/components/assignments/status-dot"
import {
  addDays,
  addMonths,
  formatDayLong,
  monthGrid,
  monthOf,
  weekdayIndex,
  WEEKDAYS,
  type DayKey,
  type MonthKey,
} from "@/lib/calendar/dates"
import type { DayPlacement, WeekPlan } from "@/lib/calendar/model"

import { WeekBars } from "./week-plans"

/** Three lines fit a cell; past that, two items and a count. */
const CELL_LINES = 3

/**
 * The month as one bordered card (DESIGN.md › Card list): Monday first,
 * hairlines between days, no fills except state. Today's number sits in the
 * blue "you are here" disc; the selected day takes the active-item tint.
 *
 * Keyboard follows the ARIA date grid: one cell is in the tab order, arrows
 * move by day and week, Home and End to the ends of the week, Page Up and
 * Page Down by month. Selection follows focus, so the agenda beside the grid
 * always describes the focused day.
 */
export function MonthGrid({
  month,
  today,
  selected,
  placements,
  plans,
  showPerson,
  onSelect,
  labelledBy,
}: {
  month: MonthKey
  today: DayKey
  selected: DayKey
  placements: Map<DayKey, DayPlacement[]>
  /** Planned syllabus topics, keyed by the Monday of their week. */
  plans: Map<DayKey, WeekPlan[]>
  /** Name the student on each bar (the tutor's unfiltered calendar). */
  showPerson: boolean
  /** `focus` is true when the keyboard moved, so the new cell takes focus. */
  onSelect: (day: DayKey, options: { focus: boolean }) => void
  labelledBy: string
}) {
  const weeks = React.useMemo(() => monthGrid(month), [month])

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>, day: DayKey) {
    let next: DayKey | null = null
    switch (event.key) {
      case "ArrowLeft":
        next = addDays(day, -1)
        break
      case "ArrowRight":
        next = addDays(day, 1)
        break
      case "ArrowUp":
        next = addDays(day, -7)
        break
      case "ArrowDown":
        next = addDays(day, 7)
        break
      case "Home":
        next = addDays(day, -weekdayIndex(day))
        break
      case "End":
        next = addDays(day, 6 - weekdayIndex(day))
        break
      case "PageUp":
      case "PageDown":
        next = sameDayInMonth(day, event.key === "PageUp" ? -1 : 1)
        break
    }
    if (!next) return
    event.preventDefault()
    onSelect(next, { focus: true })
  }

  return (
    <div
      role="grid"
      aria-labelledby={labelledBy}
      className="flex flex-col overflow-hidden rounded-xl border border-outline bg-surface"
    >
      <div role="row" className="grid grid-cols-7 border-b border-outline">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday.short}
            role="columnheader"
            aria-label={weekday.long}
            className="px-2 py-2 text-center text-xs font-medium text-on-surface-muted md:px-3 md:text-left"
          >
            <span aria-hidden className="sm:hidden">
              {weekday.short.charAt(0)}
            </span>
            <span aria-hidden className="hidden sm:inline">
              {weekday.short}
            </span>
          </div>
        ))}
      </div>

      {weeks.map((week) => (
        <div key={week[0]} role="presentation" className="border-b border-outline last:border-b-0">
          <div role="row" className="grid grid-cols-7">
            {week.map((day) => (
              <DayCell
                key={day}
                day={day}
                outside={monthOf(day) !== month}
                isToday={day === today}
                isSelected={day === selected}
                placements={placements.get(day) ?? []}
                onSelect={onSelect}
                onKeyDown={handleKeyDown}
              />
            ))}
          </div>
          <WeekBars plans={plans.get(week[0]!) ?? []} showPerson={showPerson} />
        </div>
      ))}
    </div>
  )
}

function sameDayInMonth(day: DayKey, delta: number): DayKey {
  const target = addMonths(monthOf(day), delta)
  const lastDay = Number(addDays(`${addMonths(target, 1)}-01`, -1).slice(8))
  const dayOfMonth = Math.min(Number(day.slice(8)), lastDay)
  return `${target}-${String(dayOfMonth).padStart(2, "0")}`
}

function describe(placements: DayPlacement[]): string {
  if (placements.length === 0) return "Nothing scheduled"
  return placements.map(({ item }) => item.title).join(", ")
}

const DayCell = React.memo(function DayCell({
  day,
  outside,
  isToday,
  isSelected,
  placements,
  onSelect,
  onKeyDown,
}: {
  day: DayKey
  outside: boolean
  isToday: boolean
  isSelected: boolean
  placements: DayPlacement[]
  onSelect: (day: DayKey, options: { focus: boolean }) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>, day: DayKey) => void
}) {
  const overflow = placements.length > CELL_LINES
  const visible = overflow ? placements.slice(0, CELL_LINES - 1) : placements
  const hidden = placements.length - visible.length

  return (
    <div
      role="gridcell"
      data-day={day}
      tabIndex={isSelected ? 0 : -1}
      aria-selected={isSelected}
      aria-current={isToday ? "date" : undefined}
      aria-label={`${formatDayLong(day)}${isToday ? ", today" : ""}. ${describe(placements)}`}
      onClick={() => onSelect(day, { focus: false })}
      onKeyDown={(event) => onKeyDown(event, day)}
      className={cn(
        "relative flex min-h-14 min-w-0 cursor-pointer flex-col gap-1 border-l border-outline p-1 outline-none first:border-l-0 md:min-h-28 md:p-1.5",
        "transition-colors duration-75 focus-visible:z-10",
        isSelected ? "bg-blue-100/50" : "hover:bg-surface-muted"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mx-auto flex size-6 items-center justify-center rounded-full text-xs tabular-nums md:mx-0",
          isToday
            ? "bg-blue-600 font-semibold text-white"
            : isSelected
              ? "font-semibold text-blue-600"
              : outside
                ? "text-on-surface-muted/60"
                : "font-medium text-on-surface-secondary"
        )}
      >
        {Number(day.slice(8))}
      </span>

      {placements.length > 0 ? (
        <>
          {/* Phones: dots under the date; the agenda has the words. */}
          <span aria-hidden className="flex justify-center gap-0.5 md:hidden">
            {placements.slice(0, 3).map((placement) => (
              <Dot key={key(placement)} placement={placement} />
            ))}
          </span>

          <ul aria-hidden className={cn("hidden min-w-0 flex-col gap-0.5 md:flex", outside && "opacity-50")}>
            {visible.map((placement) => (
              <Chip key={key(placement)} placement={placement} />
            ))}
            {hidden > 0 ? (
              <li className="px-1.5 text-xs leading-5 text-on-surface-muted">{hidden} more</li>
            ) : null}
          </ul>
        </>
      ) : null}
    </div>
  )
})

export function key({ item }: DayPlacement): string {
  return `${item.type}-${item.id}`
}

/** Deadlines carry their status colour; exams are ink; events stay neutral. */
export function Dot({ placement, className }: { placement: DayPlacement; className?: string }) {
  const { item } = placement
  return (
    <span
      aria-hidden
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        item.type === "event"
          ? "bg-neutral-400"
          : item.type === "exam"
            ? "bg-on-surface"
            : TONE_DOT[item.status.tone],
        className
      )}
    />
  )
}

function Chip({ placement }: { placement: DayPlacement }) {
  const { item } = placement

  // Exams are the one thing on the month that must not be missed.
  if (item.type === "exam") {
    return (
      <li className="flex min-w-0 items-center gap-1.5 rounded-md bg-surface-inverse px-1.5 text-xs leading-5 text-on-surface-inverse">
        <span className="truncate">{item.title}</span>
      </li>
    )
  }

  // All-day items read as a bar, as in every calendar people already use.
  if (placement.allDay) {
    return (
      <li className="flex min-w-0 items-center gap-1.5 rounded-md bg-surface-sunken px-1.5 text-xs leading-5 text-on-surface-secondary">
        <span className="truncate">{item.title}</span>
      </li>
    )
  }

  return (
    <li className="flex min-w-0 items-center gap-1.5 rounded-md px-1.5 text-xs leading-5 text-on-surface-secondary">
      <Dot placement={placement} />
      <span className="min-w-0 truncate">{item.title}</span>
    </li>
  )
}
