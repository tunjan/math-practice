"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireRole } from "@/lib/auth/session"
import { asDifficulty } from "@/lib/aviary/difficulty"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"
import {
  isAllowedMaterial,
  MATERIALS_BUCKET,
  MAX_FILE_BYTES,
  SUBMISSIONS_BUCKET,
  type UploadedFile,
} from "./files"

type AssignmentType = Database["public"]["Enums"]["assignment_type"]

export type CreateAssignmentState = {
  error?: string
  /** Set once the task exists, so the dialog can close and confirm it. */
  created?: { id: string; title: string; queued: boolean }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Files are uploaded straight from the browser to Storage before this runs, so
 * what arrives here is metadata the client chose. Re-validate all of it: the
 * storage policies stop an outsider writing, but nothing stops a tutor's own
 * page from sending a malformed path or a mistyped size.
 */
function parseFiles(raw: string, assignmentId: string): UploadedFile[] {
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
    // Every object must sit under this assignment's own prefix, or a tutor
    // could attach another assignment's materials by path alone.
    if (!file.storagePath.startsWith(`${assignmentId}/`)) return []
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
 * The plan unit a task goes under, if it is one of this student's own. A unit
 * from someone else's plan is dropped rather than refused: it is only a label.
 */
async function resolvePlanUnit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  unitId: string,
  studentId: string
): Promise<string | null> {
  if (!UUID.test(unitId)) return null
  const { data } = await supabase
    .from("plan_units")
    .select("id, learning_plans!inner(student_id)")
    .eq("id", unitId)
    .eq("learning_plans.student_id", studentId)
    .maybeSingle()
  return data?.id ?? null
}

export async function createAssignment(
  _prev: CreateAssignmentState,
  formData: FormData
): Promise<CreateAssignmentState> {
  const tutor = await requireRole("tutor")
  const supabase = await createClient()

  const assignmentId = String(formData.get("assignment_id") ?? "")
  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const type = String(formData.get("type") ?? "problem_set") as AssignmentType
  const difficulty = asDifficulty(formData.get("difficulty") ?? "medium")
  const dueAtIso = String(formData.get("due_at") ?? "")
  const target = String(formData.get("target") ?? "")
  const categoryId = String(formData.get("category_id") ?? "")
  const newCategory = String(formData.get("new_category") ?? "").trim()

  if (!UUID.test(assignmentId)) return { error: "Something went wrong. Please reload and try again." }
  if (!title) return { error: "Give the task a title." }
  if (title.length > 200) return { error: "That title is too long." }
  if (type !== "problem_set" && type !== "reading_notes") {
    return { error: "Pick a task type." }
  }
  if (!difficulty) return { error: "Pick a difficulty." }

  const dueAt = new Date(dueAtIso)
  if (!dueAtIso || Number.isNaN(dueAt.getTime())) {
    return { error: "Pick a due date and time." }
  }

  // `student:<uuid>` for someone enrolled, `invite:<uuid>` for someone who has
  // been invited but has not signed up yet.
  const [targetKind, targetId] = target.split(":")
  if ((targetKind !== "student" && targetKind !== "invite") || !UUID.test(targetId ?? "")) {
    return { error: "Choose who this is for." }
  }

  // A brand-new topic is created on the fly so the tutor never has to leave the
  // form to add one.
  let resolvedCategoryId: string | null = UUID.test(categoryId) ? categoryId : null
  if (!resolvedCategoryId && newCategory) {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .insert({ name: newCategory, created_by: tutor.id })
      .select("id")
      .single()

    if (categoryError) {
      // Most likely the unique index on lower(trim(name)) — reuse the existing
      // topic rather than making the tutor rename theirs.
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", newCategory)
        .maybeSingle()
      resolvedCategoryId = existing?.id ?? null
    } else {
      resolvedCategoryId = category.id
    }
  }

  const files = parseFiles(String(formData.get("files") ?? ""), assignmentId)

  if (targetKind === "student") {
    const planUnitId = await resolvePlanUnit(supabase, String(formData.get("plan_unit_id") ?? ""), targetId!)
    const { error } = await supabase.from("assignments").insert({
      id: assignmentId,
      tutor_id: tutor.id,
      student_id: targetId!,
      type,
      difficulty,
      title,
      description: description || null,
      category_id: resolvedCategoryId,
      plan_unit_id: planUnitId,
      due_at: dueAt.toISOString(),
    })
    if (error) return { error: error.message }

    if (files.length > 0) {
      const { error: filesError } = await supabase
        .from("assignment_files")
        .insert(
          files.map((file, index) => ({
            assignment_id: assignmentId,
            storage_path: file.storagePath,
            file_name: file.fileName,
            mime_type: file.mimeType,
            size_bytes: file.sizeBytes,
            sort_order: index,
          }))
        )
      if (filesError) return { error: filesError.message }
    }
  } else {
    // Queued against an invite. The row carries the id the real assignment will
    // take, so the materials already uploaded stay exactly where they are when
    // the student redeems their link.
    const { error } = await supabase.from("pending_assignments").insert({
      id: assignmentId,
      invite_id: targetId!,
      tutor_id: tutor.id,
      type,
      difficulty,
      title,
      description: description || null,
      category_id: resolvedCategoryId,
      due_at: dueAt.toISOString(),
    })
    if (error) return { error: error.message }

    if (files.length > 0) {
      const { error: filesError } = await supabase
        .from("pending_assignment_files")
        .insert(
          files.map((file, index) => ({
            pending_assignment_id: assignmentId,
            storage_path: file.storagePath,
            file_name: file.fileName,
            mime_type: file.mimeType,
            size_bytes: file.sizeBytes,
            sort_order: index,
          }))
        )
      if (filesError) return { error: filesError.message }
    }
  }

  revalidatePath("/tutor")
  revalidatePath("/tutor/assignments")
  revalidatePath("/tutor/students")
  // No redirect: creation happens in a dialog over whichever list the tutor was
  // on, and the revalidation above refreshes that list underneath it.
  return { created: { id: assignmentId, title, queued: targetKind === "invite" } }
}

// ── Review workflow ─────────────────────────────────────────────────────────

export type ReviewState = { error?: string; notice?: string }

/** Matches assignments_feedback_length in 0014_review_feedback.sql. */
const MAX_FEEDBACK_LENGTH = 5000

/**
 * Records the tutor's verdict. Deliberately separate from the student's
 * self-reported completion_pct: one is an evaluation, the other is a progress
 * note, and the database keeps them in different columns for that reason.
 */
export async function setVerdict(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  await requireRole("tutor")

  const assignmentId = String(formData.get("assignment_id") ?? "")
  const verdict = String(formData.get("verdict") ?? "")
  const feedback = String(formData.get("feedback") ?? "").trim()

  if (!UUID.test(assignmentId)) return { error: "Unknown task." }
  if (verdict !== "approved" && verdict !== "changes_requested") {
    return { error: "Pick a verdict." }
  }
  if (verdict === "changes_requested" && !feedback) {
    return { error: "Say what needs changing, so the student knows what to revise." }
  }
  if (feedback.length > MAX_FEEDBACK_LENGTH) {
    return { error: `Keep feedback under ${MAX_FEEDBACK_LENGTH} characters.` }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("assignments")
    .update({
      verdict,
      feedback: feedback || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", assignmentId)

  if (error) return { error: error.message }

  revalidatePath("/student")
  revalidatePath("/tutor")
  revalidatePath("/tutor/assignments")
  revalidatePath(`/tutor/assignments/${assignmentId}`)
  return { notice: verdict === "approved" ? "Approved." : "Returned for revision." }
}

/** Undo a verdict — the check constraint keeps the pair in step. */
export async function clearVerdict(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  await requireRole("tutor")
  const assignmentId = String(formData.get("assignment_id") ?? "")
  if (!UUID.test(assignmentId)) return { error: "Unknown task." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("assignments")
    .update({ verdict: null, reviewed_at: null, feedback: null })
    .eq("id", assignmentId)

  if (error) return { error: error.message }

  revalidatePath("/student")
  revalidatePath("/tutor/assignments")
  revalidatePath(`/tutor/assignments/${assignmentId}`)
  return { notice: "Review withdrawn." }
}

export type DeleteState = { error?: string; notice?: string }

/**
 * Bulk delete. Storage objects are removed first: if the rows went first, the
 * paths needed to find the objects would be gone and the files would be
 * orphaned in the bucket forever.
 */
export async function deleteAssignments(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  await requireRole("tutor")

  const ids = formData
    .getAll("assignment_ids")
    .map(String)
    .filter((id) => UUID.test(id))

  if (ids.length === 0) return { error: "Nothing selected." }

  const supabase = await createClient()

  const [{ data: materials }, { data: submissions }] = await Promise.all([
    supabase
      .from("assignment_files")
      .select("storage_path")
      .in("assignment_id", ids),
    supabase.from("submissions").select("storage_path").in("assignment_id", ids),
  ])

  if (materials && materials.length > 0) {
    await supabase.storage
      .from(MATERIALS_BUCKET)
      .remove(materials.map((file) => file.storage_path))
  }
  if (submissions && submissions.length > 0) {
    await supabase.storage
      .from(SUBMISSIONS_BUCKET)
      .remove(submissions.map((file) => file.storage_path))
  }

  // assignment_files, submissions and comments all cascade from here.
  const { error } = await supabase.from("assignments").delete().in("id", ids)
  if (error) return { error: error.message }

  revalidatePath("/tutor")
  revalidatePath("/tutor/assignments")
  return {
    notice: `Deleted ${ids.length} task${ids.length === 1 ? "" : "s"}.`,
  }
}

export type UpdateAssignmentState = { error?: string; notice?: string }

export async function updateAssignment(
  _prev: UpdateAssignmentState,
  formData: FormData
): Promise<UpdateAssignmentState> {
  const tutor = await requireRole("tutor")
  const supabase = await createClient()

  const assignmentId = String(formData.get("assignment_id") ?? "")
  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const type = String(formData.get("type") ?? "") as AssignmentType
  const dueAtIso = String(formData.get("due_at") ?? "")
  const categoryId = String(formData.get("category_id") ?? "")
  const newCategory = String(formData.get("new_category") ?? "").trim()

  if (!UUID.test(assignmentId)) return { error: "Unknown task." }
  if (!title) return { error: "Give the task a title." }
  if (type !== "problem_set" && type !== "reading_notes") {
    return { error: "Pick a task type." }
  }
  const dueAt = new Date(dueAtIso)
  if (!dueAtIso || Number.isNaN(dueAt.getTime())) {
    return { error: "Pick a due date and time." }
  }

  let resolvedCategoryId: string | null = UUID.test(categoryId) ? categoryId : null
  if (!resolvedCategoryId && newCategory) {
    const { data: category } = await supabase
      .from("categories")
      .insert({ name: newCategory, created_by: tutor.id })
      .select("id")
      .single()
    if (category) {
      resolvedCategoryId = category.id
    } else {
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", newCategory)
        .maybeSingle()
      resolvedCategoryId = existing?.id ?? null
    }
  }

  // Only forms that offer these fields may change them.
  let difficulty: { difficulty: NonNullable<ReturnType<typeof asDifficulty>> } | object = {}
  if (formData.has("difficulty")) {
    const parsed = asDifficulty(formData.get("difficulty"))
    if (!parsed) return { error: "Pick a difficulty." }
    difficulty = { difficulty: parsed }
  }

  let planUnit: { plan_unit_id: string | null } | object = {}
  if (formData.has("plan_unit_id")) {
    const { data: current } = await supabase
      .from("assignments")
      .select("student_id")
      .eq("id", assignmentId)
      .maybeSingle()
    planUnit = {
      plan_unit_id: current
        ? await resolvePlanUnit(supabase, String(formData.get("plan_unit_id") ?? ""), current.student_id)
        : null,
    }
  }

  const { error } = await supabase
    .from("assignments")
    .update({
      title,
      description: description || null,
      type,
      due_at: dueAt.toISOString(),
      category_id: resolvedCategoryId,
      ...difficulty,
      ...planUnit,
    })
    .eq("id", assignmentId)

  if (error) return { error: error.message }

  // Newly attached materials, uploaded by the browser before this ran.
  const files = parseFiles(String(formData.get("files") ?? ""), assignmentId)
  if (files.length > 0) {
    const { count } = await supabase
      .from("assignment_files")
      .select("id", { count: "exact", head: true })
      .eq("assignment_id", assignmentId)

    await supabase.from("assignment_files").insert(
      files.map((file, index) => ({
        assignment_id: assignmentId,
        storage_path: file.storagePath,
        file_name: file.fileName,
        mime_type: file.mimeType,
        size_bytes: file.sizeBytes,
        sort_order: (count ?? 0) + index,
      }))
    )
  }

  revalidatePath("/tutor/assignments")
  revalidatePath(`/tutor/assignments/${assignmentId}`)
  redirect(`/tutor/assignments/${assignmentId}`)
}

export async function removeAssignmentFile(
  _prev: UpdateAssignmentState,
  formData: FormData
): Promise<UpdateAssignmentState> {
  await requireRole("tutor")

  const fileId = String(formData.get("file_id") ?? "")
  const assignmentId = String(formData.get("assignment_id") ?? "")
  if (!UUID.test(fileId) || !UUID.test(assignmentId)) {
    return { error: "Unknown file." }
  }

  const supabase = await createClient()
  const { data: file } = await supabase
    .from("assignment_files")
    .select("storage_path")
    .eq("id", fileId)
    .maybeSingle()

  if (file) {
    await supabase.storage.from(MATERIALS_BUCKET).remove([file.storage_path])
  }

  const { error } = await supabase
    .from("assignment_files")
    .delete()
    .eq("id", fileId)

  if (error) return { error: error.message }

  revalidatePath(`/tutor/assignments/${assignmentId}`)
  return { notice: "Attachment removed." }
}
