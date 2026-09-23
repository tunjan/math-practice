"use client"

import * as React from "react"
import { cn } from "cn"

import { StatusDot } from "@/components/assignments/status-dot"
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
import type { DayPlacement } from "@/lib/calendar/model"

/** Three chips fit a cell; past that, two chips and a count. */
const CELL_LINES = 3

/**
 * The month as a ruled ledger (DESIGN.md › The ruled grid): Monday first,
 * full-bleed to the column edges, 1px hairlines between cells and no fills
 * except state. Each day's items read as miniature chips, the product drawn
 * at a distance: status dot, a mono time, the title.
 *
 * Keyboard follows the ARIA date grid: one cell is in the tab order, arrows
 * move by day and week, Home and End to the ends of the week, Page Up and
 * Page Down by month. Selection follows focus, so the day panel beside the
 * grid always describes the focused day.
 */
export function MonthGrid({
  month,
  today,
  selected,
  placements,
  onSelect,
  labelledBy,
}: {
  month: MonthKey
  today: DayKey
  selected: DayKey
  placements: Map<DayKey, DayPlacement[]>
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
    <div role="grid" aria-labelledby={labelledBy} className="flex flex-col">
      <div role="row" className="grid grid-cols-7 border-b border-outline">
        {WEEKDAYS.map((weekday, index) => (
          <div
            key={weekday.short}
            role="columnheader"
            aria-label={weekday.long}
            className={cn(
              "border-l border-outline px-2 py-2.5 text-center text-xs font-medium text-on-surface-muted first:border-l-0 md:px-3 md:text-left",
              index >= 5 && "bg-surface-muted"
            )}
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
        <div key={week[0]} role="row" className="grid grid-cols-7 border-b border-outline last:border-b-0">
          {week.map((day, index) => (
            <DayCell
              key={day}
              day={day}
              weekend={index >= 5}
              outside={monthOf(day) !== month}
              isToday={day === today}
              isSelected={day === selected}
              placements={placements.get(day) ?? []}
              onSelect={onSelect}
              onKeyDown={handleKeyDown}
            />
          ))}
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
  const deadlines = placements.filter((p) => p.item.type === "deadline").length
  const events = placements.length - deadlines
  if (placements.length === 0) return "Nothing scheduled"
  const parts: string[] = []
  if (deadlines) parts.push(`${deadlines} ${deadlines === 1 ? "deadline" : "deadlines"}`)
  if (events) parts.push(`${events} ${events === 1 ? "event" : "events"}`)
  return parts.join(", ")
}

const DayCell = React.memo(function DayCell({
  day,
  weekend,
  outside,
  isToday,
  isSelected,
  placements,
  onSelect,
  onKeyDown,
}: {
  day: DayKey
  weekend: boolean
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
        "group/cell relative flex min-h-16 min-w-0 cursor-pointer flex-col gap-1.5 border-l border-outline p-1.5 outline-none first:border-l-0 md:min-h-30 md:p-2",
        "transition-colors duration-150 focus-visible:z-10",
        isSelected
          ? "z-[1] bg-surface shadow-[inset_0_0_0_1px_var(--on-surface)]"
          : weekend || outside
            ? "bg-surface-muted hover:bg-surface-hover"
            : "bg-surface hover:bg-surface-muted"
      )}
    >
      <span className="flex items-center justify-center md:justify-start">
        <span
          aria-hidden
          className={cn(
            "flex h-6 min-w-6 items-center justify-center rounded-full px-1 font-mono text-[13px] leading-none tabular-nums",
            isToday
              ? "bg-primary font-medium text-on-primary"
              : outside
                ? "text-on-surface-muted"
                : "text-on-surface"
          )}
        >
          {Number(day.slice(8))}
        </span>
      </span>

      {placements.length > 0 ? (
        <>
          {/* Phones: a row of markers under the date; the panel has the words. */}
          <span aria-hidden className="flex flex-wrap items-center justify-center gap-1 md:hidden">
            {placements.slice(0, 3).map((placement) => (
              <Marker key={`${placement.item.type}-${placement.item.id}`} placement={placement} />
            ))}
            {placements.length > 3 ? (
              <span className="font-mono text-[10px] leading-none text-on-surface-muted">+</span>
            ) : null}
          </span>

          <ul aria-hidden className={cn("hidden min-w-0 flex-col gap-1 md:flex", outside && "opacity-60")}>
            {visible.map((placement) => (
              <Chip key={`${placement.item.type}-${placement.item.id}`} placement={placement} />
            ))}
            {hidden > 0 ? (
              <li className="px-1.5 text-[11px] leading-4 font-medium text-on-surface-muted">
                +{hidden} more
              </li>
            ) : null}
          </ul>
        </>
      ) : null}
    </div>
  )
})

/**
 * A deadline is a filled dot in its status colour; an event is a hollow
 * neutral ring. Colour stays a statement about state, and events have none.
 */
export function Marker({ placement, className }: { placement: DayPlacement; className?: string }) {
  if (placement.item.type === "deadline") {
    return <StatusDot tone={placement.item.status.tone} className={className} />
  }
  return (
    <span
      aria-hidden
      className={cn("size-1.5 shrink-0 rounded-full border border-on-surface-muted", className)}
    />
  )
}

/** A miniature of the item: a hairline chip, or a tinted bar when all day. */
function Chip({ placement }: { placement: DayPlacement }) {
  const { item } = placement

  if (placement.allDay) {
    return (
      <li className="truncate rounded-xs bg-surface-sunken px-1.5 py-0.5 text-[11px] leading-4 font-medium text-on-surface-secondary">
        {item.title}
      </li>
    )
  }

  return (
    <li className="flex min-w-0 items-center gap-1.5 rounded-xs border border-outline bg-surface px-1.5 py-px shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <Marker placement={placement} />
      {placement.time ? (
        <span className="hidden shrink-0 font-mono text-[10px] leading-4 text-on-surface-muted tabular-nums 2xl:inline">
          {placement.time}
        </span>
      ) : null}
      <span className="min-w-0 truncate text-[11px] leading-4 font-medium text-on-surface">{item.title}</span>
    </li>
  )
}
