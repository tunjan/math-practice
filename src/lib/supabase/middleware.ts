import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import type { Database } from "./database.types"
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env"
import { PERSIST_COOKIE, shouldPersist, withPersistence } from "./cookies"

/**
 * Refreshes the auth session on every matched request and hands back both the
 * response carrying any rotated cookies and a client for the caller to use.
 *
 * The response object must be the one that is ultimately returned — building a
 * fresh NextResponse afterwards drops the refreshed tokens and signs the user
 * out at random intervals.
 */
export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request })

  const persist = shouldPersist(request.cookies.get(PERSIST_COOKIE)?.value)

  const supabase = createServerClient<Database>(
    SUPABASE_URL(),
    SUPABASE_PUBLISHABLE_KEY(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, withPersistence(options, persist))
          }
        },
      },
    }
  )

  return { supabase, getResponse: () => response }
}
