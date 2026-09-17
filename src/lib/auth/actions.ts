"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import {
  PERSIST_COOKIE,
  PERSIST_MAX_AGE,
} from "@/lib/supabase/cookies"
import { SITE_URL } from "@/lib/supabase/env"
import {
  clientAddress,
  consume,
  emailKey,
  LOGIN_PER_EMAIL,
  LOGIN_PER_IP,
  PASSWORD_RESET_PER_EMAIL,
} from "./rate-limit"
import { homePathForRole } from "./roles"

export type FormState = {
  error?: string
  notice?: string
}

const GENERIC_CREDENTIALS_ERROR = "That email and password don't match."
const THROTTLED =
  "Too many attempts. Wait a few minutes and try again."

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
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Never distinguish "no such account" from "wrong password" — that turns
    // the login form into an account-existence oracle.
    return { error: GENERIC_CREDENTIALS_ERROR }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .single()

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
