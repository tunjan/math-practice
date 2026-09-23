"use server"

import { revalidatePath } from "next/cache"

import { requireRole } from "@/lib/auth/session"
import { isDayKey } from "@/lib/calendar/dates"
import { createClient } from "@/lib/supabase/server"

import { asConfidence, asMastery } from "./model"

export type PlanActionState = { error?: string; notice?: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const MAX_OBJECTIVES = 20

function field(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim()
}

function revalidatePlan(studentId: string) {
  revalidatePath(`/tutor/students/${studentId}`)
  revalidatePath("/student/plan")
  revalidatePath("/student")
}

/** The student a unit's plan belongs to, for revalidation. RLS scopes the read. */
async function studentOfUnit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  unitId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("plan_units")
    .select("learning_plans(student_id)")
    .eq("id", unitId)
    .maybeSingle()
  return data?.learning_plans?.student_id ?? null
}

// ── Tutor ───────────────────────────────────────────────────────────────────

/** Creates the student's plan, or updates it: there is only ever one each. */
export async function savePlan(_prev: PlanActionState, formData: FormData): Promise<PlanActionState> {
  await requireRole("tutor")
  const supabase = await createClient()

  const studentId = field(formData, "student_id")
  const title = field(formData, "title")
  const goal = field(formData, "goal")
  const startsOn = field(formData, "starts_on")
  const endsOn = field(formData, "ends_on")
  const weeklyGoal = Number(field(formData, "weekly_goal_days"))

  if (!UUID.test(studentId)) return { error: "Unknown student." }
  if (!title) return { error: "Give the plan a title." }
  if (title.length > 200) return { error: "That title is too long." }
  if (goal.length > 5000) return { error: "That goal is too long." }
  if (!isDayKey(startsOn) || !isDayKey(endsOn)) return { error: "Pick a start and end date." }
  if (endsOn < startsOn) return { error: "The plan must end after it starts." }
  if (!Number.isInteger(weeklyGoal) || weeklyGoal < 1 || weeklyGoal > 7) {
    return { error: "The weekly goal is between 1 and 7 days." }
  }

  const { error } = await supabase.from("learning_plans").upsert(
    {
      student_id: studentId,
      title,
      goal: goal || null,
      starts_on: startsOn,
      ends_on: endsOn,
      weekly_goal_days: weeklyGoal,
    },
    { onConflict: "student_id" }
  )
  if (error) return { error: "Couldn't save the plan. Please try again." }

  revalidatePlan(studentId)
  return { notice: "Plan saved." }
}

type ObjectiveInput = { id: string | null; statement: string }

function parseObjectives(raw: string): ObjectiveInput[] | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw || "[]")
  } catch {
    return null
  }
  if (!Array.isArray(parsed)) return null

  return parsed
    .flatMap((entry): ObjectiveInput[] => {
      if (typeof entry !== "object" || entry === null) return []
      const { id, statement } = entry as { id?: unknown; statement?: unknown }
      const text = String(statement ?? "").trim()
      if (!text) return []
      return [{ id: typeof id === "string" && UUID.test(id) ? id : null, statement: text.slice(0, 300) }]
    })
    .slice(0, MAX_OBJECTIVES)
}

/**
 * Creates or edits a unit together with its objectives. Objectives keep their
 * ids across edits, so rewording one keeps the student's confidence on it;
 * only removing it drops that.
 */
export async function saveUnit(_prev: PlanActionState, formData: FormData): Promise<PlanActionState> {
  await requireRole("tutor")
  const supabase = await createClient()

  const unitId = field(formData, "unit_id")
  const planId = field(formData, "plan_id")
  const title = field(formData, "title")
  const description = field(formData, "description")
  const categoryId = field(formData, "category_id")
  const startsOn = field(formData, "starts_on")
  const dueOn = field(formData, "due_on")
  const objectives = parseObjectives(field(formData, "objectives"))

  if (unitId && !UUID.test(unitId)) return { error: "Unknown unit." }
  if (!UUID.test(planId)) return { error: "Unknown plan." }
  if (!title) return { error: "Give the unit a title." }
  if (title.length > 200) return { error: "That title is too long." }
  if (description.length > 5000) return { error: "That description is too long." }
  if (!isDayKey(startsOn) || !isDayKey(dueOn)) return { error: "Pick a start and due date." }
  if (dueOn < startsOn) return { error: "The unit must be due after it starts." }
  if (!objectives) return { error: "Something went wrong with the objectives. Please reload." }

  const { data: plan } = await supabase
    .from("learning_plans")
    .select("id, student_id")
    .eq("id", planId)
    .maybeSingle()
  if (!plan) return { error: "That plan no longer exists." }

  const values = {
    title,
    description: description || null,
    category_id: UUID.test(categoryId) ? categoryId : null,
    starts_on: startsOn,
    due_on: dueOn,
  }

  let id = unitId
  if (id) {
    const { error } = await supabase.from("plan_units").update(values).eq("id", id).eq("plan_id", planId)
    if (error) return { error: "Couldn't save the unit. Please try again." }
  } else {
    const { data: last } = await supabase
      .from("plan_units")
      .select("position")
      .eq("plan_id", planId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle()
    const { data: created, error } = await supabase
      .from("plan_units")
      .insert({ ...values, plan_id: planId, position: (last?.position ?? 0) + 1 })
      .select("id")
      .single()
    if (error || !created) return { error: "Couldn't add the unit. Please try again." }
    id = created.id
  }

  // Reconcile objectives: drop the removed, update the kept, add the new.
  const { data: existing } = await supabase.from("plan_objectives").select("id").eq("unit_id", id)
  const keep = new Set(objectives.flatMap((o) => (o.id ? [o.id] : [])))
  const removed = (existing ?? []).map((o) => o.id).filter((oid) => !keep.has(oid))

  if (removed.length) {
    await supabase.from("plan_objectives").delete().in("id", removed)
  }

  const known = new Set((existing ?? []).map((o) => o.id))
  const writes = objectives.map((o, index) =>
    o.id && known.has(o.id)
      ? supabase.from("plan_objectives").update({ statement: o.statement, position: index + 1 }).eq("id", o.id)
      : supabase.from("plan_objectives").insert({ unit_id: id, statement: o.statement, position: index + 1 })
  )
  const results = await Promise.all(writes)
  if (results.some((r) => r.error)) return { error: "The unit saved, but some objectives didn't. Please try again." }

  revalidatePlan(plan.student_id)
  return { notice: unitId ? "Unit saved." : "Unit added." }
}

/** Swaps a unit with its neighbour. */
export async function moveUnit(unitId: string, direction: "up" | "down"): Promise<PlanActionState> {
  await requireRole("tutor")
  if (!UUID.test(unitId)) return { error: "Unknown unit." }
  const supabase = await createClient()

  const { data: unit } = await supabase
    .from("plan_units")
    .select("id, plan_id, position")
    .eq("id", unitId)
    .maybeSingle()
  if (!unit) return { error: "That unit no longer exists." }

  const neighbourQuery = supabase
    .from("plan_units")
    .select("id, position")
    .eq("plan_id", unit.plan_id)
  const { data: neighbour } = await (direction === "up"
    ? neighbourQuery.lt("position", unit.position).order("position", { ascending: false })
    : neighbourQuery.gt("position", unit.position).order("position", { ascending: true })
  )
    .limit(1)
    .maybeSingle()
  if (!neighbour) return {}

  // Each request is its own transaction, so park one unit out of the way
  // rather than lean on the deferred unique constraint.
  await supabase.from("plan_units").update({ position: -unit.position }).eq("id", unit.id)
  await supabase.from("plan_units").update({ position: unit.position }).eq("id", neighbour.id)
  const { error } = await supabase.from("plan_units").update({ position: neighbour.position }).eq("id", unit.id)
  if (error) return { error: "Couldn't move the unit. Please try again." }

  const studentId = await studentOfUnit(supabase, unit.id)
  if (studentId) revalidatePlan(studentId)
  return {}
}

export async function deleteUnit(unitId: string): Promise<PlanActionState> {
  await requireRole("tutor")
  if (!UUID.test(unitId)) return { error: "Unknown unit." }
  const supabase = await createClient()

  const studentId = await studentOfUnit(supabase, unitId)
  const { error } = await supabase.from("plan_units").delete().eq("id", unitId)
  if (error) return { error: "Couldn't delete the unit. Please try again." }

  if (studentId) revalidatePlan(studentId)
  return { notice: "Unit deleted." }
}

export async function setMastery(_prev: PlanActionState, formData: FormData): Promise<PlanActionState> {
  await requireRole("tutor")
  const supabase = await createClient()

  const unitId = field(formData, "unit_id")
  const mastery = asMastery(field(formData, "mastery"))
  const note = field(formData, "mastery_note")

  if (!UUID.test(unitId)) return { error: "Unknown unit." }
  if (!mastery) return { error: "Pick a rating." }
  if (note.length > 2000) return { error: "That note is too long." }

  const { error } = await supabase
    .from("plan_units")
    .update({ mastery, mastery_note: note || null })
    .eq("id", unitId)
  if (error) return { error: "Couldn't save the rating. Please try again." }

  const studentId = await studentOfUnit(supabase, unitId)
  if (studentId) revalidatePlan(studentId)
  return { notice: "Rating saved." }
}

// ── Student ─────────────────────────────────────────────────────────────────

/**
 * The student's self-check on one objective. The database narrows the write to
 * `confidence`, stamps `checked_at` and records today as a study day.
 */
export async function setConfidence(objectiveId: string, value: number): Promise<PlanActionState> {
  await requireRole("student")
  const confidence = asConfidence(value)
  if (!UUID.test(objectiveId) || confidence === null) return { error: "Something went wrong." }

  const supabase = await createClient()
  const { error } = await supabase.from("plan_objectives").update({ confidence }).eq("id", objectiveId)
  if (error) return { error: "Couldn't save that. Please try again." }

  revalidatePath("/student/plan")
  revalidatePath("/student")
  return {}
}

export async function logStudySession(): Promise<PlanActionState> {
  await requireRole("student")
  const supabase = await createClient()

  const { error } = await supabase.rpc("log_study_session")
  if (error) return { error: "Couldn't log the session. Please try again." }

  revalidatePath("/student/plan")
  revalidatePath("/student")
  return { notice: "Study session logged for today." }
}
