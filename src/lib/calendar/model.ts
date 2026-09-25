import type { TopicTag } from "@/lib/syllabus/model"
import type { AssignmentType, StatusTone } from "@/lib/assignments/model"
import type { Database } from "@/lib/supabase/database.types"

import {
  addDays,
  daysBetween,
  dayKeyOf,
  timeOf,
  utcDayKey,
  type DayKey,
} from "./dates"

export type EventKind = Database["public"]["Enums"]["calendar_event_kind"]

export const EVENT_KINDS = ["lesson", "exam", "study", "other"] as const satisfies readonly EventKind[]

export const EVENT_KIND_LABEL: Record<EventKind, string> = {
  lesson: "Lesson",
  exam: "Exam",
  study: "Study",
  other: "Other",
}

/** A task's deadline, read from the assignment itself. */
export type DeadlineItem = {
  type: "deadline"
  id: string
  title: string
  dueAt: string
  href: string
  taskType: AssignmentType
  status: { label: string; tone: StatusTone }
  /** The student it is for, on the tutor's calendar. */
  person: string | null
  /** Syllabus subtopics the task covers. */
  topics: TopicTag[]
}

/** Something a person put on their calendar themselves. */
export type EventItem = {
  type: "event"
  id: string
  title: string
  kind: EventKind
  notes: string | null
  allDay: boolean
  /** For all-day events, UTC midnights with an exclusive end. */
  startsAt: string
  endsAt: string
  /** Yours to edit. Otherwise someone shared it with you. */
  mine: boolean
  /** Your event, shared with this person. */
  sharedWith: { id: string; name: string } | null
  /** Someone else's event: whose. */
  from: string | null
}

export type CalendarItem = DeadlineItem | EventItem

export type Person = { id: string; name: string }

/** Past this, a range is a bug rather than an event. Matches the database. */
const MAX_SPAN_DAYS = 31

/** Every day an item appears on, in the viewer's zone. */
export function itemDays(item: CalendarItem, timeZone: string): DayKey[] {
  if (item.type === "deadline") return [dayKeyOf(item.dueAt, timeZone)]

  let first: DayKey
  let last: DayKey
  if (item.allDay) {
    first = utcDayKey(item.startsAt)
    last = addDays(utcDayKey(item.endsAt), -1)
  } else {
    first = dayKeyOf(item.startsAt, timeZone)
    // An event that ends at exactly midnight does not spill into the next day.
    last = dayKeyOf(new Date(new Date(item.endsAt).getTime() - 1), timeZone)
  }

  const span = Math.min(Math.max(daysBetween(first, last), 0), MAX_SPAN_DAYS)
  return Array.from({ length: span + 1 }, (_, i) => addDays(first, i))
}

/**
 * How an item reads on one particular day: its time, if it has one there.
 * A timed event that started on an earlier day has no start time today; it
 * reads as continuing.
 */
export type DayPlacement = {
  item: CalendarItem
  /** "18:00", or null for all-day and continuing items. */
  time: string | null
  /** "19:30" when an event ends on this day. */
  until: string | null
  allDay: boolean
  continues: boolean
  /** Minutes since midnight, for ordering. */
  order: number
}

function placementFor(item: CalendarItem, day: DayKey, timeZone: string): DayPlacement {
  if (item.type === "deadline") {
    const time = timeOf(item.dueAt, timeZone)
    return { item, time, until: null, allDay: false, continues: false, order: minutes(time) }
  }
  if (item.allDay) {
    return { item, time: null, until: null, allDay: true, continues: false, order: -1 }
  }

  const startsToday = dayKeyOf(item.startsAt, timeZone) === day
  const endsToday =
    dayKeyOf(new Date(new Date(item.endsAt).getTime() - 1), timeZone) === day
  const start = timeOf(item.startsAt, timeZone)
  const end = timeOf(item.endsAt, timeZone)

  if (startsToday) {
    return { item, time: start, until: end, allDay: false, continues: false, order: minutes(start) }
  }
  // Runs through the whole of this day: reads as all-day, marked as continuing.
  return {
    item,
    time: null,
    until: endsToday ? end : null,
    allDay: !endsToday,
    continues: true,
    order: endsToday ? 0 : -1,
  }
}

function minutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h! * 60 + m!
}

const TYPE_RANK: Record<CalendarItem["type"], number> = { deadline: 0, event: 1 }

/**
 * Items keyed by the day they appear on, each day in reading order: all-day
 * first, then by time; deadlines, then events.
 */
export function placeByDay(items: CalendarItem[], timeZone: string): Map<DayKey, DayPlacement[]> {
  const byDay = new Map<DayKey, DayPlacement[]>()
  for (const item of items) {
    for (const day of itemDays(item, timeZone)) {
      const list = byDay.get(day) ?? []
      list.push(placementFor(item, day, timeZone))
      byDay.set(day, list)
    }
  }
  for (const list of byDay.values()) {
    list.sort(
      (a, b) =>
        a.order - b.order ||
        TYPE_RANK[a.item.type] - TYPE_RANK[b.item.type] ||
        a.item.title.localeCompare(b.item.title)
    )
  }
  return byDay
}

/** One line describing who else is involved, for the day panel. */
export function eventAudience(item: EventItem, role: "tutor" | "student"): string {
  if (!item.mine) return item.from ? `From ${item.from}` : "Shared with you"
  if (item.sharedWith) {
    return role === "student" ? "Shared with your tutor" : `Shared with ${item.sharedWith.name}`
  }
  return "Only you"
}
