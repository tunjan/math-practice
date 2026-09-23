import { cn } from "cn"

import { MathProse } from "@/components/assignments/math-prose"
import { TickProgress } from "@/components/ui/progress"
import { daysBetween, formatDayShort, type DayKey } from "@/lib/calendar/dates"
import { focusUnit, planProgress, type Plan } from "@/lib/plans/model"

import { StudentUnit } from "./student-unit"

/** The student's plan: where it is heading, how far along, and each unit in order. */
export function StudentPlan({ plan, today }: { plan: Plan; today: DayKey }) {
  const progress = planProgress(plan.units)
  const focus = focusUnit(plan.units, today)
  const daysLeft = daysBetween(today, plan.endsOn)

  return (
    <div className="flex flex-1 flex-col bg-surface">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 pt-10 pb-20 sm:px-8 sm:pt-14">
        <header className="flex min-w-0 flex-col gap-3">
          <h1 className="animate-slide-up-fade font-display text-3xl leading-[1.2] font-medium text-pretty text-on-surface sm:text-4xl sm:leading-[1.15]">
            {plan.title}
          </h1>
          <p
            style={{ animationDelay: "80ms" }}
            className="animate-slide-up-fade font-mono text-xs text-on-surface-muted"
          >
            {formatDayShort(plan.startsOn)} – {formatDayShort(plan.endsOn)}
            {daysLeft > 0 ? ` · ${weeksLeft(daysLeft)} left` : null}
          </p>
          {plan.goal ? (
            <div
              style={{ animationDelay: "120ms" }}
              className="max-w-xl animate-slide-up-fade text-base text-pretty text-on-surface-secondary"
            >
              <MathProse>{plan.goal}</MathProse>
            </div>
          ) : null}
        </header>

        {plan.units.length > 0 ? (
          <section
            aria-label="Progress"
            style={{ animationDelay: "160ms" }}
            className="grid animate-slide-up-fade gap-6 rounded-xl bg-surface-sunken p-5 sm:grid-cols-2"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-on-surface">Secure</span>
                <span className="font-mono text-xs text-on-surface-muted">
                  {progress.secure}/{progress.total}
                </span>
              </div>
              {/* One segment per unit, filled as your tutor rates it. */}
              <div className="flex h-3 gap-1" aria-hidden>
                {plan.units.map((u) => (
                  <span
                    key={u.id}
                    className={cn(
                      "flex-1 rounded-full",
                      u.mastery === "secure"
                        ? "bg-accent-orange"
                        : u.mastery === "developing"
                          ? "bg-accent-orange/35"
                          : "bg-outline"
                    )}
                  />
                ))}
              </div>
              <span className="sr-only">
                {progress.secure} of {progress.total} units rated secure by your tutor
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-on-surface">Confidence</span>
                <span className="font-mono text-xs text-on-surface-muted">
                  {progress.selfPct === null ? "–" : `${progress.selfPct}%`}
                </span>
              </div>
              <TickProgress value={progress.selfPct ?? 0} label="Your confidence across the plan" />
            </div>
          </section>
        ) : null}

        {plan.units.length > 0 ? (
          <ol aria-label="Units" className="animate-slide-up-fade" style={{ animationDelay: "200ms" }}>
            {plan.units.map((unit, index) => (
              <StudentUnit
                key={unit.id}
                unit={unit}
                today={today}
                isFocus={unit.id === focus?.id}
                isLast={index === plan.units.length - 1}
              />
            ))}
          </ol>
        ) : (
          <p className="text-base text-on-surface-muted">Your tutor is still adding units.</p>
        )}
      </div>
    </div>
  )
}

function weeksLeft(days: number): string {
  if (days < 14) return `${days} ${days === 1 ? "day" : "days"}`
  const weeks = Math.round(days / 7)
  return `${weeks} weeks`
}
