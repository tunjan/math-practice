import "server-only"

import { headers } from "next/headers"

import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Fixed-window rate limiting backed by a Postgres table, so the budget is
 * shared across every server instance rather than living in one process's
 * memory. See private.consume_rate_limit().
 */

export type RateLimitRule = {
  /** How many attempts are allowed inside the window. */
  limit: number
  /** Window length in seconds. */
  windowSecs: number
}

export const LOGIN_PER_EMAIL: RateLimitRule = { limit: 8, windowSecs: 900 }
export const LOGIN_PER_IP: RateLimitRule = { limit: 30, windowSecs: 900 }
export const PASSWORD_RESET_PER_EMAIL: RateLimitRule = { limit: 4, windowSecs: 3600 }
export const INVITE_REDEEM_PER_IP: RateLimitRule = { limit: 10, windowSecs: 3600 }

export type RateLimitResult = {
  allowed: boolean
  /** True when the limiter could not run and the request was let through. */
  degraded: boolean
}

/**
 * Best-effort client address. Behind Vercel this is x-forwarded-for; locally it
 * is usually absent, which is fine — the per-email budget still applies.
 */
export async function clientAddress(): Promise<string> {
  const h = await headers()
  const forwarded = h.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]!.trim()
  return h.get("x-real-ip") ?? "unknown"
}

export async function consume(
  key: string,
  rule: RateLimitRule
): Promise<RateLimitResult> {
  // Without the service-role key the limiter cannot run at all. In production
  // that fails closed: an auth endpoint silently running unprotected is worse
  // than one that is briefly unavailable and obvious. In development it warns
  // and lets the request through so the app is still usable before the key is
  // pasted in.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    if (process.env.NODE_ENV === "production") {
      return { allowed: false, degraded: true }
    }
    console.warn(
      `[rate-limit] SUPABASE_SERVICE_ROLE_KEY is not set — "${key}" was not rate limited.`
    )
    return { allowed: true, degraded: true }
  }

  try {
    const admin = createAdminClient()
    // A thin public wrapper around private.consume_rate_limit, executable by
    // the service role only — see migration 0007.
    const { data, error } = await admin.rpc("consume_rate_limit", {
      p_key: key,
      p_limit: rule.limit,
      p_window_secs: rule.windowSecs,
    })

    if (error) {
      // A limiter that errors must not become an open door.
      console.error("[rate-limit] failed:", error.message)
      return { allowed: false, degraded: true }
    }

    return { allowed: data === true, degraded: false }
  } catch (error) {
    console.error("[rate-limit] threw:", error)
    return { allowed: false, degraded: true }
  }
}

/** Normalises an email so casing and spacing cannot be used to get extra tries. */
export function emailKey(prefix: string, email: string): string {
  return `${prefix}:${email.trim().toLowerCase()}`
}
