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
import { loadSyllabus } from "@/lib/syllabus/load"
import { studentCourse, topicsForCourse } from "@/lib/syllabus/model"

export const metadata: Metadata = { title: "Edit task · Maths Tasks" }
export const dynamic = "force-dynamic"

export default async function EditAssignmentPage({
  params,
}: PageProps<"/tutor/assignments/[id]/edit">) {
  await requireRole("tutor")
  const { id } = await params
  const supabase = await createClient()

  const [{ data: assignment }, { data: categories }, { data: fileRows }, syllabus] = await Promise.all([
    supabase
      .from("assignments")
      .select(
        `id, title, description, type, difficulty, due_at, category_id,
         assignment_topics(topic_id),
         profiles!assignments_student_id_fkey(programme, course, level)`
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id, name").order("name"),
    supabase
      .from("assignment_files")
      .select("id, file_name, mime_type, size_bytes, storage_path")
      .eq("assignment_id", id)
      .order("sort_order"),
    loadSyllabus(supabase),
  ])

  if (!assignment) notFound()

  const existingFiles = await signFiles(supabase, MATERIALS_BUCKET, fileRows ?? [])
  const topics: Topic[] = (categories ?? []).map((c) => ({ id: c.id, name: c.name }))
  const course = assignment.profiles ? studentCourse(assignment.profiles) : null
  const courseTopics = course ? topicsForCourse(syllabus, course) : []

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
          difficulty: assignment.difficulty,
          dueAt: assignment.due_at,
          categoryId: assignment.category_id,
          syllabusTopicIds: assignment.assignment_topics.map((row) => row.topic_id),
        }}
        existingFiles={existingFiles}
        topics={topics}
        syllabus={courseTopics}
      />
    </Page>
  )
}
