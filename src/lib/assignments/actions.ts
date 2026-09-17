"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"
import { isAllowedMaterial, MAX_FILE_BYTES, type UploadedFile } from "./files"

type AssignmentType = Database["public"]["Enums"]["assignment_type"]

export type CreateAssignmentState = { error?: string }

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
  const dueAtIso = String(formData.get("due_at") ?? "")
  const target = String(formData.get("target") ?? "")
  const categoryId = String(formData.get("category_id") ?? "")
  const newCategory = String(formData.get("new_category") ?? "").trim()

  if (!UUID.test(assignmentId)) return { error: "Something went wrong — reload and try again." }
  if (!title) return { error: "Give the task a title." }
  if (title.length > 200) return { error: "That title is too long." }
  if (type !== "problem_set" && type !== "reading_notes") {
    return { error: "Pick a task type." }
  }

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
    const { error } = await supabase.from("assignments").insert({
      id: assignmentId,
      tutor_id: tutor.id,
      student_id: targetId!,
      type,
      title,
      description: description || null,
      category_id: resolvedCategoryId,
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
  redirect("/tutor/assignments")
}
