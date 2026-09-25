"use server"

import { revalidatePath } from "next/cache"

import { MAX_COMMENT_LENGTH } from "@/lib/assignments/comment-model"
import { requireProfile } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type CommentState = { error?: string }

/**
 * Adds a comment to a task, as whoever is signed in. Row-level security only
 * lets the task's own student and the tutor write here, so a foreign id fails
 * at the insert rather than needing a check first.
 */
export async function addComment(assignmentId: string, body: string): Promise<CommentState> {
  if (!UUID.test(assignmentId)) return { error: "Unknown task." }

  const text = body.trim()
  if (!text) return { error: "Write something first." }
  if (text.length > MAX_COMMENT_LENGTH) {
    return { error: `Keep it under ${MAX_COMMENT_LENGTH} characters.` }
  }

  const profile = await requireProfile()
  const supabase = await createClient()

  const { error } = await supabase
    .from("comments")
    .insert({ assignment_id: assignmentId, author_id: profile.id, body: text })

  if (error) return { error: "Couldn't post that comment. Try again." }

  revalidateComments(assignmentId)
  return {}
}

/**
 * Removes one of your own comments. A soft delete, so anything already
 * showing it can drop it rather than lose its place.
 */
export async function deleteComment(commentId: string, assignmentId: string): Promise<CommentState> {
  if (!UUID.test(commentId) || !UUID.test(assignmentId)) return { error: "Unknown comment." }

  const profile = await requireProfile()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("author_id", profile.id)
    .is("deleted_at", null)
    .select("id")

  if (error || !data || data.length === 0) return { error: "Couldn't delete that comment." }

  revalidateComments(assignmentId)
  return {}
}

function revalidateComments(assignmentId: string) {
  revalidatePath("/student")
  revalidatePath(`/student/tasks/${assignmentId}`)
  revalidatePath(`/tutor/assignments/${assignmentId}`)
}
