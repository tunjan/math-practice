import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Map as MapIcon, Plus } from "lucide-react"

import { Avatar, EmptyState, Page, PageHeader } from "@/components/brand/primitives"
import { PlanDialog } from "@/components/plans/plan-dialog"
import { TutorPlan } from "@/components/plans/tutor-plan"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { requireRole } from "@/lib/auth/session"
import { addDays, dayKeyOf } from "@/lib/calendar/dates"
import { loadPlan } from "@/lib/plans/load"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Student · Maths Tasks" }
export const dynamic = "force-dynamic"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function StudentDetailPage({ params }: PageProps<"/tutor/students/[id]">) {
  await requireRole("tutor")
  const { id } = await params
  if (!UUID.test(id)) notFound()

  const supabase = await createClient()
  const { data: student } = await supabase
    .from("profiles")
    .select("id, full_name, email, timezone")
    .eq("id", id)
    .eq("role", "student")
    .maybeSingle()
  if (!student) notFound()

  // Study days are dated by the student's clock, so the week is too.
  const today = dayKeyOf(new Date(), student.timezone)
  const [loaded, { data: categories }] = await Promise.all([
    loadPlan(supabase, student.id, today),
    supabase.from("categories").select("id, name").order("name"),
  ])
  const topics = (categories ?? []).map((c) => ({ id: c.id, name: c.name }))
  const name = student.full_name || "Unnamed student"

  return (
    <Page>
      <PageHeader
        back={{ href: "/tutor/students", label: "Students" }}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={name} />
            {name}
          </span>
        }
        description={student.email ?? undefined}
      />

      {loaded ? (
        <TutorPlan plan={loaded.plan} studyDays={loaded.studyDays} topics={topics} today={today} />
      ) : (
        <Card>
          <EmptyState
            icon={<MapIcon />}
            title="No learning plan yet"
            description="Lay out what they're working towards: units with dates and objectives, and a weekly study goal."
            action={
              <PlanDialog
                studentId={student.id}
                plan={{
                  title: "",
                  goal: null,
                  startsOn: today,
                  endsOn: addDays(today, 7 * 12),
                  weeklyGoalDays: 3,
                }}
                trigger={
                  <Button variant="primary">
                    <Plus aria-hidden />
                    Create plan
                  </Button>
                }
              />
            }
          />
        </Card>
      )}
    </Page>
  )
}
