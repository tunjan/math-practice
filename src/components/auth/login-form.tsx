"use client"

import { useActionState, useId, useState } from "react"
import Link from "next/link"
import { ArrowRight, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn, type FormState } from "@/lib/auth/actions"

import { FormMessage } from "./form-message"

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signIn,
    {}
  )
  const [showPassword, setShowPassword] = useState(false)
  const emailId = useId()
  const passwordId = useId()
  const persistId = useId()

  return (
    <form action={action} className="flex flex-col gap-5">
      <FormMessage error={state.error} />

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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={passwordId} className="eyebrow-sm text-body-mid">
            Password
          </Label>
          <Link
            href="/forgot-password"
            className="body-sm text-body-mid underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Forgot?
          </Link>
        </div>
        <div className="relative">
          <Input
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-body-mid transition-colors hover:text-ink"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox id={persistId} name="persist" defaultChecked />
        <Label htmlFor={persistId} className="cursor-pointer">
          Keep me signed in
        </Label>
      </div>

      <Button type="submit" variant="primary" size="lg" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
        {!pending && <ArrowRight />}
      </Button>
    </form>
  )
}
