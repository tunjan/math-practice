"use client"

import { useActionState, useId } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/ui/label"
import { FormMessage } from "@/components/auth/form-message"
import { PasswordInput } from "@/components/auth/password-input"
import { redeemInvite, type RedeemState } from "@/lib/invites/actions"

export function RedeemForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<RedeemState, FormData>(
    redeemInvite,
    {}
  )
  const emailId = useId()
  const passwordId = useId()
  const confirmId = useId()

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <FormMessage error={state.error} />

      <Field
        label="Your email"
        htmlFor={emailId}
        hint="Your tutor never sees your password."
      >
        <Input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
        />
      </Field>

      <Field label="Choose a password" htmlFor={passwordId} hint="At least 10 characters.">
        <PasswordInput
          id={passwordId}
          name="password"
          autoComplete="new-password"
          required
          minLength={10}
        />
      </Field>

      <Field label="Confirm password" htmlFor={confirmId}>
        <PasswordInput
          id={confirmId}
          name="confirm"
          autoComplete="new-password"
          required
          minLength={10}
        />
      </Field>

      <Button type="submit" variant="primary" disabled={pending} className="w-full">
        {pending ? "Creating account" : "Create account"}
      </Button>
    </form>
  )
}
