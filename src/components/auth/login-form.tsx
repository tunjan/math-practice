"use client"

import { useActionState, useId } from "react"
import Link from "next/link"
import { LoaderCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn, type FormState } from "@/lib/auth/actions"

import { FormMessage } from "./form-message"
import { PasswordInput } from "./password-input"

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {})
  const emailId = useId()
  const passwordId = useId()
  const persistId = useId()
  const errorId = useId()
  const invalid = state.error ? { "aria-invalid": true, "aria-describedby": errorId } : {}

  return (
    <form action={action} className="flex flex-col gap-5" aria-busy={pending}>
      {state.error ? <FormMessage id={errorId} error={state.error} /> : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor={emailId} className="text-on-surface">
          Email
        </Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="you@example.com"
          required
          autoFocus
          {...invalid}
        />
      </div>

      {/* The reset link sits beside the label but comes after the field in
          tab order, so keyboard users go straight from email to password. */}
      <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-2">
        <Label htmlFor={passwordId} className="text-on-surface">
          Password
        </Label>
        <PasswordInput
          id={passwordId}
          name="password"
          autoComplete="current-password"
          required
          className="col-span-2 row-start-2"
          {...invalid}
        />
        <Link
          href="/forgot-password"
          className="col-start-2 row-start-1 rounded-sm body-md text-on-surface-muted underline-offset-4 transition-colors hover:text-on-surface hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <div className="flex items-center gap-2.5">
        <Checkbox id={persistId} name="persist" defaultChecked />
        <Label htmlFor={persistId} className="cursor-pointer body-md text-on-surface-secondary">
          Keep me signed in
        </Label>
      </div>

      <Button type="submit" variant="primary" disabled={pending} className="mt-1 w-full">
        {pending ? (
          <>
            <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  )
}
