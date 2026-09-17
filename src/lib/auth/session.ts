import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { homePathForRole, type UserRole } from "./roles"

export type SessionProfile = {
  id: string
  email: string | null
  fullName: string
  role: UserRole
  timezone: string
  calendarToken: string
}

/**
 * The signed-in profile, or a redirect to /login.
 *
 * Middleware already gates these routes, but a page must never *assume* that —
 * a matcher change or a direct RSC request would otherwise leave a page
 * rendering with no user. Ask again here; it is one cached round trip.
 */
export async function requireProfile(): Promise<SessionProfile> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, timezone, calendar_token")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    timezone: profile.timezone,
    calendarToken: profile.calendar_token,
  }
}

/** As above, but also insists on a particular role. */
export async function requireRole(role: UserRole): Promise<SessionProfile> {
  const profile = await requireProfile()
  if (profile.role !== role) redirect(homePathForRole(profile.role))
  return profile
}
