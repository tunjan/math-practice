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
        <h1 className="font-display text-4xl leading-[1.1] font-medium tracking-[-0.01em] text-balance text-foreground md:text-[50px]">
          Maths practice, set and marked in one place
        </h1>
        <p className="max-w-sm text-base leading-6 text-muted-foreground">
          Tasks, hand-ins and feedback between a tutor and their students.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href="/signup" variant="primary" className="px-6">
            Start tutoring
          </ButtonLink>
          <ButtonLink href="/login" variant="secondary" className="px-6">
            Sign in
          </ButtonLink>
        </div>
      </div>

      <div className="relative animate-slide-up-fade [animation-delay:150ms] motion-reduce:animate-none">
        <div
          className="relative flex min-h-[420px] items-center justify-center rounded-2xl border border-border bg-muted/50 px-4 py-10 [background-image:radial-gradient(var(--input)_1px,transparent_1px)] [background-size:20px_20px] sm:px-10"
        >
          <div className="relative w-full max-w-[340px]">
            <article className="flex flex-col gap-5 rounded-xl border border-border bg-background p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-12px_rgb(0_0_0/0.10)]">
              <header className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm leading-6 font-semibold text-foreground">Quadratics</h2>
                  <p className="text-xs text-muted-foreground">Set 4, due Fri 2 Oct</p>
                </div>
                <Badge variant="success">Marked</Badge>
              </header>

              <ul className="flex flex-col gap-2.5 font-mono text-[13px] text-foreground/80">
                {QUESTIONS.map(({ q, ok }, i) => (
                  <li key={q} className="flex items-center gap-3">
                    <span className="w-3 text-muted-foreground">{i + 1}</span>
                    <span className="flex-1">{q}</span>
                    {ok ? (
                      <Check className="size-4 text-success" aria-label="Correct" />
                    ) : (
                      <X className="size-4 text-destructive" aria-label="Incorrect" />
                    )}
                  </li>
                ))}
              </ul>

              <footer className="flex items-center justify-between gap-4 border-t border-border pt-4">
                <p className="text-sm text-foreground/80">Q2: check the sign when you factorise.</p>
                <p className="font-mono text-xl text-foreground">
                  2<span className="text-muted-foreground">/3</span>
                </p>
              </footer>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
