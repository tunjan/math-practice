import type { Metadata } from "next"

import { AviaryView } from "@/components/aviary/aviary-view"
import { requireRole } from "@/lib/auth/session"
import { loadAviary } from "@/lib/aviary/load"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Aviary · Maths Tasks" }
export const dynamic = "force-dynamic"

export default async function StudentAviaryPage() {
  const profile = await requireRole("student")
  const supabase = await createClient()
  const aviary = await loadAviary(supabase, profile.id)

  return <AviaryView aviary={aviary} timeZone={profile.timezone} />
}
