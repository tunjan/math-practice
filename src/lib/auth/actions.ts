"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  PERSIST_COOKIE,
  PERSIST_MAX_AGE,
} from "@/lib/supabase/cookies"
import { SITE_URL } from "@/lib/supabase/env"
import { validTimeZone } from "@/lib/timezone"
import { sendConfirmationLink } from "./confirmation"
import {
  clientAddress,
  consume,
  emailKey,
  LOGIN_PER_EMAIL,
  LOGIN_PER_IP,
  PASSWORD_RESET_PER_EMAIL,
  SIGNUP_PER_IP,
} from "./rate-limit"
import { homePathForRole } from "./roles"

export type FormState = {
  error?: string
  notice?: string
}

const GENERIC_CREDENTIALS_ERROR = "That email and password don't match."
const THROTTLED =
  "Too many attempts. Wait a few minutes and try again."
const UNCONFIRMED =
  "Confirm your email before signing in. We've sent you a new link."

/**
 * The persistence choice has to be recorded before Supabase writes its auth
 * cookies, because the cookie handlers read it to decide whether to keep the
 * `maxAge` on what they set.
 */
async function recordPersistence(persist: boolean) {
  const store = await cookies()
  store.set(PERSIST_COOKIE, persist ? "1" : "0", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // The flag itself always persists — it must outlive the session it
    // describes, so the next sign-in starts from the same preference.
    maxAge: PERSIST_MAX_AGE,
  })
}

export async function signIn(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const persist = formData.get("persist") === "on"

  if (!email || !password) {
    return { error: "Enter your email and password." }
  }

  // Two budgets: one per account, so a single target cannot be ground down,
  // and one per address, so a spray across many accounts is also capped.
  const [byEmail, byIp] = await Promise.all([
    consume(emailKey("login", email), LOGIN_PER_EMAIL),
    consume(`login:ip:${await clientAddress()}`, LOGIN_PER_IP),
  ])

  if (!byEmail.allowed || !byIp.allowed) {
    return {
      error:
        byEmail.degraded || byIp.degraded
          ? "Sign-in is temporarily unavailable. Try again shortly."
          : THROTTLED,
    }
  }

  await recordPersistence(persist)

  const supabase = await createClient()
  const { data: signedIn, error } = await supabase.auth.signInWithPassword({ email, password })

  // Supabase only reports an unconfirmed address once the password has
  // checked out, so saying so gives nothing away to a guesser.
  if (error?.code === "email_not_confirmed") {
    await sendConfirmationLink(email.toLowerCase())
    return { error: UNCONFIRMED }
  }

  if (error) {
    // Never distinguish "no such account" from "wrong password" — that turns
    // the login form into an account-existence oracle.
    return { error: GENERIC_CREDENTIALS_ERROR }
  }

  // If the project's "Confirm email" setting is ever switched off, Supabase
  // lets an unconfirmed account straight in. Hold the line here regardless.
  if (!signedIn.user?.email_confirmed_at) {
    await supabase.auth.signOut()
    await sendConfirmationLink(email.toLowerCase())
    return { error: UNCONFIRMED }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .single()

  redirect(homePathForRole(profile?.role ?? "student"))
}

export type SignUpState = FormState & {
  /** Set once the confirmation email has been queued; the form gives way to it. */
  sentTo?: string
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Creates a tutor account that cannot sign in until its email is confirmed.
 *
 * The account is made with the service role rather than Supabase's public
 * sign-up, so this action's rate limit is the only door, and the role is set
 * here on the server: handle_new_user() starts everyone as a student.
 */
export async function signUpTutor(
  _prev: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const fullName = String(formData.get("full_name") ?? "").trim()
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") ?? "")
  const timezone = validTimeZone(formData.get("timezone"))

  if (!fullName) return { error: "Enter your name." }
  if (fullName.length > 120) return { error: "That name is too long." }
  if (!EMAIL_SHAPE.test(email) || email.length > 254) return { error: "Enter a valid email address." }
  if (password.length < 10) return { error: "Use at least 10 characters for your password." }
  if (password.length > 72) return { error: "Use 72 characters at most for your password." }

  const byIp = await consume(`signup:ip:${await clientAddress()}`, SIGNUP_PER_IP)
  if (!byIp.allowed) {
    return {
      error: byIp.degraded ? "Sign-up is temporarily unavailable. Try again shortly." : THROTTLED,
    }
  }

  const admin = createAdminClient()
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { full_name: fullName },
  })

  if (createError || !created.user) {
    if (createError?.code === "weak_password") {
      return { error: "That password is too easy to guess. Choose a stronger one." }
    }
    if (createError?.code !== "email_exists" && !/already|registered|exists/i.test(createError?.message ?? "")) {
      console.error("[signup] createUser failed:", createError?.message)
      return { error: "We couldn't create that account. Try again shortly." }
    }

    // The address is taken. If it is a sign-up nobody confirmed, this one
    // replaces it; if it is a real account, nothing happens. Either way the
    // reply is the same as for a new address, so the form cannot be used to
    // find out who has an account.
    await sendConfirmationLink(email, { password, fullName, timezone })
    return { sentTo: email }
  }

  const { data: promoted } = await admin
    .from("profiles")
    .update({ role: "tutor", ...(timezone ? { timezone } : {}) })
    .eq("id", created.user.id)
    .eq("role", "student")
    .is("tutor_id", null)
    .select("id")
    .maybeSingle()

  if (!promoted) {
    // Never leave a half-made account behind: it would hold the address.
    await admin.auth.admin.deleteUser(created.user.id)
    console.error("[signup] Could not promote", created.user.id)
    return { error: "We couldn't create that account. Try again shortly." }
  }

  await sendConfirmationLink(email)
  return { sentTo: email }
}

const CONFIRMABLE = ["magiclink", "email", "signup"] as const
type Confirmable = (typeof CONFIRMABLE)[number]

/**
 * Spends the emailed token. This runs from a button rather than on page load,
 * because mail scanners open every link in a message and would otherwise use
 * the token up before its owner gets to it.
 */
export async function confirmEmailAddress(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const tokenHash = String(formData.get("token_hash") ?? "")
  const type = String(formData.get("type") ?? "") as Confirmable

  if (!tokenHash || !CONFIRMABLE.includes(type)) {
    return { error: "This link isn't valid." }
  }

  await recordPersistence(true)

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
  if (error) {
    return { error: "This link has expired or was already used. Sign in and we'll send you a new one." }
  }

  const { data: profile } = await supabase.from("profiles").select("role").single()
  redirect(homePathForRole(profile?.role ?? "student"))
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim()

  if (!email) return { error: "Enter your email address." }

  // Always the same reply, whether or not the account exists — otherwise this
  // form reveals who has an account here.
  const sent = {
    notice: "If that address has an account, a reset link is on its way.",
  }

  const { allowed } = await consume(
    emailKey("pwreset", email),
    PASSWORD_RESET_PER_EMAIL
  )
  if (!allowed) return sent

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL()}/auth/callback?next=/reset-password`,
  })

  return sent
}

export async function updatePassword(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")

  if (password.length < 10) {
    return { error: "Use at least 10 characters." }
  }
  if (password !== confirm) {
    return { error: "Those two passwords don't match." }
  }

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    return {
      error: "That reset link has expired. Request a new one.",
    }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .single()

  redirect(homePathForRole(profile?.role ?? "student"))
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
