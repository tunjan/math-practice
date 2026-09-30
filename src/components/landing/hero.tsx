import { Check, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ButtonLink } from "@/components/ui/button"

const QUESTIONS = [
  { q: "x² − 5x + 6 = 0", ok: true },
  { q: "2x² + 3x − 2 = 0", ok: false },
  { q: "x² = 4x + 12", ok: true },
]

/** Headline and one action on the left; a marked task on the right. */
export function Hero() {
  return (
    <section className="grid items-center gap-14 pt-14 pb-24 lg:grid-cols-[1fr_1.05fr] lg:gap-20 lg:pt-20 lg:pb-32">
      <div className="flex animate-slide-up-fade flex-col items-start gap-8 motion-reduce:animate-none">
        <h1 className="font-display text-4xl leading-[1.1] font-medium tracking-[-0.01em] text-balance text-on-surface md:text-[50px]">
          Maths practice, set and marked in one place
        </h1>
        <p className="max-w-sm text-base leading-6 text-on-surface-muted">
          Tasks, hand-ins and feedback between a tutor and their students.
        </p>
        <ButtonLink href="/login" variant="primary" className="px-6">
          Sign in
        </ButtonLink>
      </div>

      <div className="relative animate-slide-up-fade [animation-delay:150ms] motion-reduce:animate-none">
        <div
          className="relative flex min-h-[420px] items-center justify-center rounded-xl border border-outline bg-surface-muted px-4 py-10 [background-image:radial-gradient(var(--outline-strong)_1px,transparent_1px)] [background-size:20px_20px] sm:px-10"
        >
          <div className="relative w-full max-w-[340px]">
            <article className="flex flex-col gap-5 rounded-lg border border-outline bg-surface p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-12px_rgb(0_0_0/0.10)]">
              <header className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm leading-6 font-semibold text-on-surface">Quadratics</h2>
                  <p className="text-xs text-on-surface-muted">Set 4, due Fri 2 Oct</p>
                </div>
                <Badge variant="success">Marked</Badge>
              </header>

              <ul className="flex flex-col gap-2.5 font-mono text-[13px] text-on-surface-secondary">
                {QUESTIONS.map(({ q, ok }, i) => (
                  <li key={q} className="flex items-center gap-3">
                    <span className="w-3 text-on-surface-muted">{i + 1}</span>
                    <span className="flex-1">{q}</span>
                    {ok ? (
                      <Check className="size-4 text-success" aria-label="Correct" />
                    ) : (
                      <X className="size-4 text-error" aria-label="Incorrect" />
                    )}
                  </li>
                ))}
              </ul>

              <footer className="flex items-center justify-between gap-4 border-t border-outline pt-4">
                <p className="text-sm text-on-surface-secondary">Q2: check the sign when you factorise.</p>
                <p className="font-mono text-xl text-on-surface">
                  2<span className="text-on-surface-muted">/3</span>
                </p>
              </footer>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
