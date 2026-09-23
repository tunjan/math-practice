"use client"

import Link from "next/link"
import { CalendarPlus, Plus } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TYPE_LABEL, type StatusTone } from "@/lib/assignments/model"
import { relativeDay, WEEKDAYS, weekdayIndex, type DayKey } from "@/lib/calendar/dates"
import {
  EVENT_KIND_LABEL,
  eventAudience,
  type DayPlacement,
  type EventItem,
} from "@/lib/calendar/model"

import { Marker } from "./month-grid"

/** DESIGN.md › Badges: tinted container, dark same-hue ink, a 200-tint hairline. */
const TONE_PILL: Record<StatusTone, string> = {
  violet: "border-violet/20 bg-violet-container text-on-violet-container",
  accent: "border-accent-orange/25 bg-accent-container text-on-accent-container",
  info: "border-info/20 bg-info-container text-on-info-container",
  warning: "border-warning/25 bg-warning-container text-on-warning-container",
  success: "border-success/20 bg-success-container text-on-success-container",
  error: "border-error/20 bg-error-container text-on-error-container",
}

/** DESIGN.md › Tooltip: white, hairline, 12px radius, no arrow. Portalled, so scoped here. */
export const TOOLTIP_CLASS =
  "dub rounded-lg border border-outline-strong bg-surface px-3 py-1.5 text-sm text-on-surface-secondary shadow-[0_1px_2px_rgb(0_0_0/0.05)] **:data-[side]:hidden"

const MONTH_DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })

/**
 * Everything on the selected day, in reading order, as a stack of small
 * hairline cards. Deadlines link to their task; your own events open for
 * editing; events someone shared with you are read-only and show their notes
 * in place.
 */
export function DayPanel({
  day,
  today,
  role,
  placements,
  onAdd,
  onEdit,
  className,
}: {
  day: DayKey
  today: DayKey
  role: "tutor" | "student"
  placements: DayPlacement[]
  onAdd: () => void
  onEdit: (event: EventItem) => void
  className?: string
}) {
  const weekday = WEEKDAYS[weekdayIndex(day)]!.long
  const date = MONTH_DAY.format(new Date(`${day}T00:00:00Z`))
  const count = placements.length
  const relative = relativeDay(day, today)

  return (
    <section role="region" aria-labelledby="day-panel-title" className={cn("flex flex-col", className)}>
      <header className="flex items-start justify-between gap-4 px-4 pt-6 pb-4 sm:px-6">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm text-on-surface-muted">
            {weekday} · {relative}
          </p>
          <h2 id="day-panel-title" className="font-display text-2xl leading-[1.33] font-medium text-on-surface">
            {date}
          </h2>
        </div>
        <Tooltip>
          <TooltipTrigger
            render={<Button size="icon" onClick={onAdd} aria-label={`Add an event on ${weekday} ${date}`} />}
          >
            <Plus aria-hidden />
          </TooltipTrigger>
          <TooltipContent side="left" className={TOOLTIP_CLASS}>
            Add event
          </TooltipContent>
        </Tooltip>
      </header>

      {count === 0 ? (
        <div className="px-4 pb-6 sm:px-6">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-outline bg-surface-muted px-6 py-10 text-center">
            <span className="flex size-10 items-center justify-center rounded-md border border-outline bg-surface text-on-surface-muted shadow-[0_1px_2px_rgb(0_0_0/0.05)]">
              <CalendarPlus className="size-4" aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-on-surface">Nothing on this day</p>
              <p className="max-w-64 text-sm text-pretty text-on-surface-muted">
                {role === "tutor"
                  ? "Deadlines you set land here. Add lessons and anything else you need to remember."
                  : "Deadlines from your tutor land here. Add exams, study sessions and anything else."}
              </p>
            </div>
            <Button size="sm" onClick={onAdd} className="mt-1">
              Add event
            </Button>
          </div>
        </div>
      ) : (
        <ul role="list" className="flex flex-col gap-2 px-4 pb-6 sm:px-6">
          {placements.map((placement) => (
            <li key={`${placement.item.type}-${placement.item.id}`}>
              <Row placement={placement} role={role} onEdit={onEdit} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const cardClass = "flex w-full gap-3 rounded-lg border border-outline bg-surface p-3.5 text-left"
const interactiveClass = cn(
  "transition-[border-color,box-shadow] duration-200",
  "hover:border-outline-strong hover:shadow-[0_4px_6px_-1px_rgb(0_0_0/0.1),0_2px_4px_-2px_rgb(0_0_0/0.1)]"
)

function Row({
  placement,
  role,
  onEdit,
}: {
  placement: DayPlacement
  role: "tutor" | "student"
  onEdit: (event: EventItem) => void
}) {
  const { item } = placement
  const time = <TimeColumn placement={placement} />

  if (item.type === "deadline") {
    return (
      // A student's deadline opens as a dialog over the calendar, so stay put.
      <Link href={item.href} scroll={role !== "student"} className={cn(cardClass, interactiveClass)}>
        {time}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-start justify-between gap-2">
            <span className="line-clamp-2 text-sm leading-5 font-medium text-pretty text-on-surface">
              {item.title}
            </span>
            <span
              className={cn(
                "mt-px shrink-0 rounded-full border px-2 py-px text-xs leading-4 font-medium",
                TONE_PILL[item.status.tone]
              )}
            >
              {item.status.label}
            </span>
          </span>
          <span className="truncate text-xs text-on-surface-muted">
            {["Deadline", item.person ?? TYPE_LABEL[item.taskType]].join(" · ")}
          </span>
        </span>
      </Link>
    )
  }

  if (item.type === "milestone") {
    return (
      <Link href={item.href} className={cn(cardClass, interactiveClass)}>
        {time}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-start justify-between gap-2">
            <span className="line-clamp-2 text-sm leading-5 font-medium text-pretty text-on-surface">
              {item.title}
            </span>
            <span
              className={cn(
                "mt-px shrink-0 rounded-full border px-2 py-px text-xs leading-4 font-medium",
                TONE_PILL[item.status.tone]
              )}
            >
              {item.status.label}
            </span>
          </span>
          <span className="truncate text-xs text-on-surface-muted">
            {["Unit due", item.person].filter(Boolean).join(" · ")}
          </span>
        </span>
      </Link>
    )
  }

  const body = (
    <>
      {time}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-2 text-sm leading-5 font-medium text-pretty text-on-surface">
          {item.mine ? <span className="sr-only">Edit </span> : null}
          {item.title}
        </span>
        <span className="truncate text-xs text-on-surface-muted">
          {[EVENT_KIND_LABEL[item.kind], eventAudience(item, role)].join(" · ")}
        </span>
        {item.notes ? (
          <span
            className={cn(
              "mt-1 border-t border-outline pt-2 text-xs leading-5 whitespace-pre-line text-on-surface-secondary",
              item.mine && "line-clamp-3"
            )}
          >
            {item.notes}
          </span>
        ) : null}
      </span>
    </>
  )

  if (!item.mine) return <div className={cn(cardClass, "bg-surface-muted")}>{body}</div>

  return (
    <button type="button" onClick={() => onEdit(item)} className={cn(cardClass, interactiveClass, "cursor-pointer")}>
      {body}
    </button>
  )
}

/** The start time over the end, or "All day", beside its marker. */
function TimeColumn({ placement }: { placement: DayPlacement }) {
  return (
    <span className="flex w-13 shrink-0 flex-col gap-1 pt-0.5">
      <span className="flex items-center gap-1.5">
        <Marker placement={placement} />
        {placement.time ? (
          <span className="font-mono text-xs leading-4 text-on-surface tabular-nums">{placement.time}</span>
        ) : (
          <span className="text-xs leading-4 font-medium text-on-surface-secondary">
            {placement.allDay ? "All day" : "Until"}
          </span>
        )}
      </span>
      {placement.until && (placement.time || placement.continues) ? (
        <span className="pl-3 font-mono text-xs leading-4 text-on-surface-muted tabular-nums">
          {placement.until}
        </span>
      ) : null}
    </span>
  )
}
