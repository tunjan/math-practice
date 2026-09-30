"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { confirmEmailAddress, type FormState } from "@/lib/auth/actions"

import { FormMessage } from "./form-message"

export function ConfirmEmailForm({ tokenHash, type }: { tokenHash: string; type: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(confirmEmailAddress, {})

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      <FormMessage error={state.error} />

      <Button type="submit" variant="primary" disabled={pending} className="w-full">
        {pending ? "Confirming" : "Confirm and continue"}
      </Button>
    </form>
  )
}
