import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

/**
 * Landing point for emailed auth links (password recovery today, invites
 * later). Supabase sends a one-time `code`; exchanging it establishes the
 * session cookies before we hand the user on.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  // Only ever redirect within this app — an open redirect here would let a
  // crafted link bounce a freshly authenticated user to someone else's page.
  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/"

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=link_invalid`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=link_expired`)
  }

  return NextResponse.redirect(`${origin}${destination}`)
}
