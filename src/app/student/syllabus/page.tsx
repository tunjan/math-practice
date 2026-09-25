import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Page, PageHeader } from "@/components/brand/primitives"
import { SyllabusTracker } from "@/components/syllabus/syllabus-tracker"
import { requireRole } from "@/lib/auth/session"
import { dayKeyOf } from "@/lib/calendar/dates"
import { createClient } from "@/lib/supabase/server"
import { loadTracker } from "@/lib/syllabus/load"
import { courseShortName } from "@/lib/syllabus/model"

export const metadata: Metadata = { title: "Syllabus · Maths Tasks" }
export const dynamic = "force-dynamic"

/** The student's own tracker: the tutor's grid, read-only. */
export default async function StudentSyllabusPage() {
  const profile = await requireRole("student")
  if (!profile.course) notFound()

  const supabase = await createClient()
  const rows = await loadTracker(supabase, profile.id, profile.course)

  return (
    <Page width="wide">
      <PageHeader
        title="Syllabus"
        description={`${courseShortName(profile.course)} · every subtopic, where you are with it and when it's planned. Your tutor keeps this up to date.`}
      />
      <SyllabusTracker
        studentId={profile.id}
        rows={rows}
        editable={false}
        today={dayKeyOf(new Date(), profile.timezone)}
      />
    </Page>
  )
}
