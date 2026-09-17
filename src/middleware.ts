import { NextResponse, type NextRequest } from "next/server"

import { createMiddlewareClient } from "@/lib/supabase/middleware"
import { homePathForRole, isPublicPath, type UserRole } from "@/lib/auth/roles"

/**
 * Runs on every page request to refresh the auth session and keep each role
 * inside its own workspace.
 *
 * This is a convenience layer, not the security boundary — RLS is. A bug here
 * shows someone the wrong shell; it does not show them another student's work.
 */
export async function middleware(request: NextRequest) {
  const { supabase, getResponse } = createMiddlewareClient(request)

  // getUser() revalidates the token with Supabase. getSession() only decodes
  // the cookie, which a client could have tampered with.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.search = ""
    // Carry the refreshed cookies onto the redirect, or the session that was
    // just renewed is thrown away.
    const redirect = NextResponse.redirect(url)
    for (const cookie of getResponse().cookies.getAll()) {
      redirect.cookies.set(cookie)
    }
    return redirect
  }

  if (!user) {
    if (isPublicPath(pathname)) return getResponse()
    return redirectTo("/login")
  }

  // Signed in: resolve the role once, then keep them in the right workspace.
  const needsRole =
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/tutor") ||
    pathname.startsWith("/student")

  if (!needsRole) return getResponse()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const role: UserRole = profile?.role ?? "student"
  const home = homePathForRole(role)

  // Landing and login are pointless once you are signed in.
  if (pathname === "/" || pathname === "/login") return redirectTo(home)

  const inWrongWorkspace =
    (pathname.startsWith("/tutor") && role !== "tutor") ||
    (pathname.startsWith("/student") && role !== "student")

  if (inWrongWorkspace) return redirectTo(home)

  return getResponse()
}

export const config = {
  matcher: [
    // Everything except Next internals and static assets. Keeping images and
    // fonts out matters: an auth round trip per asset would be slow and
    // pointless.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ico)$).*)",
  ],
}
