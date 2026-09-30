"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { after } from "next/server"

import { sendEmail } from "@/lib/email/send"
import { welcomeEmail } from "@/lib/email/templates"
import { requestOrigin } from "@/lib/request-origin"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/session"
import { validTimeZone } from "@/lib/timezone"
import {
  clientAddress,
  consume,
  INVITE_REDEEM_PER_IP,
} from "@/lib/auth/rate-limit"
import {
  generateInviteToken,
  hashInviteToken,
  inviteUrl,
  isWellFormedToken,
} from "./tokens"

export type InviteActionState = {
  error?: string
  /** Present exactly once, immediately after creation — never stored. */
  link?: string
  notice?: string
}

export async function createInvite(
  _prev: InviteActionState,
  formData: FormData
): Promise<InviteActionState> {
  const tutor = await requireRole("tutor")
  const fullName = String(formData.get("full_name") ?? "").trim()

  if (!fullName) return { error: "Give the student a name." }
  if (fullName.length > 120) return { error: "That name is too long." }

  const token = generateInviteToken()
  const supabase = await createClient()

  const { error } = await supabase.from("student_invites").insert({
    token_hash: hashInviteToken(token),
    full_name: fullName,
    created_by: tutor.id,
  })

  if (error) return { error: error.message }

  revalidatePath("/tutor/students")

  // The raw token is returned once, here, and never again — the database holds
  // only its hash. If the tutor loses this link they revoke and re-invite.
  return { link: inviteUrl(await requestOrigin(), token) }
}

export async function revokeInvite(
  _prev: InviteActionState,
  formData: FormData
): Promise<InviteActionState> {
  await requireRole("tutor")
  const id = String(formData.get("invite_id") ?? "")
  if (!id) return { error: "Missing invite." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("student_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("accepted_at", null)

  if (error) return { error: error.message }

  revalidatePath("/tutor/students")
  return { notice: "Invite revoked." }
}

export type RedeemState = { error?: string }

/**
 * Turns an invite link into an account.
 *
 * Runs with the service role because nobody is signed in yet, so every check
 * has to be made explicitly here and in redeem_invite(): the database will not
 * do it for us on this path.
 */
export async function redeemInvite(
  _prev: RedeemState,
  formData: FormData
): Promise<RedeemState> {
  const token = String(formData.get("token") ?? "")
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")

  if (!isWellFormedToken(token)) return { error: "That invite link is not valid." }
  if (!email) return { error: "Enter an email address." }
  if (password.length < 10) return { error: "Use at least 10 characters." }
  if (password !== confirm) return { error: "Those two passwords don't match." }

  const { allowed } = await consume(
    `invite:ip:${await clientAddress()}`,
    INVITE_REDEEM_PER_IP
  )
  if (!allowed) {
    return { error: "Too many attempts. Wait a while and try again." }
  }

  const admin = createAdminClient()
  const tokenHash = hashInviteToken(token)

  // Check the invite before creating anything, so a dead link does not leave an
  // orphaned auth user behind.
  const { data: invite } = await admin
    .from("student_invites")
    .select("id, accepted_at, revoked_at, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle()

  if (!invite || invite.revoked_at || invite.accepted_at) {
    return { error: "This invite has already been used or was withdrawn." }
  }
  if (new Date(invite.expires_at) <= new Date()) {
    return { error: "This invite has expired. Ask your tutor for a new link." }
  }

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      // The tutor vouched for them by issuing the link; a second round trip
      // through an email confirmation adds friction without adding assurance.
      email_confirm: true,
    })

  if (createError || !created.user) {
    const message = createError?.message ?? "Could not create that account."
    return {
      error: /already|registered|exists/i.test(message)
        ? "There is already an account with that email. Sign in instead."
        : message,
    }
  }

  // The wrapper is typed, but only service_role holds EXECUTE on it.
  const { data: result, error: redeemError } = await admin.rpc("redeem_invite", {
    p_token_hash: tokenHash,
    p_user_id: created.user.id,
  })

  const outcome = result as {
    ok?: boolean
    reason?: string
    full_name?: string
    adopted?: number
  } | null

  if (redeemError || !outcome?.ok) {
    // Lost a race for the same link, or the invite changed under us. Remove the
    // account we just made rather than leaving a student able to sign in with
    // no tutor attached.
    await admin.auth.admin.deleteUser(created.user.id)
    return {
      error:
        outcome?.reason === "already_used"
          ? "This invite has just been used. Ask your tutor for a new link."
          : "This invite is no longer valid. Ask your tutor for a new link.",
    }
  }

  // Deadlines are shown on the student's own calendar day; without this they
  // would all be read in the default zone.
  const timezone = validTimeZone(formData.get("timezone"))
  if (timezone) {
    await admin.from("profiles").update({ timezone }).eq("id", created.user.id)
  }

  const origin = await requestOrigin()
  after(() =>
    sendEmail(
      email,
      welcomeEmail({
        fullName: outcome.full_name ?? "",
        waitingTasks: outcome.adopted ?? 0,
        url: `${origin}/student`,
      })
    )
  )

  // Sign them in on the normal cookie-based client so they land in their
  // workspace rather than back at the login form.
  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    // The account exists and is linked; only the automatic sign-in failed.
    return { error: "Your account is ready. Please sign in." }
  }

  redirect("/student")
}
