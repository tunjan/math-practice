import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import type { Database } from "./database.types"
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env"
import { PERSIST_COOKIE, shouldPersist, withPersistence } from "./cookies"

/**
 * Request-scoped client that reads the session from cookies and refreshes it
 * when needed. Always create a fresh one per request — never hoist it to a
 * module-level singleton, or one visitor's session leaks into another's.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    SUPABASE_URL(),
    SUPABASE_PUBLISHABLE_KEY(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // Read the preference here rather than at client construction: during
          // sign-in the flag is written moments before Supabase sets its auth
          // cookies, and this is the point where it has to be current.
          const persist = shouldPersist(cookieStore.get(PERSIST_COOKIE)?.value)

          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, withPersistence(options, persist))
            }
          } catch {
            // Server Components cannot set cookies. The middleware refreshes
            // the session on every request, so it is safe to swallow this.
          }
        },
      },
    }
  )
}
