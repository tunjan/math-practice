import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Page, PageHeader } from "@/components/brand/primitives"
import {
  EditAssignmentForm,
  type Topic,
} from "@/components/assignments/edit-assignment-form"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
import { MATERIALS_BUCKET } from "@/lib/assignments/files"
import { signFiles } from "@/lib/assignments/signing"

export const metadata: Metadata = { title: "Edit task · Maths Tasks" }
export const dynamic = "force-dynamic"

export default async function EditAssignmentPage({
  params,
}: PageProps<"/tutor/assignments/[id]/edit">) {
  await requireRole("tutor")
  const { id } = await params
  const supabase = await createClient()

  const [{ data: assignment }, { data: categories }, { data: fileRows }] = await Promise.all([
    supabase
      .from("assignments")
      .select("id, title, description, type, due_at, category_id, plan_unit_id, student_id")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id, name").order("name"),
    supabase
      .from("assignment_files")
      .select("id, file_name, mime_type, size_bytes, storage_path")
      .eq("assignment_id", id)
      .order("sort_order"),
  ])

  if (!assignment) notFound()

  const { data: unitRows } = await supabase
    .from("plan_units")
    .select("id, title, learning_plans!inner(student_id)")
    .eq("learning_plans.student_id", assignment.student_id)
    .order("position")
  const units = (unitRows ?? []).map((u) => ({ id: u.id, title: u.title }))

  const existingFiles = await signFiles(supabase, MATERIALS_BUCKET, fileRows ?? [])
  const topics: Topic[] = (categories ?? []).map((c) => ({ id: c.id, name: c.name }))

  return (
    <Page width="narrow">
      <PageHeader
        back={{ href: `/tutor/assignments/${id}`, label: assignment.title }}
        title="Edit task"
      />
      <EditAssignmentForm
        assignmentId={id}
        initial={{
          title: assignment.title,
          description: assignment.description ?? "",
          type: assignment.type,
          dueAt: assignment.due_at,
          categoryId: assignment.category_id,
          planUnitId: assignment.plan_unit_id,
        }}
        existingFiles={existingFiles}
        topics={topics}
        units={units}
      />
    </Page>
  )
}
