import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { TaskComment } from "@/lib/assignments/comment-model"
import type { Database } from "@/lib/supabase/database.types"

type Supabase = SupabaseClient<Database>

/** A task and the one student it was set for, with their name if known. */
type TaskRef = { id: string; studentId: string; studentName?: string }

/**
 * The comments on these tasks, oldest first, grouped by task. Deleted ones are
 * left out. Authors are told apart by id rather than by a profile join: a
 * student may not read the tutor's profile, and a task only has two people.
 */
export async function loadComments(
  supabase: Supabase,
  tasks: TaskRef[],
  viewerId: string
): Promise<Map<string, TaskComment[]>> {
  const byTask = new Map<string, TaskComment[]>()
  if (tasks.length === 0) return byTask
  const taskById = new Map(tasks.map((task) => [task.id, task]))

  const { data } = await supabase
    .from("comments")
    .select("id, assignment_id, author_id, body, created_at")
    .in("assignment_id", tasks.map((task) => task.id))
    .is("deleted_at", null)
    .order("created_at", { ascending: true })

  for (const row of data ?? []) {
    const task = taskById.get(row.assignment_id)
    const byStudent = row.author_id === task?.studentId
    const mine = row.author_id === viewerId
    const comment: TaskComment = {
      id: row.id,
      body: row.body,
      at: row.created_at,
      mine,
      author: byStudent ? "student" : "tutor",
      name: mine ? "You" : byStudent ? (task?.studentName ?? "Student") : "Tutor",
    }
    const list = byTask.get(row.assignment_id)
    if (list) list.push(comment)
    else byTask.set(row.assignment_id, [comment])
  }

  return byTask
}
