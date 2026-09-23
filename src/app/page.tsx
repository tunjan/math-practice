import type { Metadata } from "next"

import { Wordmark } from "@/components/brand/primitives"
import { ButtonLink } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Maths Tasks",
  description: "Problem sets, hand-ins and feedback between a maths tutor and their students.",
}

/**
 * Signed-out front door. Signed-in visitors never see it: middleware sends
 * them to their workspace.
 */
export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-canvas-cool">
      <header className="flex h-16 items-center justify-between px-4 md:px-8">
        <Wordmark href="/" />
        <ButtonLink href="/login" size="sm">
          Sign in
        </ButtonLink>
      </header>

      <main className="mx-auto flex w-full max-w-content flex-1 items-center px-4 py-12 md:px-8 lg:py-16">
        <div className="relative z-[1] flex max-w-xl flex-col gap-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <h1 className="headline-xl text-on-surface">
            Maths homework, set and reviewed in one place.
          </h1>
          <p className="body-lg text-on-surface-secondary">
            Tutors set problem sets with worksheets and deadlines. Students hand in their working
            and get feedback.
          </p>
          <div>
            <ButtonLink href="/login" variant="primary">
              Sign in
            </ButtonLink>
          </div>
        </div>
      </main>

      <footer className="px-4 pb-8 md:px-8">
        <p className="mx-auto max-w-content body-sm text-on-surface-secondary">
          Students join by invitation from their tutor.
        </p>
      </footer>
    </div>
  )
}
