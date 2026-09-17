import "server-only"

import { createHash, randomBytes, timingSafeEqual } from "node:crypto"

/**
 * Invite tokens are bearer credentials: whoever holds the link can claim the
 * account. They are therefore treated like passwords — generated from a CSPRNG,
 * and only ever stored as a hash.
 */

/** 32 bytes of entropy, URL-safe. Far beyond guessable. */
export function generateInviteToken(): string {
  return randomBytes(32).toString("base64url")
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

/**
 * Tokens are looked up by hash through a unique index, so the comparison is
 * already done by Postgres. This exists for the places where two hashes are
 * compared in application code.
 */
export function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex")
  const right = Buffer.from(b, "hex")
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

/** A token is only ever valid in a URL we built ourselves. */
export function inviteUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}/invite/${token}`
}

/**
 * Tokens come in from a URL segment. Reject anything that is not base64url of
 * the right length before it reaches the database.
 */
export function isWellFormedToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(value)
}
