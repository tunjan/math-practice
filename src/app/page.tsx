import type { Metadata } from "next"
import { Check, FileText, X } from "lucide-react"

import { Wordmark } from "@/components/brand/primitives"
import { ButtonLink } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Maths Tasks",
  description: "Problem sets, hand-ins and feedback between a maths tutor and their students.",
}

/**
 * Signed-out front door. Signed-in visitors never see it: middleware sends
 * them to their workspace.
 *
 * Dub marketing layout: a faint grid behind a Satoshi headline and one black
 * action, then the product loop (set, hand in, feedback) as three framed
 * cards, so the structure explains the app instead of copy.
 */
export default function Home() {
  return (
    <div className="dub relative isolate flex min-h-dvh flex-col overflow-x-clip bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] [background-image:linear-gradient(to_right,var(--outline)_1px,transparent_1px),linear-gradient(to_bottom,var(--outline)_1px,transparent_1px)] [background-size:48px_48px] [background-position:center_top] opacity-70 [mask-image:radial-gradient(ellipse_60%_100%_at_50%_0%,black,transparent)]"
      />

      <header className="mx-auto flex h-16 w-full max-w-screen-xl items-center px-4 lg:px-10">
        <Wordmark href="/" />
      </header>

      <main className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col items-center px-4 pt-16 pb-24 lg:px-10 lg:pt-24">
        <section className="flex max-w-2xl animate-slide-up-fade flex-col items-center gap-8 text-center motion-reduce:animate-none">
          <h1 className="font-display text-4xl leading-[1.1] font-medium tracking-[-0.01em] text-balance text-on-surface md:text-[50px]">
            Maths homework, set and marked in one place
          </h1>
          <div className="flex flex-col items-center gap-3">
            <ButtonLink href="/login" variant="primary" className="w-fit px-6">
              Sign in
            </ButtonLink>
            <p className="text-sm text-on-surface-muted">Students join by invite from their tutor.</p>
          </div>
        </section>

        <ol
          aria-label="How it works"
          className="mt-16 grid w-full max-w-5xl animate-slide-up-fade gap-3 rounded-2xl border border-outline bg-surface-muted p-3 [animation-delay:120ms] motion-reduce:animate-none md:mt-20 md:grid-cols-3"
        >
          <Step n={1} label="Set">
            <div>
              <p className="text-sm leading-6 font-semibold text-on-surface">Quadratics · Set 4</p>
              <p className="text-xs text-on-surface-muted">Due Fri 26 Sep</p>
            </div>
            <ul className="flex flex-col gap-2 border-y border-outline py-3 font-mono text-[13px] text-on-surface-secondary">
              {["x² − 5x + 6 = 0", "2x² + 3x − 2 = 0", "x² = 4x + 12"].map((q, i) => (
                <li key={q} className="flex gap-3">
                  <span className="text-on-surface-muted">{i + 1}</span>
                  {q}
                </li>
              ))}
            </ul>
            <FileChip name="worksheet.pdf" />
          </Step>

          <Step n={2} label="Hand in">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-surface-sunken text-xs font-medium text-on-surface-secondary">
                SL
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-6 font-semibold text-on-surface">Sam Lee</p>
                <p className="text-xs text-on-surface-muted">Thu 25 Sep, 18:40</p>
              </div>
              <Pill className="bg-info-container text-on-info-container">Handed in</Pill>
            </div>
            <div className="flex flex-1 flex-col gap-2 rounded-lg border border-outline bg-surface-muted p-3">
              {[80, 64, 72, 48].map((w) => (
                <span key={w} className="h-1.5 rounded-full bg-outline" style={{ width: `${w}%` }} />
              ))}
            </div>
            <FileChip name="working.pdf" />
          </Step>

          <Step n={3} label="Feedback">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-2xl text-on-surface">
                2<span className="text-on-surface-muted">/3</span>
              </p>
              <Pill className="bg-success-container text-on-success-container">Marked</Pill>
            </div>
            <ul className="flex gap-2">
              {[true, false, true].map((ok, i) => (
                <li
                  key={i}
                  className="flex h-7 items-center gap-1 rounded-md border border-outline px-2 font-mono text-xs text-on-surface-secondary"
                >
                  {i + 1}
                  {ok ? (
                    <Check className="size-3.5 text-success" aria-label="correct" />
                  ) : (
                    <X className="size-3.5 text-error" aria-label="incorrect" />
                  )}
                </li>
              ))}
            </ul>
            <p className="rounded-lg border border-outline bg-surface-muted px-3 py-2 text-sm text-on-surface-secondary">
              Q2: check the sign when you factorise.
            </p>
          </Step>
        </ol>
      </main>
    </div>
  )
}

function Step({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-3">
      <p className="flex items-center gap-2 px-1 pt-1 text-sm font-medium text-on-surface">
        <span className="flex size-5 items-center justify-center rounded-full border border-outline-strong bg-surface font-mono text-[11px] text-on-surface-muted">
          {n}
        </span>
        {label}
      </p>
      <div className="flex flex-1 flex-col gap-3 rounded-xl border border-outline bg-surface p-4">{children}</div>
    </li>
  )
}

function FileChip({ name }: { name: string }) {
  return (
    <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-md border border-outline px-2 py-1 text-xs text-on-surface-secondary">
      <FileText className="size-3.5 text-on-surface-muted" aria-hidden />
      {name}
    </span>
  )
}

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${className}`}>{children}</span>
  )
}
