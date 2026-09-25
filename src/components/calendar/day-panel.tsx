"use client"

import Link from "next/link"
import { cn } from "cn"

import { TopicTags } from "@/components/syllabus/topic-tags"
import { Badge } from "@/components/ui/badge"
import { TYPE_LABEL } from "@/lib/assignments/model"
import { formatPercent } from "@/lib/syllabus/model"
import { relativeDay, WEEKDAYS, weekdayIndex, type DayKey } from "@/lib/calendar/dates"
import {
  EVENT_KIND_LABEL,
  eventAudience,
  type DayPlacement,
  type EventItem,
  type WeekPlan,
} from "@/lib/calendar/model"

import { Dot, key } from "./month-grid"
import { PlanRow } from "./week-plans"

const MONTH_DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })

/**
 * The selected day as a card list (DESIGN.md › Card list): one bordered block,
 * rows split by hairlines, time on the left. Deadlines link to their
 * page; your own events open for editing; shared events are read-only.
 */
export function DayPanel({
  day,
  today,
  role,
  placements,
  plans,
  planHref,
  showPerson,
  onEdit,
  className,
}: {
  day: DayKey
  today: DayKey
  role: "tutor" | "student"
  placements: DayPlacement[]
  /** Syllabus topics planned for the week this day is in. */
  plans: WeekPlan[]
  planHref: (plan: WeekPlan) => string
  showPerson: boolean
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
          <Badge variant="blue">Today</Badge>
        ) : (
          <span className="shrink-0 text-xs text-on-surface-muted">{relative}</span>
        )}
      </header>

      {placements.length === 0 && plans.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-on-surface-muted">Nothing scheduled</p>
      ) : (
        <ul role="list" className="divide-y divide-outline">
          {plans.map((plan) => (
            <li key={plan.id}>
              <PlanRow plan={plan} href={planHref(plan)} showPerson={showPerson} />
            </li>
          ))}
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
      : item.type === "exam"
        ? ["Exam", item.person]
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
          {item.type === "deadline" ? (
            <Badge variant={item.status.tone}>{item.status.label}</Badge>
          ) : item.type === "exam" ? (
            <ExamResult percent={item.percent} ibGrade={item.ibGrade} />
          ) : null}
        </span>
        {item.type !== "event" ? <TopicTags tags={item.topics} max={4} inline /> : null}
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

/** "78% · 6", or nothing before it's marked. */
function ExamResult({ percent, ibGrade }: { percent: number | null; ibGrade: number | null }) {
  const parts = [percent === null ? null : formatPercent(percent), ibGrade === null ? null : `Grade ${ibGrade}`]
  const text = parts.filter(Boolean).join(" · ")
  return text ? <span className="shrink-0 font-mono text-xs text-on-surface-secondary tabular-nums">{text}</span> : null
}
