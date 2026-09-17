"use client"

import { useActionState, useId } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestPasswordReset, type FormState } from "@/lib/auth/actions"

import { FormMessage } from "./form-message"

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    requestPasswordReset,
    {}
  )
  const emailId = useId()

  return (
    <form action={action} className="flex flex-col gap-5">
      <FormMessage error={state.error} notice={state.notice} />

      <div className="flex flex-col gap-2">
        <Label htmlFor={emailId} className="eyebrow-sm text-body-mid">
          Email
        </Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          placeholder="you@example.com"
        />
      </div>

      <Button type="submit" variant="primary" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  )
}
