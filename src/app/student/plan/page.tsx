import type { Metadata } from "next"

import { StudentPlan } from "@/components/plans/student-plan"
import { requireRole } from "@/lib/auth/session"
import { dayKeyOf } from "@/lib/calendar/dates"
import { loadPlan } from "@/lib/plans/load"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Plan · Maths Tasks" }
export const dynamic = "force-dynamic"

export default async function StudentPlanPage() {
  const profile = await requireRole("student")
  const supabase = await createClient()

  const today = dayKeyOf(new Date(), profile.timezone)
  const loaded = await loadPlan(supabase, profile.id, today)

  if (!loaded) {
    return (
      <div className="flex flex-1 flex-col bg-surface">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pt-10 sm:px-8 sm:pt-14">
          <h1 className="font-display text-3xl leading-[1.2] font-medium text-on-surface sm:text-4xl">
            Your plan
          </h1>
          <p className="text-base text-on-surface-muted sm:text-lg">
            Your tutor hasn&apos;t set one up yet.
          </p>
        </div>
      </div>
    )
  }

  return <StudentPlan plan={loaded.plan} studyDays={loaded.studyDays} today={today} />
}
