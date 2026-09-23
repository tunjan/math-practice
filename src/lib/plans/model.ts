import type { StatusTone } from "@/lib/assignments/model"
import { addDays, daysBetween, type DayKey } from "@/lib/calendar/dates"
import type { Database } from "@/lib/supabase/database.types"

export type Mastery = Database["public"]["Enums"]["plan_mastery"]

export const MASTERY_LEVELS = ["not_started", "developing", "secure"] as const satisfies readonly Mastery[]

/** The tutor's rating of a unit. Never blended with the student's self-check. */
export const MASTERY: Record<Mastery, { label: string; tone: StatusTone }> = {
  not_started: { label: "Not started", tone: "violet" },
  developing: { label: "Developing", tone: "accent" },
  secure: { label: "Secure", tone: "success" },
}

export function asMastery(value: unknown): Mastery | null {
  return MASTERY_LEVELS.includes(value as Mastery) ? (value as Mastery) : null
}

/** The student's self-check on one objective. */
export type Confidence = 0 | 1 | 2

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  0: "Not yet",
  1: "Getting there",
  2: "Confident",
}

export function asConfidence(value: unknown): Confidence | null {
  const n = Number(value)
  return n === 0 || n === 1 || n === 2 ? n : null
}

export type Objective = {
  id: string
  position: number
  statement: string
  confidence: Confidence
  checkedAt: string | null
}

export type UnitTask = {
  id: string
  title: string
  dueAt: string
  status: { label: string; tone: StatusTone }
}

export type Unit = {
  id: string
  position: number
  title: string
  topic: { id: string; name: string } | null
  description: string | null
  startsOn: DayKey
  dueOn: DayKey
  mastery: Mastery
  masteryNote: string | null
  masteredAt: string | null
  objectives: Objective[]
  tasks: UnitTask[]
}

export type Plan = {
  id: string
  studentId: string
  title: string
  goal: string | null
  startsOn: DayKey
  endsOn: DayKey
  weeklyGoalDays: number
  units: Unit[]
}

/** Mean confidence across a unit's objectives, 0–100. Null with no objectives. */
export function unitSelfProgress(objectives: Objective[]): number | null {
  if (objectives.length === 0) return null
  const sum = objectives.reduce((total, o) => total + o.confidence, 0)
  return Math.round((sum / (objectives.length * 2)) * 100)
}

export type PlanProgress = {
  total: number
  secure: number
  developing: number
  /** Self-check across every objective in the plan, 0–100. Null with none. */
  selfPct: number | null
}

export function planProgress(units: Unit[]): PlanProgress {
  return {
    total: units.length,
    secure: units.filter((u) => u.mastery === "secure").length,
    developing: units.filter((u) => u.mastery === "developing").length,
    selfPct: unitSelfProgress(units.flatMap((u) => u.objectives)),
  }
}

/** A unit due within this many days, and not yet secure, is "due soon". */
const DUE_SOON_DAYS = 3

export type UnitTiming = "upcoming" | "current" | "due_soon" | "overdue" | "done"

export const TIMING: Record<UnitTiming, { label: string; tone: StatusTone }> = {
  upcoming: { label: "Upcoming", tone: "violet" },
  current: { label: "In progress", tone: "info" },
  due_soon: { label: "Due soon", tone: "warning" },
  overdue: { label: "Overdue", tone: "error" },
  done: { label: "Done", tone: "success" },
}

/** Where a unit sits against its dates. Secure means done, whatever the date. */
export function unitTiming(unit: Pick<Unit, "startsOn" | "dueOn" | "mastery">, today: DayKey): UnitTiming {
  if (unit.mastery === "secure") return "done"
  if (today > unit.dueOn) return "overdue"
  if (today < unit.startsOn) return "upcoming"
  if (daysBetween(today, unit.dueOn) <= DUE_SOON_DAYS) return "due_soon"
  return "current"
}

/**
 * The unit to put in front of the student: the earliest one that is live or
 * behind, otherwise the next to start. Null once everything is secure.
 */
export function focusUnit(units: Unit[], today: DayKey): Unit | null {
  const open = units.filter((u) => unitTiming(u, today) !== "done")
  return (
    open.find((u) => unitTiming(u, today) !== "upcoming") ??
    open.find((u) => unitTiming(u, today) === "upcoming") ??
    null
  )
}

/** A sensible default window for a new unit: it starts when the last one ends. */
export function nextUnitDates(units: Unit[], planStartsOn: DayKey, today: DayKey): { startsOn: DayKey; dueOn: DayKey } {
  const last = units.at(-1)
  const startsOn = last ? addDays(last.dueOn, 1) : planStartsOn > today ? planStartsOn : today
  return { startsOn, dueOn: addDays(startsOn, 13) }
}
