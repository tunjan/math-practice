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
 * Whether a deadline still ahead lands on today or tomorrow on the viewer's
 * calendar. Calendar days rather than hours: at 23:00, something due at 09:00
 * is "tomorrow", not "in 10 hours".
 */
export function dueSoon(
  iso: string,
  timeZone?: string,
  now: Date = new Date()
): "today" | "tomorrow" | null {
  const due = new Date(iso)
  if (due.getTime() < now.getTime()) return null

  const dayOf = (date: Date) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone,
    }).formatToParts(date)
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((p) => p.type === type)?.value)
    // The calendar date as a day count, so DST never stretches "tomorrow".
    return Date.UTC(part("year"), part("month") - 1, part("day")) / 86_400_000
  }

  const days = dayOf(due) - dayOf(now)
  return days === 0 ? "today" : days === 1 ? "tomorrow" : null
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

/**
 * "5 days", "4 hours", or "15 March" once it's a week or more away: how long
 * is left before a deadline, for places where a flag already says "due".
 */
export function timeLeft(
  iso: string,
  timeZone?: string,
  now: Date = new Date()
): string {
  const diffMs = Math.max(new Date(iso).getTime() - now.getTime(), 0)
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  const left = (value: number, unit: string) =>
    `${value} ${unit}${value === 1 ? "" : "s"}`

  if (diffMs < hour) return left(Math.max(1, Math.round(diffMs / minute)), "minute")
  if (diffMs < day) return left(Math.round(diffMs / hour), "hour")
  if (diffMs < 7 * day) return left(Math.round(diffMs / day), "day")
  return new Date(iso).toLocaleDateString(LOCALE, { day: "numeric", month: "long", timeZone })
}
