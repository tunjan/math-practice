import { cn } from "cn"

import { MathProse } from "@/components/assignments/math-prose"
import { daysBetween, formatDayLong, formatDayShort, WEEKDAYS, type DayKey } from "@/lib/calendar/dates"
import { focusUnit, planProgress, type Plan } from "@/lib/plans/model"
import { streakWeeks, weekStatus, type WeekStatus } from "@/lib/plans/streak"

import { LogStudy } from "./log-study"
import { StudentUnit } from "./student-unit"

/**
 * The student's plan, top to bottom: what it is and how long is left, this
 * week's study days, then the units in order with the current one open.
 */
export function StudentPlan({
  plan,
  studyDays,
  today,
}: {
  plan: Plan
  studyDays: Set<DayKey>
  today: DayKey
}) {
  const progress = planProgress(plan.units)
  const week = weekStatus(studyDays, plan.weeklyGoalDays, today)
  const streak = streakWeeks(studyDays, plan.weeklyGoalDays, today)
  const focus = focusUnit(plan.units, today)
  const daysLeft = daysBetween(today, plan.endsOn)

  return (
    <div className="flex flex-1 flex-col bg-surface">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 pt-10 pb-20 sm:px-8 sm:pt-14">
        <header className="flex min-w-0 animate-slide-up-fade flex-col gap-2">
          <h1 className="font-display text-3xl leading-[1.2] font-medium text-pretty text-on-surface sm:text-4xl sm:leading-[1.15]">
            {plan.title}
          </h1>
          <p className="text-sm text-on-surface-muted">
            <span className="font-mono text-xs">
              {formatDayShort(plan.startsOn)} – {formatDayShort(plan.endsOn)}
            </span>
            {daysLeft > 0 ? ` · ${timeLeft(daysLeft)} left` : null}
          </p>
          {plan.goal ? (
            <div className="mt-2 max-w-xl text-base text-pretty text-on-surface-secondary">
              <MathProse>{plan.goal}</MathProse>
            </div>
          ) : null}
        </header>

        <section
          aria-label="This week"
          style={{ animationDelay: "80ms" }}
          className="flex animate-slide-up-fade flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-xl border border-outline px-4 py-3"
        >
          <div className="flex items-center gap-4">
            <WeekDays week={week} />
            <p className="flex flex-col">
              <span className="text-sm font-medium text-on-surface">
                <span className="font-mono tabular-nums">
                  {week.active}/{week.goal}
                </span>{" "}
                days
              </span>
              {streak > 0 ? (
                <span className="text-xs text-on-surface-muted">{streak}-week streak</span>
              ) : null}
            </p>
          </div>
          <LogStudy todayCounted={studyDays.has(today)} />
        </section>

        {plan.units.length > 0 ? (
          <section
            aria-labelledby="plan-units"
            style={{ animationDelay: "140ms" }}
            className="flex animate-slide-up-fade flex-col gap-3"
          >
            <div className="flex items-baseline justify-between gap-4 px-1">
              <h2 id="plan-units" className="text-base font-medium text-on-surface">
                Units
              </h2>
              <span className="text-sm text-on-surface-muted">
                <span className="font-mono text-xs tabular-nums">
                  {progress.secure}/{progress.total}
                </span>{" "}
                secure
              </span>
            </div>
            <ol className="flex flex-col divide-y divide-outline rounded-xl border border-outline">
              {plan.units.map((unit) => (
                <StudentUnit key={unit.id} unit={unit} today={today} isFocus={unit.id === focus?.id} />
              ))}
            </ol>
          </section>
        ) : (
          <p className="text-base text-on-surface-muted">Your tutor is still adding units.</p>
        )}
      </div>
    </div>
  )
}

/** Monday to Sunday, each day filled once it counts. Today carries the halo. */
function WeekDays({ week }: { week: WeekStatus }) {
  return (
    <ol className="flex items-center gap-1" aria-label="Study days this week">
      {week.days.map((d, i) => (
        <li
          key={d.day}
          className={cn(
            "flex size-7 items-center justify-center rounded-full text-xs font-medium",
            d.active
              ? "bg-on-surface text-surface"
              : d.isFuture
                ? "text-on-surface-muted/60"
                : "bg-surface-sunken text-on-surface-muted",
            d.isToday && "ring-4 ring-outline"
          )}
        >
          <span aria-hidden>{WEEKDAYS[i]!.short.charAt(0)}</span>
          <span className="sr-only">
            {formatDayLong(d.day)}: {d.active ? "studied" : d.isFuture ? "still to come" : "no study"}
          </span>
        </li>
      ))}
    </ol>
  )
}

function timeLeft(days: number): string {
  if (days < 14) return `${days} ${days === 1 ? "day" : "days"}`
  return `${Math.round(days / 7)} weeks`
}
