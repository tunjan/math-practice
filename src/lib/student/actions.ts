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

  // The board behind the dialog drops its "New" flag.
  revalidatePath("/student")
  revalidatePath(`/student/tasks/${assignmentId}`)
}

export type SubmitState = { error?: string; notice?: string }

/**
 * Hands in the draft: any files already saved as drafts (from an unsubmit)
 * plus the ones just uploaded, all as one revision.
 *
 * New rows go in as drafts and the hand-in itself is only `submitted_at`. The
 * database stamps the drafts as handed in and clears a superseded verdict
 * (see migrations 0009 and 0010), because a student may not write either.
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

  const supabase = await createClient()

  const [{ data: assignment }, { data: existing }] = await Promise.all([
    supabase
      .from("assignments")
      .select("submitted_at, reviewed_at, due_at")
      .eq("id", assignmentId)
      .eq("student_id", profile.id)
      .maybeSingle(),
    supabase
      .from("submissions")
      .select("revision, handed_in_at")
      .eq("assignment_id", assignmentId)
      .order("revision", { ascending: false }),
  ])

  if (!assignment) return { error: "Unknown task." }
  if (assignment.submitted_at && !assignment.reviewed_at) {
    return {
      error: "This is already handed in. Unsubmit it first to make changes.",
    }
  }

  const drafts = (existing ?? []).filter((row) => row.handed_in_at === null)
  if (files.length === 0 && drafts.length === 0) {
    return { error: "Attach at least one file before handing in." }
  }

  // Drafts already belong to a revision; otherwise this starts the next one.
  const revision = drafts[0]?.revision ?? (existing?.[0]?.revision ?? 0) + 1

  if (files.length > 0) {
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
  }

  const { error: updateError } = await supabase
    .from("assignments")
    .update({ submitted_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .eq("student_id", profile.id)

  if (updateError) return { error: updateError.message }

  revalidateTask(assignmentId)

  // The banner warned before the click; the receipt confirms it after, so
  // the late mark is never a surprise.
  const late = new Date(assignment.due_at).getTime() < Date.now()
  return {
    notice: late
      ? `Handed in revision ${revision} — marked as late.`
      : `Handed in revision ${revision}.`,
  }
}

/**
 * Takes back a hand-in the tutor has not reviewed yet. Its files come back as
 * drafts, and if it was a resubmission, the tutor's earlier feedback stands
 * again (migration 0010 does both).
 *
 * `reviewed_at is null` sits in the WHERE clause rather than in a read before
 * it, so a review landing a moment earlier wins the race cleanly.
 */
export async function unsubmitWork(
  _prev: SubmitState,
  formData: FormData
): Promise<SubmitState> {
  const profile = await requireRole("student")

  const assignmentId = String(formData.get("assignment_id") ?? "")
  if (!UUID.test(assignmentId)) return { error: "Unknown task." }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("assignments")
    .update({ submitted_at: null })
    .eq("id", assignmentId)
    .eq("student_id", profile.id)
    .not("submitted_at", "is", null)
    .is("reviewed_at", null)
    .select("id")

  if (error) return { error: error.message }
  if (!data || data.length === 0) {
    return {
      error: "Your tutor has already reviewed this, so it can't be taken back.",
    }
  }

  revalidateTask(assignmentId)
  return { notice: "Unsubmitted. Your files are back as a draft." }
}

function revalidateTask(assignmentId: string) {
  revalidatePath("/student")
  revalidatePath(`/student/tasks/${assignmentId}`)
  revalidatePath("/tutor")
  revalidatePath("/tutor/assignments")
  revalidatePath(`/tutor/assignments/${assignmentId}`)
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

/**
 * Removes one draft file. Handed-in files cannot be removed: the policies on
 * the table and the bucket both refuse (migration 0010). The object goes
 * first, while the row that makes it deletable still says "draft".
 */
export async function removeDraftFile(
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

  const { data: draft } = await supabase
    .from("submissions")
    .select("storage_path")
    .eq("id", submissionId)
    .eq("student_id", profile.id)
    .is("handed_in_at", null)
    .maybeSingle()

  if (!draft) return { error: "That file is handed in or no longer there." }

  await supabase.storage.from(SUBMISSIONS_BUCKET).remove([draft.storage_path])

  const { error } = await supabase
    .from("submissions")
    .delete()
    .eq("id", submissionId)
    .is("handed_in_at", null)

  if (error) return { error: error.message }

  revalidatePath(`/student/tasks/${assignmentId}`)
  revalidatePath("/student")
  return { notice: "Removed." }
}
