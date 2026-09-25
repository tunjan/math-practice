import "server-only"

import type { createClient } from "@/lib/supabase/server"

import { EMPTY_PROGRESS, topicsForCourse, type StudentCourse, type SyllabusTopic, type TrackerRow } from "./model"

type Supabase = Awaited<ReturnType<typeof createClient>>

/** Every subtopic of both courses: 161 small rows, read-only reference data. */
export async function loadSyllabus(supabase: Supabase): Promise<SyllabusTopic[]> {
  const { data } = await supabase
    .from("syllabus_topics")
    .select("id, course, level, topic, subtopic, code, title")
    .order("course")
    .order("topic")
    .order("subtopic")
  return data ?? []
}

/**
 * A student's tracker: every subtopic of their course with what the tutor has
 * recorded and how many of the student's tasks are tagged with it. RLS limits
 * a student to their own rows; the query also narrows to one student for the
 * tutor.
 */
export async function loadTracker(
  supabase: Supabase,
  studentId: string,
  course: StudentCourse
): Promise<TrackerRow[]> {
  const [syllabus, { data: progress }, { data: tagged }] = await Promise.all([
    loadSyllabus(supabase),
    supabase
      .from("topic_progress")
      .select("topic_id, status, stars, planned_start, planned_end, notes")
      .eq("student_id", studentId),
    supabase
      .from("assignment_topics")
      .select("topic_id, assignments!inner(student_id)")
      .eq("assignments.student_id", studentId),
  ])

  const byTopic = new Map((progress ?? []).map((row) => [row.topic_id, row]))
  const counts = new Map<string, number>()
  for (const row of tagged ?? []) counts.set(row.topic_id, (counts.get(row.topic_id) ?? 0) + 1)

  return topicsForCourse(syllabus, course).map((topic) => {
    const row = byTopic.get(topic.id)
    return {
      ...topic,
      progress: row
        ? {
            status: row.status,
            stars: row.stars,
            plannedStart: row.planned_start,
            plannedEnd: row.planned_end,
            notes: row.notes,
          }
        : EMPTY_PROGRESS,
      taskCount: counts.get(topic.id) ?? 0,
    }
  })
}
