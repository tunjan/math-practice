import type { Metadata } from "next"

import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = { title: "Sign in · Maths Tasks" }

/**
 * Dub onboarding: a white page with a faint grid fading out from the top, one
 * centred card, and a tinted footer strip for the only other path in.
 */
export default function LoginPage() {
  return (
    <div className="dub relative isolate flex min-h-dvh flex-col bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] [background-image:linear-gradient(to_right,var(--outline)_1px,transparent_1px),linear-gradient(to_bottom,var(--outline)_1px,transparent_1px)] [background-size:48px_48px] [background-position:center_top] opacity-70 [mask-image:radial-gradient(ellipse_60%_100%_at_50%_0%,black,transparent)]"
      />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[380px] animate-slide-up-fade motion-reduce:animate-none">
          <div className="overflow-hidden rounded-xl border border-outline bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.04)]">
            <div className="flex flex-col gap-8 px-6 pt-8 pb-6 sm:px-8">
              <h1 className="text-center font-display text-2xl leading-8 font-medium text-balance text-on-surface">
                Sign in to Maths Tasks
              </h1>
              <LoginForm />
            </div>
            <p className="border-t border-outline bg-surface-muted px-6 py-4 text-center body-md text-on-surface-muted sm:px-8">
              New here? Ask your tutor for an invite.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
