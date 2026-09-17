/**
 * Deadlines are stored absolute (timestamptz) and only ever *rendered* in a
 * timezone. Everything here converts between the two without inventing a
 * calendar library.
 */

export type DuePreset = {
  key: string
  label: string
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
    resolve: (now) => at(addDays(now, 1), 18),
  },
  {
    key: "friday",
    label: "Friday, 18:00",
    resolve: (now) => nextWeekday(now, 5, 18),
  },
  {
    key: "sunday",
    label: "Sunday, 20:00",
    resolve: (now) => nextWeekday(now, 0, 20),
  },
  {
    key: "next-week",
    label: "In a week, 18:00",
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
  locale?: string
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

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })

  if (abs < hour) return rtf.format(Math.round(diffMs / minute), "minute")
  if (abs < day) return rtf.format(Math.round(diffMs / hour), "hour")
  if (abs < 7 * day) return rtf.format(Math.round(diffMs / day), "day")
  return rtf.format(Math.round(diffMs / (7 * day)), "week")
}

export function isOverdue(iso: string, now: Date = new Date()): boolean {
  return new Date(iso).getTime() < now.getTime()
}
