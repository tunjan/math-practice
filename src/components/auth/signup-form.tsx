"use client"

import { useActionState, useId } from "react"
import { LoaderCircle, MailCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUpTutor, type SignUpState } from "@/lib/auth/actions"

import { FormMessage } from "./form-message"
import { PasswordInput } from "./password-input"
import { TimeZoneField } from "./time-zone-field"

export function SignupForm() {
  const [state, action, pending] = useActionState<SignUpState, FormData>(signUpTutor, {})
  const nameId = useId()
  const emailId = useId()
  const passwordId = useId()
  const hintId = useId()
  const errorId = useId()

  if (state.sentTo) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 text-center">
        <MailCheck className="size-6 text-muted-foreground" aria-hidden />
        <p className="body-md text-foreground/80">
          We&apos;ve sent a confirmation link to{" "}
          <span className="font-medium break-all text-foreground">{state.sentTo}</span>. Open it to finish
          setting up your account.
        </p>
        <p className="body-md text-muted-foreground">
          The link expires in an hour. Nothing there? Check spam, or if you already have an account, sign in.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-5" aria-busy={pending}>
      <TimeZoneField />
      {state.error ? <FormMessage id={errorId} error={state.error} /> : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor={nameId} className="text-foreground">
          Your name
        </Label>
        <Input id={nameId} name="full_name" autoComplete="name" maxLength={120} required autoFocus />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={emailId} className="text-foreground">
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
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={passwordId} className="text-foreground">
          Password
        </Label>
        <PasswordInput
          id={passwordId}
          name="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={72}
          required
          aria-describedby={hintId}
        />
        <p id={hintId} className="body-md text-muted-foreground">
          At least 10 characters.
        </p>
      </div>

      <Button type="submit" variant="primary" disabled={pending} className="mt-1 w-full">
        {pending ? (
          <>
            <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden />
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  )
}
