import "server-only"

import { sendEmail } from "@/lib/email/send"
import { confirmEmail } from "@/lib/email/templates"
import { createAdminClient } from "@/lib/supabase/admin"
import { SITE_URL } from "@/lib/supabase/env"
import { CONFIRMATION_PER_EMAIL, consume, emailKey } from "./rate-limit"

/** What a fresh sign-up with the same address replaces on an unconfirmed account. */
type Replacement = { password: string; fullName: string; timezone: string | null }

/**
 * Emails a tutor the link that confirms their address, if there is an
 * unconfirmed tutor account for it. Says nothing either way, so callers can
 * give the same reply whether or not the address is known.
 *
 * The link is built on NEXT_PUBLIC_SITE_URL, not the request's Host header: it
 * carries a sign-in token, and a forged header must not be able to point it at
 * someone else's server.
 */
export async function sendConfirmationLink(email: string, replacement?: Replacement): Promise<void> {
  const { allowed } = await consume(emailKey("confirm", email), CONFIRMATION_PER_EMAIL)
  if (!allowed) return

  const admin = createAdminClient()

  // Students are created already confirmed, so only a tutor can be waiting.
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .eq("email", email)
    .maybeSingle()
  if (!profile || profile.role !== "tutor") return

  const { data: found } = await admin.auth.admin.getUserById(profile.id)
  if (!found.user || found.user.email_confirmed_at) return

  // Nobody has proved they own this address yet, so the latest sign-up wins:
  // otherwise whoever typed it first would keep a password on an account its
  // real owner later confirms.
  if (replacement) {
    const { error } = await admin.auth.admin.updateUserById(profile.id, {
      password: replacement.password,
      user_metadata: { full_name: replacement.fullName },
    })
    if (error) {
      console.error("[signup] Could not refresh the unconfirmed account:", error.message)
      return
    }
    await admin
      .from("profiles")
      .update({ full_name: replacement.fullName, ...(replacement.timezone ? { timezone: replacement.timezone } : {}) })
      .eq("id", profile.id)
  }

  const { data: link, error } = await admin.auth.admin.generateLink({ type: "magiclink", email })
  if (error || !link.properties?.hashed_token) {
    console.error("[signup] Could not create a confirmation link:", error?.message ?? "no token")
    return
  }

  const url = new URL("/auth/confirm", SITE_URL())
  url.searchParams.set("token_hash", link.properties.hashed_token)
  url.searchParams.set("type", link.properties.verification_type)

  // Without Resend nothing is sent, so in development print the link instead.
  if (process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY) {
    console.info(`[signup] Confirmation link for ${email}: ${url}`)
  }

  await sendEmail(email, confirmEmail({ fullName: replacement?.fullName ?? profile.full_name, url: url.toString() }))
}
