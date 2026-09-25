import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Page, PageHeader } from "@/components/brand/primitives"
import { ExamsSection } from "@/components/syllabus/exams-section"
import { SyllabusTracker } from "@/components/syllabus/syllabus-tracker"
import { requireRole } from "@/lib/auth/session"
import { dayKeyOf } from "@/lib/calendar/dates"
import { createClient } from "@/lib/supabase/server"
import { loadExams, loadTracker } from "@/lib/syllabus/load"
import { courseShortName } from "@/lib/syllabus/model"

export const metadata: Metadata = { title: "Syllabus · Maths Tasks" }
export const dynamic = "force-dynamic"

/** The student's own tracker: the tutor's grid, read-only. */
export default async function StudentSyllabusPage() {
  const profile = await requireRole("student")
  if (!profile.course) notFound()

  const supabase = await createClient()
  const [rows, exams] = await Promise.all([
    loadTracker(supabase, profile.id, profile.course),
    loadExams(supabase, profile.id),
  ])
  const today = dayKeyOf(new Date(), profile.timezone)

  return (
    <Page width="wide">
      <PageHeader
        title="Syllabus"
        description={`${courseShortName(profile.course)} · every subtopic, where you are with it and when it's planned. Your tutor keeps the tracker up to date; your exams are yours to add.`}
      />
      <SyllabusTracker
        studentId={profile.id}
        rows={rows}
        editable={false}
        today={today}
      />
      <ExamsSection studentId={profile.id} exams={exams} topics={rows} today={today} />
    </Page>
  )
}
