"use client"

import { useActionState, useId } from "react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormMessage } from "@/components/auth/form-message"
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

      <div className="flex flex-col gap-2">
        <Label htmlFor={emailId} className="eyebrow-sm text-body-mid">
          Your email
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
        <p className="body-sm text-body-mid">
          You choose this — your tutor never sees your password.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={passwordId} className="eyebrow-sm text-body-mid">
          Choose a password
        </Label>
        <Input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
        />
        <p className="body-sm text-body-mid">At least 10 characters.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={confirmId} className="eyebrow-sm text-body-mid">
          Confirm password
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
        {pending ? "Setting up…" : "Create my account"}
        {!pending && <ArrowRight />}
      </Button>
    </form>
  )
}
