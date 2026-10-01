import * as React from "react"
import Link from "next/link"

/**
 * Dub onboarding: a white page with a faint grid fading out from the top, one
 * centred card, and a tinted footer strip for the only other path in.
 */
export function EntryShell({
  title,
  children,
  footer,
}: {
  title: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:48px_48px] [background-position:center_top] opacity-70 [mask-image:radial-gradient(ellipse_60%_100%_at_50%_0%,black,transparent)]"
      />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[380px] animate-slide-up-fade motion-reduce:animate-none">
          <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-[0_1px_3px_rgb(0_0_0/0.04)]">
            <div className="flex flex-col gap-8 px-6 pt-8 pb-6 sm:px-8">
              <h1 className="text-center font-display text-2xl leading-8 font-medium text-balance text-foreground">
                {title}
              </h1>
              {children}
            </div>
            <p className="border-t border-border bg-muted/50 px-6 py-4 text-center body-md text-muted-foreground sm:px-8">
              {footer}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export function EntryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md font-medium text-foreground underline-offset-4 transition-colors hover:underline"
    >
      {children}
    </Link>
  )
}
