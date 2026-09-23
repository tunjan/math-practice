import type { Metadata } from "next"

import { StudentHome } from "@/components/student/student-home"
import { requireRole } from "@/lib/auth/session"

export const metadata: Metadata = { title: "Tasks · Maths Tasks" }
export const dynamic = "force-dynamic"

export default async function StudentTasksPage() {
  const profile = await requireRole("student")
  return <StudentHome profile={profile} />
}
