/**
 * The weekly study goal and its streak.
 *
 * A study day is any day the database recorded activity for the student (a
 * self-check, a hand-in, a logged session). Weeks run Monday to Sunday in the
 * student's own zone, the same as the calendar. The streak is the run of
 * consecutive weeks that met the goal. The current week joins the run only
 * once it is met, and an unfinished week never breaks it: on a Tuesday a
 * student who met the goal every week so far still has their streak.
 */

import { addDays, weekdayIndex, type DayKey } from "@/lib/calendar/dates"

export function weekStart(day: DayKey): DayKey {
  return addDays(day, -weekdayIndex(day))
}

export type WeekDay = {
  day: DayKey
  active: boolean
  isToday: boolean
  isFuture: boolean
}

export type WeekStatus = {
  days: WeekDay[]
  active: number
  goal: number
  met: boolean
}

export function weekStatus(studyDays: ReadonlySet<DayKey>, goal: number, today: DayKey): WeekStatus {
  const monday = weekStart(today)
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, i)
    return { day, active: studyDays.has(day), isToday: day === today, isFuture: day > today }
  })
  const active = days.filter((d) => d.active).length
  return { days, active, goal, met: active >= goal }
}

function activeInWeek(studyDays: ReadonlySet<DayKey>, monday: DayKey): number {
  let count = 0
  for (let i = 0; i < 7; i++) if (studyDays.has(addDays(monday, i))) count++
  return count
}

/** Consecutive weeks meeting the goal, counting back from this week. */
export function streakWeeks(
  studyDays: ReadonlySet<DayKey>,
  goal: number,
  today: DayKey,
  /** How far back to look; the loader only fetches this much. */
  maxWeeks = 26
): number {
  let monday = weekStart(today)
  let streak = 0

  if (activeInWeek(studyDays, monday) >= goal) streak++
  monday = addDays(monday, -7)

  for (let i = 1; i < maxWeeks; i++) {
    if (activeInWeek(studyDays, monday) < goal) break
    streak++
    monday = addDays(monday, -7)
  }
  return streak
}
