import type { CookieOptions } from "@supabase/ssr"

/**
 * "Keep me signed in" is implemented by changing the *lifetime* of the auth
 * cookies, not by storing a flag the app checks.
 *
 * @supabase/ssr always writes persistent cookies. When the user declines, we
 * strip `maxAge`/`expires` from every cookie it sets, turning them into session
 * cookies that the browser drops when it closes. The refresh token never
 * survives the session, so a shared or public machine does not keep the user
 * signed in.
 */
export const PERSIST_COOKIE = "mt-persist"

/** One year — long enough that "keep me signed in" means it. */
export const PERSIST_MAX_AGE = 60 * 60 * 24 * 365

export function shouldPersist(value: string | undefined): boolean {
  // Default to persisting: an existing session predating this cookie should
  // not be silently downgraded.
  return value !== "0"
}

export function withPersistence(
  options: CookieOptions | undefined,
  persist: boolean
): CookieOptions | undefined {
  if (persist || !options) return options
  const { maxAge: _maxAge, expires: _expires, ...sessionScoped } = options
  return sessionScoped
}
