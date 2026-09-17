"use client"

import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "./database.types"
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env"

/**
 * The browser client. Safe to call repeatedly — @supabase/ssr memoises the
 * underlying instance, so components can reach for it without threading one
 * through context.
 */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL(), SUPABASE_PUBLISHABLE_KEY())
}
