"use server"

import { revalidatePath } from "next/cache"

import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

import { isDayKey } from "@/lib/calendar/dates"

import {
  COURSES,
  LEVELS,
  PROGRAMMES,
  STATUSES,
  type Course,
  type Level,
  type Programme,
  type TopicStatus,
} from "./model"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type CourseFormState = { error?: string; saved?: { at: number; cleared: boolean } }

/**
 * Sets, or with `intent=clear` removes, a student's programme, course and
 * level. The database keeps the three together and lets only the tutor write
 * them; this check is for a readable message.
 */
export async function saveStudentCourse(
  _prev: CourseFormState,
  formData: FormData
): Promise<CourseFormState> {
  await requireRole("tutor")

  const studentId = String(formData.get("student_id") ?? "")
  if (!UUID.test(studentId)) return { error: "That student no longer exists." }

  let values: { programme: Programme | null; course: Course | null; level: Level | null }
  if (formData.get("intent") === "clear") {
    values = { programme: null, course: null, level: null }
  } else {
    const programme = String(formData.get("programme") ?? "") as Programme
    const course = String(formData.get("course") ?? "") as Course
    const level = String(formData.get("level") ?? "") as Level
    if (!PROGRAMMES.includes(programme)) return { error: "Pick a programme." }
    if (!COURSES.includes(course)) return { error: "Pick a course." }
    if (!LEVELS.includes(level)) return { error: "Pick a level." }
    values = { programme, course, level }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", studentId)
    .eq("role", "student")
    .select("id")
  if (error) return { error: error.message }
  if (!data?.length) return { error: "That student no longer exists." }

  revalidatePath(`/tutor/students/${studentId}`)
  return { saved: { at: Date.now(), cleared: values.course === null } }
}

export type ProgressPatch = {
  status?: TopicStatus
  stars?: number
  plannedStart?: string | null
  plannedEnd?: string | null
  notes?: string | null
}

/**
 * Writes the same change to one or more of a student's subtopics, creating
 * their rows as needed. Only the fields in `patch` change; the rest keep
 * what they had (or their defaults, for a new row).
 */
export async function saveTopicProgress(
  studentId: string,
  topicIds: string[],
  patch: ProgressPatch
): Promise<{ error?: string }> {
  await requireRole("tutor")
  if (!UUID.test(studentId)) return { error: "That student no longer exists." }
  const ids = [...new Set(topicIds)].filter((id) => UUID.test(id))
  if (ids.length === 0 || ids.length > 200) return { error: "Pick at least one topic." }

  const values: Record<string, unknown> = {}
  if (patch.status !== undefined) {
    if (!STATUSES.includes(patch.status)) return { error: "Unknown status." }
    values.status = patch.status
  }
  if (patch.stars !== undefined) {
    if (!Number.isInteger(patch.stars) || patch.stars < 0 || patch.stars > 5) return { error: "Stars go from 0 to 5." }
    values.stars = patch.stars
  }
  for (const [key, column] of [
    ["plannedStart", "planned_start"],
    ["plannedEnd", "planned_end"],
  ] as const) {
    const value = patch[key]
    if (value === undefined) continue
    if (value !== null && !isDayKey(value)) return { error: "That date isn't valid." }
    values[column] = value
  }
  if (
    typeof values.planned_start === "string" &&
    typeof values.planned_end === "string" &&
    values.planned_start > values.planned_end
  ) {
    return { error: "The plan has to start before it ends." }
  }
  if (patch.notes !== undefined) {
    const notes = patch.notes?.trim() ?? ""
    if (notes.length > 2000) return { error: "Notes can be up to 2,000 characters." }
    values.notes = notes || null
  }
  if (Object.keys(values).length === 0) return {}

  const supabase = await createClient()
  const { error } = await supabase
    .from("topic_progress")
    .upsert(
      ids.map((topicId) => ({ student_id: studentId, topic_id: topicId, ...values })),
      { onConflict: "student_id,topic_id" }
    )
  if (error) {
    if (error.message.includes("topic_progress_window")) return { error: "The plan has to start before it ends." }
    return { error: error.message }
  }

  revalidateTracker(studentId)
  return {}
}

function revalidateTracker(studentId: string) {
  revalidatePath(`/tutor/students/${studentId}`)
  revalidatePath("/student/syllabus")
  revalidatePath("/tutor/calendar")
  revalidatePath("/student/calendar")
}
