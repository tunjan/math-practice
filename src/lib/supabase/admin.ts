import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import type { Database } from "./database.types"
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "./env"

/**
 * Service-role client. Bypasses RLS entirely.
 *
 * Only for the handful of operations that genuinely cannot be expressed as a
 * policy — creating a student account from an invite token, and reading the
 * rate-limit counter. Every use must do its own authorisation check first,
 * because the database will not do it for you here.
 *
 * `server-only` makes importing this from a client component a build error
 * rather than a leaked key.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    SUPABASE_URL(),
    SUPABASE_SERVICE_ROLE_KEY(),
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
