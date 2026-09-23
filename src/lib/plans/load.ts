import "server-only"

import { asStage, assignmentStatus } from "@/lib/assignments/model"
import { addDays, type DayKey } from "@/lib/calendar/dates"
import type { createClient } from "@/lib/supabase/server"

import { asConfidence, type Plan, type Unit } from "./model"
import { weekStart } from "./streak"

type Supabase = Awaited<ReturnType<typeof createClient>>

/** Weeks of study days fetched: enough for any streak worth showing. */
export const STREAK_WINDOW_WEEKS = 26

export type LoadedPlan = {
  plan: Plan
  studyDays: Set<DayKey>
}

/**
 * A student's plan with its units, objectives and linked tasks, plus recent
 * study days. RLS decides who may read it: the tutor, or the student
 * themselves. Null when no plan exists yet.
 */
export async function loadPlan(
  supabase: Supabase,
  studentId: string,
  today: DayKey,
  now: Date = new Date()
): Promise<LoadedPlan | null> {
  const since = addDays(weekStart(today), -7 * (STREAK_WINDOW_WEEKS - 1))

  const [{ data: row }, { data: days }] = await Promise.all([
    supabase
      .from("learning_plans")
      .select(
        `id, student_id, title, goal, starts_on, ends_on, weekly_goal_days,
         plan_units(
           id, position, title, description, starts_on, due_on,
           mastery, mastery_note, mastered_at,
           categories(id, name),
           plan_objectives(id, position, statement, confidence, checked_at),
           assignments(id, title, due_at, stage, verdict)
         )`
      )
      .eq("student_id", studentId)
      .maybeSingle(),
    supabase
      .from("study_days")
      .select("day")
      .eq("student_id", studentId)
      .gte("day", since),
  ])

  if (!row) return null

  const units: Unit[] = (row.plan_units ?? [])
    .map((u) => ({
      id: u.id,
      position: u.position,
      title: u.title,
      topic: u.categories ? { id: u.categories.id, name: u.categories.name } : null,
      description: u.description,
      startsOn: u.starts_on,
      dueOn: u.due_on,
      mastery: u.mastery,
      masteryNote: u.mastery_note,
      masteredAt: u.mastered_at,
      objectives: (u.plan_objectives ?? [])
        .map((o) => ({
          id: o.id,
          position: o.position,
          statement: o.statement,
          confidence: asConfidence(o.confidence) ?? 0,
          checkedAt: o.checked_at,
        }))
        .sort((a, b) => a.position - b.position),
      tasks: (u.assignments ?? [])
        .map((a) => {
          const stage = asStage(a.stage)
          const handedIn = stage === "submitted" || stage === "reviewed"
          return {
            id: a.id,
            title: a.title,
            dueAt: a.due_at,
            status: assignmentStatus(stage, a.verdict, !handedIn && new Date(a.due_at) < now),
          }
        })
        .sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    }))
    .sort((a, b) => a.position - b.position)

  return {
    plan: {
      id: row.id,
      studentId: row.student_id,
      title: row.title,
      goal: row.goal,
      startsOn: row.starts_on,
      endsOn: row.ends_on,
      weeklyGoalDays: row.weekly_goal_days,
      units,
    },
    studyDays: new Set((days ?? []).map((d) => d.day)),
  }
}
