"use server"

import { revalidatePath } from "next/cache"

import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
import {
  isAllowedMaterial,
  MAX_FILE_BYTES,
  SUBMISSIONS_BUCKET,
  type UploadedFile,
} from "@/lib/assignments/files"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Records the first time a student opened a task.
 *
 * Fire-and-forget from the client on mount. The database refuses to overwrite
 * an existing receipt (see guard_assignment_update), so repeat views are
 * harmless and the first timestamp is the true one — a student cannot make it
 * look like they opened the work earlier than they did.
 */
export async function recordOpen(assignmentId: string): Promise<void> {
  if (!UUID.test(assignmentId)) return

  const profile = await requireRole("student")
  const supabase = await createClient()

  await supabase
    .from("assignments")
    .update({ student_opened_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .eq("student_id", profile.id)
    .is("student_opened_at", null)

  revalidatePath(`/student/tasks/${assignmentId}`)
}

export type ProgressState = { error?: string; notice?: string }

export async function setCompletion(
  _prev: ProgressState,
  formData: FormData
): Promise<ProgressState> {
  const profile = await requireRole("student")

  const assignmentId = String(formData.get("assignment_id") ?? "")
  const pct = Number(formData.get("completion_pct") ?? Number.NaN)

  if (!UUID.test(assignmentId)) return { error: "Unknown task." }
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
    return { error: "Progress must be between 0 and 100." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("assignments")
    .update({ completion_pct: Math.round(pct) })
    .eq("id", assignmentId)
    .eq("student_id", profile.id)

  if (error) return { error: error.message }

  revalidatePath("/student")
  revalidatePath(`/student/tasks/${assignmentId}`)
  return { notice: "Progress saved." }
}

export type SubmitState = { error?: string; notice?: string }

/**
 * Attaches uploaded work and marks the task submitted.
 *
 * Revisions stack rather than replace: a returned piece of work and its redo
 * are both part of the record, and a tutor comparing them is a normal thing to
 * want. Re-submitting also clears the previous verdict, because the thing that
 * was judged has changed.
 */
export async function submitWork(
  _prev: SubmitState,
  formData: FormData
): Promise<SubmitState> {
  const profile = await requireRole("student")

  const assignmentId = String(formData.get("assignment_id") ?? "")
  if (!UUID.test(assignmentId)) return { error: "Unknown task." }

  const files = parseSubmissionFiles(
    String(formData.get("files") ?? ""),
    assignmentId,
    profile.id
  )
  if (files.length === 0) {
    return { error: "Attach at least one file before submitting." }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("submissions")
    .select("revision")
    .eq("assignment_id", assignmentId)
    .order("revision", { ascending: false })
    .limit(1)

  const revision = (existing?.[0]?.revision ?? 0) + 1

  const { error: insertError } = await supabase.from("submissions").insert(
    files.map((file) => ({
      assignment_id: assignmentId,
      student_id: profile.id,
      revision,
      storage_path: file.storagePath,
      file_name: file.fileName,
      mime_type: file.mimeType,
      size_bytes: file.sizeBytes,
    }))
  )
  if (insertError) return { error: insertError.message }

  // Only submitted_at is written here. A student may not touch `verdict` or
  // `reviewed_at`, so the database clears a superseded verdict itself — see
  // migration 0009.
  const { error: updateError } = await supabase
    .from("assignments")
    .update({ submitted_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .eq("student_id", profile.id)

  if (updateError) return { error: updateError.message }

  revalidatePath("/student")
  revalidatePath(`/student/tasks/${assignmentId}`)
  revalidatePath("/tutor/assignments")
  revalidatePath(`/tutor/assignments/${assignmentId}`)

  return { notice: `Submitted — revision ${revision}.` }
}

/** Client-supplied metadata, so every field is re-checked here. */
function parseSubmissionFiles(
  raw: string,
  assignmentId: string,
  studentId: string
): UploadedFile[] {
  if (!raw) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  return parsed.flatMap((entry): UploadedFile[] => {
    if (typeof entry !== "object" || entry === null) return []
    const file = entry as Partial<UploadedFile>

    if (typeof file.storagePath !== "string") return []
    // Must live under this assignment AND this student — the same shape the
    // storage policy enforces.
    if (!file.storagePath.startsWith(`${assignmentId}/${studentId}/`)) return []
    if (typeof file.mimeType !== "string" || !isAllowedMaterial(file.mimeType)) {
      return []
    }
    const size = typeof file.sizeBytes === "number" ? file.sizeBytes : 0
    if (size < 0 || size > MAX_FILE_BYTES) return []

    return [
      {
        storagePath: file.storagePath,
        fileName: String(file.fileName ?? "").slice(0, 200),
        mimeType: file.mimeType,
        sizeBytes: size,
      },
    ]
  })
}

export async function withdrawSubmission(
  _prev: SubmitState,
  formData: FormData
): Promise<SubmitState> {
  const profile = await requireRole("student")

  const submissionId = String(formData.get("submission_id") ?? "")
  const assignmentId = String(formData.get("assignment_id") ?? "")
  if (!UUID.test(submissionId) || !UUID.test(assignmentId)) {
    return { error: "Unknown file." }
  }

  const supabase = await createClient()

  const { data: submission } = await supabase
    .from("submissions")
    .select("storage_path")
    .eq("id", submissionId)
    .eq("student_id", profile.id)
    .maybeSingle()

  if (!submission) return { error: "That file is no longer there." }

  await supabase.storage
    .from(SUBMISSIONS_BUCKET)
    .remove([submission.storage_path])

  // The policy already refuses this once the work has been reviewed.
  const { error } = await supabase
    .from("submissions")
    .delete()
    .eq("id", submissionId)

  if (error) {
    return { error: "You can't withdraw work after it's been reviewed." }
  }

  // If that was the last file, the task is no longer submitted.
  const { count } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("assignment_id", assignmentId)

  if ((count ?? 0) === 0) {
    await supabase
      .from("assignments")
      .update({ submitted_at: null })
      .eq("id", assignmentId)
      .eq("student_id", profile.id)
  }

  revalidatePath(`/student/tasks/${assignmentId}`)
  revalidatePath("/student")
  return { notice: "Withdrawn." }
}
