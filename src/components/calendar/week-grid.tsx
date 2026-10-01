"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "cn"

import {
  addDays,
  dayKeyOf,
  formatDayLong,
  timeOf,
  weekdayIndex,
  WEEKDAYS,
  type DayKey,
} from "@/lib/calendar/dates"
import { layoutDay, type DayPlacement, type TimedBlock, type WeekPlan } from "@/lib/calendar/model"

import { Chip, describe, Dot, key } from "./month-grid"
import { WeekBars } from "./week-plans"

/** One hour on the grid. Blocks and the now line are placed against this. */
const HOUR_PX = 48
const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
/** Where the grid opens when nothing earlier is scheduled. */
const OPENING_HOUR = 7

const GUTTER = "w-10 shrink-0 md:w-14"

/**
 * One week by the hour, in the same ring-edged card as the month. The day
 * headers are the grid's cells: one is in the tab order, arrows move by day
 * and by week, and selection follows focus so the agenda beside it always
 * describes the focused day. All-day items, exams and the week's planned
 * topics sit above the hours; timed items sit on them, side by side when they
 * overlap. The blocks are decorative: the agenda has the words and the links.
 */
export function WeekGrid({
  week,
  today,
  selected,
  timeZone,
  placements,
  plans,
  showPerson,
  onSelect,
  labelledBy,
}: {
  /** The Monday. */
  week: DayKey
  today: DayKey
  selected: DayKey
  timeZone: string
  placements: Map<DayKey, DayPlacement[]>
  /** Planned syllabus topics for this week. */
  plans: WeekPlan[]
  showPerson: boolean
  /** `focus` is true when the keyboard moved, so the new cell takes focus. */
  onSelect: (day: DayKey, options: { focus: boolean }) => void
  labelledBy: string
}) {
  const days = React.useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(week, i)), [week])
  const layouts = React.useMemo(
    () => days.map((day) => layoutDay(placements.get(day) ?? [])),
    [days, placements]
  )
  const hasAllDay = layouts.some((layout) => layout.allDay.length > 0)

  // Open on the working day, or earlier if something is scheduled before it.
  const scrollRef = React.useRef<HTMLDivElement>(null)
  // An event running on from the day before starts at midnight; it does not count.
  const earliest = Math.min(
    OPENING_HOUR * 60,
    ...layouts.flatMap((layout) =>
      layout.timed.filter((block) => !block.placement.continues).map((block) => block.start)
    )
  )
  React.useLayoutEffect(() => {
    const top = Math.max(0, (earliest / 60) * HOUR_PX - HOUR_PX / 2)
    if (scrollRef.current) scrollRef.current.scrollTop = top
    // Once per week shown; selecting a day must not move the hours.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week])

  const now = useNow(timeZone)

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
      case "PageUp":
        next = addDays(day, -7)
        break
      case "ArrowDown":
      case "PageDown":
        next = addDays(day, 7)
        break
      case "Home":
        next = addDays(day, -weekdayIndex(day))
        break
      case "End":
        next = addDays(day, 6 - weekdayIndex(day))
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
      data-slot="week-grid"
      className="flex flex-col overflow-hidden rounded-2xl bg-card text-card-foreground ring-1 ring-foreground/10 xl:h-full"
    >
      <div role="row" data-slot="week-grid-days" className="flex shrink-0 border-b border-border">
        <div aria-hidden className={GUTTER} />
        {days.map((day, index) => {
          const isToday = day === today
          const isSelected = day === selected
          return (
            <div
              key={day}
              role="gridcell"
              data-slot="week-grid-day"
              data-day={day}
              data-today={isToday || undefined}
              tabIndex={isSelected ? 0 : -1}
              aria-selected={isSelected}
              aria-current={isToday ? "date" : undefined}
              aria-label={`${formatDayLong(day)}${isToday ? ", today" : ""}. ${describe(placements.get(day) ?? [])}`}
              onClick={() => onSelect(day, { focus: false })}
              onKeyDown={(event) => handleKeyDown(event, day)}
              className={cn(
                "group/day flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1 border-l border-border px-1 py-2 outline-none md:flex-row md:gap-1.5 md:px-2",
                "transition-colors not-aria-selected:hover:bg-muted/60 focus-visible:z-10 aria-selected:bg-info-container/50"
              )}
            >
              <span aria-hidden className="text-xs text-muted-foreground select-none">
                <span className="sm:hidden">{WEEKDAYS[index]!.short.charAt(0)}</span>
                <span className="hidden sm:inline">{WEEKDAYS[index]!.short}</span>
              </span>
              <span
                aria-hidden
                className={cn(
                  "flex size-6 items-center justify-center rounded-lg text-xs tabular-nums",
                  "group-aria-selected/day:font-medium group-aria-selected/day:text-info",
                  "group-data-today/day:bg-info group-data-today/day:font-medium group-data-today/day:text-primary-foreground"
                )}
              >
                {Number(day.slice(8))}
              </span>
            </div>
          )
        })}
      </div>

      {hasAllDay ? (
        <div aria-hidden data-slot="week-grid-all-day" className="flex shrink-0 border-b border-border">
          <div className={cn(GUTTER, "px-1 pt-1.5 text-right text-[0.625rem] leading-4 text-muted-foreground md:px-2")}>
            <span className="hidden md:inline">All day</span>
          </div>
          {days.map((day, index) => (
            <DayColumn key={day} day={day} selected={day === selected} onSelect={onSelect} className="p-1">
              {/* Phones: dots; the agenda has the words. */}
              <span className="flex justify-center gap-0.5 md:hidden">
                {layouts[index]!.allDay.slice(0, 3).map((placement) => (
                  <Dot key={key(placement)} placement={placement} />
                ))}
              </span>
              <ul className="hidden min-w-0 flex-col gap-0.5 md:flex">
                {layouts[index]!.allDay.map((placement) => (
                  <Chip key={key(placement)} placement={placement} />
                ))}
              </ul>
            </DayColumn>
          ))}
        </div>
      ) : null}

      <div className="shrink-0 border-b border-border empty:hidden">
        {plans.length > 0 ? <WeekBars plans={plans} showPerson={showPerson} className="border-t-0" /> : null}
      </div>

      <div
        ref={scrollRef}
        aria-hidden
        data-slot="week-grid-hours"
        className="max-h-[32rem] overflow-y-auto overscroll-contain xl:max-h-none xl:min-h-0 xl:flex-1"
      >
        <div className="relative flex" style={{ height: HOUR_PX * 24 }}>
          <div className={cn(GUTTER, "relative")}>
            {HOURS.slice(1).map((hour) => (
              <span
                key={hour}
                className="absolute right-1 -translate-y-1/2 font-mono text-[0.625rem] leading-none text-muted-foreground tabular-nums md:right-2"
                style={{ top: hour * HOUR_PX }}
              >
                {String(hour).padStart(2, "0")}
                <span className="hidden md:inline">:00</span>
              </span>
            ))}
          </div>

          {/* Hour rules run under every column. */}
          <div className="pointer-events-none absolute inset-y-0 right-0 left-10 md:left-14">
            {HOURS.slice(1).map((hour) => (
              <div key={hour} className="absolute inset-x-0 border-t border-border" style={{ top: hour * HOUR_PX }} />
            ))}
          </div>

          {days.map((day, index) => (
            <DayColumn key={day} day={day} selected={day === selected} onSelect={onSelect} className="relative">
              {layouts[index]!.timed.map((block) => (
                <Block key={key(block.placement)} block={block} />
              ))}
              {now && now.day === day ? (
                <div
                  data-slot="week-grid-now"
                  className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                  style={{ top: (now.minutes / 60) * HOUR_PX }}
                >
                  <span className="-ml-1 size-2 shrink-0 -translate-y-1/2 rounded-full bg-info" />
                  <span className="h-px flex-1 -translate-y-1/2 bg-info" />
                </div>
              ) : null}
            </DayColumn>
          ))}
        </div>
      </div>
    </div>
  )
}

/** A day's strip below the headers. Clicking anywhere in it selects the day. */
function DayColumn({
  day,
  selected,
  onSelect,
  className,
  children,
}: {
  day: DayKey
  selected: boolean
  onSelect: (day: DayKey, options: { focus: boolean }) => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      data-slot="week-grid-column"
      data-selected={selected || undefined}
      onClick={() => onSelect(day, { focus: false })}
      className={cn(
        "min-w-0 flex-1 cursor-pointer border-l border-border transition-colors data-selected:bg-info-container/30",
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * A timed item on the hours. Exams never land here (they are all-day);
 * deadlines are outlined markers at the moment they fall due, events are
 * filled for as long as they run.
 */
const blockVariants = cva(
  "absolute flex min-w-0 flex-col overflow-hidden rounded-md px-1 py-0.5 text-xs leading-4 md:px-1.5",
  {
    variants: {
      variant: {
        deadline: "bg-card text-foreground ring-1 ring-foreground/15",
        event: "bg-muted text-foreground ring-1 ring-card",
      },
    },
    defaultVariants: { variant: "event" },
  }
)

function Block({ block }: { block: TimedBlock }) {
  const { placement, start, end, lane, lanes } = block
  const variant = placement.item.type === "deadline" ? "deadline" : "event"
  const height = ((end - start) / 60) * HOUR_PX
  const label = placement.time ?? (placement.until ? `Until ${placement.until}` : null)

  return (
    <div
      data-slot="week-grid-block"
      data-variant={variant}
      className={blockVariants({ variant })}
      style={{
        top: (start / 60) * HOUR_PX + 1,
        height: height - 2,
        left: `calc(${(lane / lanes) * 100}% + 2px)`,
        width: `calc(${100 / lanes}% - 4px)`,
      }}
    >
      <span className="flex min-w-0 items-center gap-1">
        <Dot placement={placement} className="hidden md:block" />
        <span className="min-w-0 truncate font-medium">{placement.item.title}</span>
      </span>
      {/* Only when there is a second line's worth of height. */}
      {label && height >= 40 ? (
        <span className="hidden truncate font-mono text-muted-foreground tabular-nums md:block">
          {label}
          {/* An end before the start is an end on a later day. */}
          {placement.time && placement.until && placement.until > placement.time ? `–${placement.until}` : null}
        </span>
      ) : null}
    </div>
  )
}

/** The viewer's wall-clock day and minute, after mount, ticking each minute. */
function useNow(timeZone: string): { day: DayKey; minutes: number } | null {
  const [now, setNow] = React.useState<{ day: DayKey; minutes: number } | null>(null)
  React.useEffect(() => {
    const read = () => {
      const instant = new Date()
      const [h, m] = timeOf(instant, timeZone).split(":").map(Number)
      setNow({ day: dayKeyOf(instant, timeZone), minutes: h! * 60 + m! })
    }
    read()
    const timer = window.setInterval(read, 60_000)
    return () => window.clearInterval(timer)
  }, [timeZone])
  return now
}
