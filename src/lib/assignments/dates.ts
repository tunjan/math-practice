/**
 * Deadlines are stored absolute (timestamptz) and only ever *rendered* in a
 * timezone. Everything here converts between the two without inventing a
 * calendar library.
 */

/**
 * Pinned so the server (Node defaults to en-US) and the browser render the
 * same strings; a mismatch breaks hydration of every client component that
 * shows a date. The app is written in British English.
 */
export const LOCALE = "en-GB"

export type DuePreset = {
  key: string
  label: string
  /** For a compact chip; `label` is its accessible name. */
  short: string
  /** Returns the due moment, computed from `now` in the viewer's local zone. */
  resolve: (now: Date) => Date
}

function at(base: Date, hours: number, minutes = 0): Date {
  const d = new Date(base)
  d.setHours(hours, minutes, 0, 0)
  return d
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

/** Next occurrence of a weekday (0 = Sunday), never today. */
function nextWeekday(base: Date, weekday: number, hours: number): Date {
  const d = at(base, hours)
  const delta = (weekday - d.getDay() + 7) % 7 || 7
  return addDays(d, delta)
}

export const DUE_PRESETS: DuePreset[] = [
  {
    key: "tomorrow",
    label: "Tomorrow, 18:00",
    short: "Tomorrow",
    resolve: (now) => at(addDays(now, 1), 18),
  },
  {
    key: "friday",
    label: "Friday, 18:00",
    short: "Friday",
    resolve: (now) => nextWeekday(now, 5, 18),
  },
  {
    key: "sunday",
    label: "Sunday, 20:00",
    short: "Sunday",
    resolve: (now) => nextWeekday(now, 0, 20),
  },
  {
    key: "next-week",
    label: "In a week, 18:00",
    short: "In a week",
    resolve: (now) => at(addDays(now, 7), 18),
  },
]

/**
 * `datetime-local` inputs speak a zone-less "YYYY-MM-DDTHH:mm". Formatting has
 * to go through the local parts rather than toISOString(), which would shift
 * the displayed time by the UTC offset.
 */
export function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

/** Parses that same zone-less value as a local time, giving an absolute moment. */
export function fromDateTimeLocalValue(value: string): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function resolvedTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return "local time"
  }
}

export function formatDue(
  iso: string,
  timeZone?: string,
  locale: string = LOCALE
): string {
  return new Date(iso).toLocaleString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  })
}

/**
 * "Wed 18 Sep": the day something happened, in the same shape as `formatDue`
 * minus the clock time, so every date in a view reads as one format.
 */
export function formatDay(
  iso: string,
  timeZone?: string,
  locale: string = LOCALE
): string {
  return new Date(iso).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone,
  })
}


/** "18 Sep": for dense places where even the weekday would be noise. */
export function formatShortDate(
  iso: string,
  timeZone?: string,
  locale: string = LOCALE
): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    timeZone,
  })
}

/** A deadline split for a calendar leaf: "Sep", "19", "Fri", "18:00". */
export function dateParts(
  iso: string,
  timeZone?: string
): { month: string; day: string; weekday: string; time: string } {
  const parts = new Intl.DateTimeFormat(LOCALE, {
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).formatToParts(new Date(iso))
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ""

  return {
    month: part("month"),
    day: part("day"),
    weekday: part("weekday"),
    time: `${part("hour")}:${part("minute")}`,
  }
}

/** "16 Sep, 14:03": when something happened, to the minute. */
export function formatMoment(
  iso: string,
  timeZone?: string,
  locale: string = LOCALE
): string {
  return new Date(iso).toLocaleString(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  })
}

/**
 * "in 3 days", "in 4 hours", "2 days ago". Deliberately coarse — a countdown
 * to the minute would make a deadline feel like an alarm.
 */
export function relativeToNow(iso: string, now: Date = new Date()): string {
  const target = new Date(iso).getTime()
  const diffMs = target - now.getTime()
  const abs = Math.abs(diffMs)

  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" })

  if (abs < hour) return rtf.format(Math.round(diffMs / minute), "minute")
  if (abs < day) return rtf.format(Math.round(diffMs / hour), "hour")
  if (abs < 7 * day) return rtf.format(Math.round(diffMs / day), "day")
  return rtf.format(Math.round(diffMs / (7 * day)), "week")
}

export function isOverdue(iso: string, now: Date = new Date()): boolean {
  return new Date(iso).getTime() < now.getTime()
}

/**
 * "3 days late", "20 minutes late": how far past a deadline a hand-in lands.
 * Same coarse units as `relativeToNow`, so the rail can say how late without
 * turning into a countdown. The first minute already counts as late.
 */
export function relativeLate(iso: string, now: Date = new Date()): string {
  const diffMs = Math.max(now.getTime() - new Date(iso).getTime(), 0)
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  const late = (value: number, unit: string) =>
    `${value} ${unit}${value === 1 ? "" : "s"} late`

  if (diffMs < hour) return late(Math.max(1, Math.round(diffMs / minute)), "minute")
  if (diffMs < day) return late(Math.max(1, Math.round(diffMs / hour)), "hour")
  if (diffMs < 7 * day) return late(Math.max(1, Math.round(diffMs / day)), "day")
  return late(Math.max(1, Math.round(diffMs / (7 * day))), "week")
}
