"use client"

import Link from "next/link"
import { cn } from "cn"

import { TYPE_LABEL, type StatusTone } from "@/lib/assignments/model"
import { relativeDay, WEEKDAYS, weekdayIndex, type DayKey } from "@/lib/calendar/dates"
import {
  EVENT_KIND_LABEL,
  eventAudience,
  type DayPlacement,
  type EventItem,
} from "@/lib/calendar/model"

import { Dot, key } from "./month-grid"

/** DESIGN.md › StatusBadge: feedback container with its own ink, no border. */
const STATUS_BADGE: Record<StatusTone, string> = {
  violet: "bg-violet-container text-on-violet-container",
  accent: "bg-accent-container text-on-accent-container",
  info: "bg-info-container text-on-info-container",
  warning: "bg-warning-container text-on-warning-container",
  success: "bg-success-container text-on-success-container",
  error: "bg-error-container text-on-error-container",
}

const MONTH_DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })

/**
 * The selected day as a card list (DESIGN.md › Card list): one bordered block,
 * rows split by hairlines, time on the left. Deadlines and units link to their
 * page; your own events open for editing; shared events are read-only.
 */
export function DayPanel({
  day,
  today,
  role,
  placements,
  onEdit,
  className,
}: {
  day: DayKey
  today: DayKey
  role: "tutor" | "student"
  placements: DayPlacement[]
  onEdit: (event: EventItem) => void
  className?: string
}) {
  const weekday = WEEKDAYS[weekdayIndex(day)]!.long
  const date = MONTH_DAY.format(new Date(`${day}T00:00:00Z`))
  const relative = relativeDay(day, today)

  return (
    <section
      aria-labelledby="day-panel-title"
      className={cn("flex flex-col overflow-hidden rounded-xl border border-outline bg-surface", className)}
    >
      <header className="flex h-12 items-center justify-between gap-3 border-b border-outline px-4">
        <h2 id="day-panel-title" className="truncate text-sm font-semibold text-on-surface">
          {weekday} {date}
        </h2>
        {relative === "Today" ? (
          <span className="rounded-full bg-blue-100 px-2 py-px text-xs font-medium text-blue-700">Today</span>
        ) : (
          <span className="shrink-0 text-xs text-on-surface-muted">{relative}</span>
        )}
      </header>

      {placements.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-on-surface-muted">Nothing scheduled</p>
      ) : (
        <ul role="list" className="divide-y divide-outline">
          {placements.map((placement) => (
            <li key={key(placement)}>
              <Row placement={placement} role={role} onEdit={onEdit} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const rowClass = "flex w-full gap-3 px-4 py-3 text-left"
const hoverClass = "transition-colors duration-75 hover:bg-surface-muted"

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

  const meta =
    item.type === "deadline"
      ? ["Deadline", item.person ?? TYPE_LABEL[item.taskType]]
      : item.type === "milestone"
        ? ["Unit due", item.person]
        : [EVENT_KIND_LABEL[item.kind], eventAudience(item, role)]

  const body = (
    <>
      <Time placement={placement} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-2 text-sm font-medium text-pretty text-on-surface">
          {item.type === "event" && item.mine ? <span className="sr-only">Edit </span> : null}
          {item.title}
        </span>
        <span className="flex items-center justify-between gap-3">
          <span className="truncate text-xs text-on-surface-muted">{meta.filter(Boolean).join(" · ")}</span>
          {item.type !== "event" ? (
            <span
              className={cn(
                "shrink-0 rounded-md px-1.5 py-px text-xs font-medium",
                STATUS_BADGE[item.status.tone]
              )}
            >
              {item.status.label}
            </span>
          ) : null}
        </span>
        {item.type === "event" && item.notes ? (
          <span
            className={cn(
              "text-xs leading-5 whitespace-pre-line text-on-surface-secondary",
              item.mine && "line-clamp-2"
            )}
          >
            {item.notes}
          </span>
        ) : null}
      </span>
    </>
  )

  if (item.type !== "event") {
    return (
      // A student's deadline opens as a dialog over the calendar, so stay put.
      <Link
        href={item.href}
        scroll={!(item.type === "deadline" && role === "student")}
        className={cn(rowClass, hoverClass)}
      >
        {body}
      </Link>
    )
  }

  if (!item.mine) return <div className={rowClass}>{body}</div>

  return (
    <button
      type="button"
      onClick={() => onEdit(item)}
      className={cn(rowClass, hoverClass, "cursor-pointer")}
    >
      {body}
    </button>
  )
}

/** Start over end in mono, or "All day"; the dot carries the item's colour. */
function Time({ placement }: { placement: DayPlacement }) {
  const label = placement.time ?? (placement.allDay ? "All day" : "Until")
  return (
    <span className="flex w-16 shrink-0 items-start gap-2">
      <Dot placement={placement} className="mt-[7px]" />
      <span className="flex flex-col text-xs leading-5 tabular-nums">
        <span className={cn(placement.time ? "font-mono text-on-surface" : "text-on-surface-secondary")}>
          {label}
        </span>
        {placement.until && (placement.time || placement.continues) ? (
          <span className="font-mono text-on-surface-muted">{placement.until}</span>
        ) : null}
      </span>
    </span>
  )
}
