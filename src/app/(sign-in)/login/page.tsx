import type { Metadata } from "next"

import { EntryLink, EntryShell } from "@/components/auth/entry-shell"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = { title: "Sign in · Maths Tasks" }

export default function LoginPage() {
  return (
    <EntryShell
      title="Sign in to Maths Tasks"
      footer={
        <>
          Students join by invite from their tutor. Tutor?{" "}
          <EntryLink href="/signup">Create an account</EntryLink>
        </>
      }
    >
      <LoginForm />
    </EntryShell>
  )
}
