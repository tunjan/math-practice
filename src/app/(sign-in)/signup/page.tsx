import type { Metadata } from "next"

import { EntryLink, EntryShell } from "@/components/auth/entry-shell"
import { SignupForm } from "@/components/auth/signup-form"

export const metadata: Metadata = { title: "Create a tutor account · Maths Tasks" }

export default function SignupPage() {
  return (
    <EntryShell
      title="Create a tutor account"
      footer={
        <>
          Already have an account? <EntryLink href="/login">Sign in</EntryLink>
        </>
      }
    >
      <SignupForm />
    </EntryShell>
  )
}
