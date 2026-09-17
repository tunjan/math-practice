import type { Metadata } from "next"
import Link from "next/link"

import { AuthCard } from "@/components/auth/auth-card"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = { title: "Reset password · Maths Tasks" }

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      eyebrow="Password reset"
      title="Forgotten password"
      description="Enter your email and we'll send you a link to set a new one."
      footer={
        <Link
          href="/login"
          className="body-sm text-body-mid underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  )
}
