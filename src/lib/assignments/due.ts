/**
 * Deadlines as the student will live them.
 *
 * A deadline is stored as one absolute moment, but it is *chosen* as a time on
 * someone's clock: "Friday, 18:00" means 18:00 where the student is, not where
 * the tutor happens to be. So the picker works in wall-clock values tied to an
 * explicit zone, and only converts to a moment on the way out.
 */

import {
  addDays,
  dayKeyOf,
  timeOf,
  weekdayIndex,
  zonedToInstant,
  type DayKey,
} from "@/lib/calendar/dates"

/**
 * "YYYY-MM-DDTHH:mm", the shape a `datetime-local` input speaks. It names a
 * time on a clock, so it means nothing without the zone it was read in.
 */
export type WallClock = string

const WALL_CLOCK = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/

/** The wall-clock time a moment shows in a zone. */
export function wallClockOf(instant: Date | string, timeZone: string): WallClock {
  return `${dayKeyOf(instant, timeZone)}T${timeOf(instant, timeZone)}`
}

/** The moment a wall-clock time names in a zone, or null if it isn't one. */
export function instantOf(wall: WallClock, timeZone: string): Date | null {
  const match = WALL_CLOCK.exec(wall)
  if (!match) return null
  const instant = zonedToInstant(match[1]!, match[2]!, timeZone)
  return Number.isNaN(instant.getTime()) ? null : instant
}

export type DuePreset = {
  key: string
  label: string
  /** For a compact chip; `label` is its accessible name. */
  short: string
  /** The deadline on the given zone's clock, counted from `now` in that zone. */
  resolve: (now: Date, timeZone: string) => WallClock
}

/** The next given weekday (0 = Monday), never today. */
function nextWeekday(today: DayKey, weekday: number): DayKey {
  return addDays(today, (weekday - weekdayIndex(today) + 7) % 7 || 7)
}

const today = (now: Date, timeZone: string) => dayKeyOf(now, timeZone)

export const DUE_PRESETS: DuePreset[] = [
  {
    key: "tomorrow",
    label: "Tomorrow, 18:00",
    short: "Tomorrow",
    resolve: (now, tz) => `${addDays(today(now, tz), 1)}T18:00`,
  },
  {
    key: "friday",
    label: "Friday, 18:00",
    short: "Friday",
    resolve: (now, tz) => `${nextWeekday(today(now, tz), 4)}T18:00`,
  },
  {
    key: "sunday",
    label: "Sunday, 20:00",
    short: "Sunday",
    resolve: (now, tz) => `${nextWeekday(today(now, tz), 6)}T20:00`,
  },
  {
    key: "next-week",
    label: "In a week, 18:00",
    short: "In a week",
    resolve: (now, tz) => `${addDays(today(now, tz), 7)}T18:00`,
  },
]

export function duePreset(key: string): DuePreset | undefined {
  return DUE_PRESETS.find((preset) => preset.key === key)
}
