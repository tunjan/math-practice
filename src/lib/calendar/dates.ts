/**
 * Calendar arithmetic without a date library.
 *
 * A calendar day is a string, "YYYY-MM-DD", never a Date. A Date is a moment,
 * and which day a moment falls on depends on whose clock you read it by, so
 * every conversion between the two takes the viewer's timezone explicitly.
 * Arithmetic on day keys runs in UTC, where no daylight-saving shift can move
 * a day under it.
 *
 * The grid is Monday-first, as calendars are in the UK.
 */

import { LOCALE } from "@/lib/assignments/dates"

export type DayKey = string
export type MonthKey = string

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const MONTH_RE = /^(\d{4})-(\d{2})$/
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

export function isDayKey(value: unknown): value is DayKey {
  if (typeof value !== "string") return false
  const match = DAY_RE.exec(value)
  if (!match) return false
  // Round-trip rejects impossible dates such as 2026-02-30.
  return toUtcDate(value).toISOString().slice(0, 10) === value
}

export function isMonthKey(value: unknown): value is MonthKey {
  if (typeof value !== "string") return false
  const match = MONTH_RE.exec(value)
  if (!match) return false
  const month = Number(match[2])
  return month >= 1 && month <= 12
}

export function isTime(value: unknown): value is string {
  return typeof value === "string" && TIME_RE.test(value)
}

// ── Keys ────────────────────────────────────────────────────────────────────

function toUtcDate(day: DayKey): Date {
  const [y, m, d] = day.split("-").map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!))
}

function fromUtcDate(date: Date): DayKey {
  return date.toISOString().slice(0, 10)
}

export function addDays(day: DayKey, days: number): DayKey {
  const date = toUtcDate(day)
  date.setUTCDate(date.getUTCDate() + days)
  return fromUtcDate(date)
}

export function addMonths(month: MonthKey, months: number): MonthKey {
  const [y, m] = month.split("-").map(Number)
  const date = new Date(Date.UTC(y!, m! - 1 + months, 1))
  return fromUtcDate(date).slice(0, 7)
}

export function monthOf(day: DayKey): MonthKey {
  return day.slice(0, 7)
}

export function firstOfMonth(month: MonthKey): DayKey {
  return `${month}-01`
}

/** Whole days from `a` to `b`. Positive when `b` is later. */
export function daysBetween(a: DayKey, b: DayKey): number {
  return Math.round((toUtcDate(b).getTime() - toUtcDate(a).getTime()) / 86_400_000)
}

/** 0 for Monday through 6 for Sunday. */
export function weekdayIndex(day: DayKey): number {
  return (toUtcDate(day).getUTCDay() + 6) % 7
}

/**
 * The weeks a month view shows: Monday of the week holding the 1st through
 * Sunday of the week holding the last day. Four to six rows.
 */
export function monthGrid(month: MonthKey): DayKey[][] {
  const first = firstOfMonth(month)
  const last = addDays(firstOfMonth(addMonths(month, 1)), -1)
  const start = addDays(first, -weekdayIndex(first))
  const end = addDays(last, 6 - weekdayIndex(last))

  const weeks: DayKey[][] = []
  for (let day = start; day <= end; day = addDays(day, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(day, i)))
  }
  return weeks
}

// ── Moments and zones ───────────────────────────────────────────────────────

const partsFormatters = new Map<string, Intl.DateTimeFormat>()

function wallClock(instant: Date, timeZone: string) {
  let formatter = partsFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
    partsFormatters.set(timeZone, formatter)
  }
  const parts: Record<string, number> = {}
  for (const part of formatter.formatToParts(instant)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value)
  }
  return parts as Record<"year" | "month" | "day" | "hour" | "minute" | "second", number>
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

/** The calendar day a moment falls on, by the given zone's clock. */
export function dayKeyOf(instant: Date | string, timeZone: string): DayKey {
  const p = wallClock(new Date(instant), timeZone)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`
}

/** "16:30", by the given zone's clock. */
export function timeOf(instant: Date | string, timeZone: string): string {
  const p = wallClock(new Date(instant), timeZone)
  return `${pad(p.hour)}:${pad(p.minute)}`
}

/** How far the zone's wall clock is ahead of UTC at that moment, in ms. */
function zoneOffset(instant: Date, timeZone: string): number {
  const p = wallClock(instant, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000
}

/**
 * The moment a wall-clock time names in a zone: "16:30 on 18 Sep in
 * Europe/London". Guesses with the offset at that wall time, then corrects
 * once, which settles every case including the days the clocks change. A time
 * that does not exist (skipped by a spring-forward) lands an hour later, as
 * phones do.
 */
export function zonedToInstant(day: DayKey, time: string, timeZone: string): Date {
  const [y, m, d] = day.split("-").map(Number)
  const [hh, mm] = time.split(":").map(Number)
  const wall = Date.UTC(y!, m! - 1, d!, hh!, mm!)
  let guess = wall - zoneOffset(new Date(wall), timeZone)
  const corrected = wall - zoneOffset(new Date(guess), timeZone)
  if (corrected !== guess) guess = corrected
  return new Date(guess)
}

/** Midnight at the start of `day` in the zone. */
export function startOfDay(day: DayKey, timeZone: string): Date {
  return zonedToInstant(day, "00:00", timeZone)
}

/** All-day events are stored as UTC midnights; this reads one back. */
export function utcDayKey(instant: Date | string): DayKey {
  return new Date(instant).toISOString().slice(0, 10)
}

export function utcMidnight(day: DayKey): string {
  return `${day}T00:00:00.000Z`
}

// ── Words ───────────────────────────────────────────────────────────────────
//
// Day keys are formatted as UTC dates, so the label never depends on the
// runtime's own zone: server and browser print the same thing.

const monthTitle = new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric", timeZone: "UTC" })
const dayTitle = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
})
const dayShort = new Intl.DateTimeFormat(LOCALE, {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
})
const dayLong = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

/** "September 2026" */
export function formatMonth(month: MonthKey): string {
  return monthTitle.format(toUtcDate(firstOfMonth(month)))
}

/** "Friday 18 September" */
export function formatDay(day: DayKey): string {
  return dayTitle.format(toUtcDate(day))
}

/** "Fri 18 Sep" */
export function formatDayShort(day: DayKey): string {
  return dayShort.format(toUtcDate(day))
}

/** "Friday 18 September 2026", for screen readers on grid cells. */
export function formatDayLong(day: DayKey): string {
  return dayLong.format(toUtcDate(day))
}

export const WEEKDAYS = [
  { short: "Mon", long: "Monday" },
  { short: "Tue", long: "Tuesday" },
  { short: "Wed", long: "Wednesday" },
  { short: "Thu", long: "Thursday" },
  { short: "Fri", long: "Friday" },
  { short: "Sat", long: "Saturday" },
  { short: "Sun", long: "Sunday" },
] as const

/** "Today", "Tomorrow", "In 3 days", "2 weeks ago". */
export function relativeDay(day: DayKey, today: DayKey): string {
  const diff = daysBetween(today, day)
  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  if (diff === -1) return "Yesterday"
  const abs = Math.abs(diff)
  const amount =
    abs < 14 ? `${abs} days` : abs < 60 ? `${Math.round(abs / 7)} weeks` : `${Math.round(abs / 30)} months`
  return diff > 0 ? `In ${amount}` : `${amount} ago`
}
