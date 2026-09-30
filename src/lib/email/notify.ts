import "server-only"

import type { createClient } from "@/lib/supabase/server"
import { sendEmail } from "./send"
import { feedbackEmail, newTaskEmail } from "./templates"

type Supabase = Awaited<ReturnType<typeof createClient>>

/**
 * Both notifications read the task back from the database rather than trusting
 * what the action was handed, so the email always describes the row that was
 * actually written. They run as the tutor, whose policies already cover the
 * task and its student.
 */
async function loadTask(supabase: Supabase, assignmentId: string) {
  const { data: task, error: taskError } = await supabase
    .from("assignments")
    .select("id, title, type, difficulty, due_at, verdict, feedback, student_id")
    .eq("id", assignmentId)
    .maybeSingle()
  if (!task) {
    console.warn(`[email] No task ${assignmentId} to notify about:`, taskError?.message ?? "not found")
    return null
  }

  const { data: student, error: studentError } = await supabase
    .from("profiles")
    .select("email, full_name, timezone")
    .eq("id", task.student_id)
    .maybeSingle()
  if (!student?.email) {
    console.warn(`[email] No address for the student on task ${assignmentId}:`, studentError?.message ?? "no email")
    return null
  }

  return { task, student: { ...student, email: student.email } }
}

export async function notifyNewTask(supabase: Supabase, assignmentId: string, origin: string) {
  const loaded = await loadTask(supabase, assignmentId)
  if (!loaded) return
  const { task, student } = loaded

  await sendEmail(
    student.email,
    newTaskEmail({
      fullName: student.full_name,
      title: task.title,
      type: task.type,
      difficulty: task.difficulty,
      dueAt: task.due_at,
      timeZone: student.timezone,
      url: `${origin}/student/tasks/${task.id}`,
    })
  )
}

export async function notifyFeedback(supabase: Supabase, assignmentId: string, origin: string) {
  const loaded = await loadTask(supabase, assignmentId)
  if (!loaded?.task.verdict) return
  const { task, student } = loaded

  await sendEmail(
    student.email,
    feedbackEmail({
      fullName: student.full_name,
      title: task.title,
      verdict: task.verdict!,
      feedback: task.feedback,
      url: `${origin}/student/tasks/${task.id}`,
    })
  )
}
