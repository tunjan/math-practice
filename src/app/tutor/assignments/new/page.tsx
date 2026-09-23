import { redirect } from "next/navigation"

import { requireRole } from "@/lib/auth/session"

/**
 * Task creation is a dialog over the assignments list now. Old links and
 * bookmarks land there with it already open.
 */
export default async function NewAssignmentPage() {
  await requireRole("tutor")
  redirect("/tutor/assignments?new")
}
