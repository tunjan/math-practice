"use client"

import { useActionState, useId } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePassword, type FormState } from "@/lib/auth/actions"

import { FormMessage } from "./form-message"

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updatePassword,
    {}
  )
  const passwordId = useId()
  const confirmId = useId()

  return (
    <form action={action} className="flex flex-col gap-5">
      <FormMessage error={state.error} />

      <div className="flex flex-col gap-2">
        <Label htmlFor={passwordId} className="eyebrow-sm text-body-mid">
          New password
        </Label>
        <Input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          autoFocus
        />
        <p className="body-sm text-body-mid">At least 10 characters.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={confirmId} className="eyebrow-sm text-body-mid">
          Confirm new password
        </Label>
        <Input
          id={confirmId}
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
        />
      </div>

      <Button type="submit" variant="primary" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Set new password"}
      </Button>
    </form>
  )
}
