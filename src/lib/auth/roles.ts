import type { Database } from "@/lib/supabase/database.types"

export type UserRole = Database["public"]["Enums"]["user_role"]

/** Where each role lands after signing in. */
export function homePathForRole(role: UserRole): string {
  return role === "tutor" ? "/tutor" : "/student"
}

/** Routes reachable without a session. Everything else requires one. */
export const PUBLIC_PREFIXES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/invite",
  "/auth",
  "/styleguide",
  "/health",
] as const

export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}
