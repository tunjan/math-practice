import type { Metadata } from "next"
import Link from "next/link"

import { Wordmark } from "@/components/brand/primitives"
import { ButtonLink } from "@/components/ui/button"
import { Hero } from "@/components/landing/hero"
import { Loop } from "@/components/landing/loop"
import { Planning } from "@/components/landing/planning"
import { Reveal } from "@/components/landing/reveal"

export const metadata: Metadata = {
  title: "Maths Tasks",
  description: "Problem sets, hand-ins and feedback between a maths tutor and their students.",
}

/**
 * Signed-out front door. Signed-in visitors never see it: middleware sends
 * them to their workspace.
 *
 * Dub marketing language (DESIGN.md): Satoshi headlines, hairlines, one black
 * action. The structure carries the meaning, so text is kept to headings and
 * one short line: the product loop, then the course view.
 */
export default function Home() {
  return (
    <div className="dub relative isolate min-h-dvh overflow-x-clip bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] [background-image:linear-gradient(to_right,var(--outline)_1px,transparent_1px),linear-gradient(to_bottom,var(--outline)_1px,transparent_1px)] [background-size:56px_56px] [background-position:center_top] opacity-60 [mask-image:radial-gradient(ellipse_70%_100%_at_50%_0%,black,transparent)]"
      />

      <header className="sticky top-0 z-40 border-b border-transparent bg-surface/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between px-4 lg:px-10">
          <Wordmark href="/" />
          <ButtonLink href="/login" variant="primary" size="sm">
            Sign in
          </ButtonLink>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-xl px-4 lg:px-10">
        <Hero />
        <Loop />
        <Planning />

        <Reveal className="flex flex-col items-center gap-6 border-t border-outline py-24 text-center lg:py-32">
          <h2 className="font-display text-3xl leading-[1.15] font-medium text-balance text-on-surface md:text-[40px]">
            Pick up where you left off
          </h2>
          <ButtonLink href="/login" variant="primary" className="px-6">
            Sign in
          </ButtonLink>
          <p className="text-sm text-on-surface-muted">
            Students join by invite from their tutor. Tutor?{" "}
            <Link href="/signup" className="font-medium text-on-surface underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </Reveal>
      </main>

      <footer className="mx-auto flex h-20 w-full max-w-screen-xl items-center justify-between px-4 text-sm text-on-surface-muted lg:px-10">
        <Wordmark href="/" className="text-on-surface-secondary" />
        <span>&copy; {new Date().getFullYear()}</span>
      </footer>
    </div>
  )
}
