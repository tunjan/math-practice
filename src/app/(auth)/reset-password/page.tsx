import type { Metadata } from "next"

import { AuthCard, AuthLink } from "@/components/auth/auth-card"
import { FormMessage } from "@/components/auth/form-message"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
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
      title="Choose a new password"
      description={
        user?.email ? (
          <>
            For <span className="mono-data-sm text-on-surface">{user.email}</span>
          </>
        ) : undefined
      }
      footer={<AuthLink href="/login">Back to sign in</AuthLink>}
    >
      {user ? (
        <ResetPasswordForm />
      ) : (
        <FormMessage error="That reset link has expired or has already been used. Request a new one." />
      )}
    </AuthCard>
  )
}
