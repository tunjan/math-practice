import type { Metadata } from "next"

import { AuthCard } from "@/components/auth/auth-card"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = { title: "Sign in · Maths Tasks" }

export default function LoginPage() {
  return (
    <AuthCard
      eyebrow="Sign in"
      title="Welcome back"
      description="Your tutor's workspace for problem sets, feedback and deadlines."
      footer={
        <p className="body-sm text-body-mid">
          Students join by invitation. Ask your tutor for a link if you don&apos;t
          have an account yet.
        </p>
      }
    >
      <LoginForm />
    </AuthCard>
  )
}
