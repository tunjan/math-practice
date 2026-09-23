"use client"

import { useActionState, useId } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/label"
import { updatePassword, type FormState } from "@/lib/auth/actions"

import { FormMessage } from "./form-message"
import { PasswordInput } from "./password-input"

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

      <Field label="New password" htmlFor={passwordId} hint="At least 10 characters.">
        <PasswordInput
          id={passwordId}
          name="password"
          autoComplete="new-password"
          required
          minLength={10}
          autoFocus
        />
      </Field>

      <Field label="Confirm new password" htmlFor={confirmId}>
        <PasswordInput
          id={confirmId}
          name="confirm"
          autoComplete="new-password"
          required
          minLength={10}
        />
      </Field>

      <Button type="submit" variant="primary" disabled={pending} className="w-full">
        {pending ? "Saving" : "Set new password"}
      </Button>
    </form>
  )
}
