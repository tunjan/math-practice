import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Avatar, Page, PageHeader } from "@/components/brand/primitives"
import { CourseCard } from "@/components/syllabus/course-card"
import { SyllabusTracker } from "@/components/syllabus/syllabus-tracker"
import { requireRole } from "@/lib/auth/session"
import { dayKeyOf } from "@/lib/calendar/dates"
import { createClient } from "@/lib/supabase/server"
import { loadTracker } from "@/lib/syllabus/load"
import { courseShortName, studentCourse } from "@/lib/syllabus/model"

export const metadata: Metadata = { title: "Student · Maths Tasks" }
export const dynamic = "force-dynamic"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function StudentDetailPage({ params }: PageProps<"/tutor/students/[id]">) {
  const tutor = await requireRole("tutor")
  const { id } = await params
  if (!UUID.test(id)) notFound()

  const supabase = await createClient()
  const { data: student } = await supabase
    .from("profiles")
    .select("id, full_name, email, programme, course, level")
    .eq("id", id)
    .eq("role", "student")
    .maybeSingle()
  if (!student) notFound()

  const name = student.full_name || "Unnamed student"
  const course = studentCourse(student)
  const rows = course ? await loadTracker(supabase, student.id, course) : []

  return (
    <Page width="wide" className="dub">
      <PageHeader
        back={{ href: "/tutor/students", label: "Students" }}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={name} />
            {name}
          </span>
        }
        description={course ? `${courseShortName(course)} · ${student.email ?? ""}` : (student.email ?? undefined)}
      />

      {course ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-on-surface">Syllabus</h2>
          <SyllabusTracker
            studentId={student.id}
            rows={rows}
            editable
            today={dayKeyOf(new Date(), tutor.timezone)}
          />
        </section>
      ) : null}

      <CourseCard studentId={student.id} current={course} />
    </Page>
  )
}
