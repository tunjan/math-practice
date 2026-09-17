import type { Metadata } from "next"
import Link from "next/link"

import { AuthCard } from "@/components/auth/auth-card"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { FormMessage } from "@/components/auth/form-message"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "New password · Maths Tasks" }
export const dynamic = "force-dynamic"

export default async function ResetPasswordPage() {
  // Arriving here means /auth/callback already exchanged the emailed code for a
  // session. Without one, the link was stale or already used.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <AuthCard
      eyebrow="Password reset"
      title="Choose a new password"
      description={user?.email ?? undefined}
      footer={
        <Link
          href="/login"
          className="body-sm text-body-mid underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      {user ? (
        <ResetPasswordForm />
      ) : (
        <FormMessage error="That reset link has expired or has already been used. Request a new one." />
      )}
    </AuthCard>
  )
}
