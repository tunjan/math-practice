import { Check } from "lucide-react"
import { cn } from "cn"

import { STAGES, STAGE_LABEL, stageIndex, type Stage } from "@/lib/assignments/model"
import { LOCALE } from "@/lib/assignments/dates"

function stamp(value: string | null | undefined, timeZone?: string) {
  if (!value) return null
  return new Date(value).toLocaleString(LOCALE, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  })
}

function Node({ index, state }: { index: number; state: "past" | "current" | "future" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full",
        state === "past" && "bg-primary text-on-primary",
        state === "current" && "bg-primary text-on-primary ring-4 ring-outline",
        state === "future" && "border border-outline-strong bg-surface text-on-surface-muted"
      )}
    >
      {state === "past" ? (
        <Check className="size-3.5 [stroke-width:2.5]" />
      ) : (
        <span className="font-mono text-[11px] leading-none font-medium">{index + 1}</span>
      )}
    </span>
  )
}

/**
 * Assigned, Opened, Submitted, Reviewed. Step names are `label-caps`; marks are
 * near-black like every other data mark in the system.
 */
export function LifecycleTracker({
  stage,
  timestamps,
  orientation = "horizontal",
  timeZone,
}: {
  stage: Stage
  timestamps: Partial<Record<Stage, string | null>>
  orientation?: "horizontal" | "vertical"
  timeZone?: string
}) {
  const current = stageIndex(stage)
  const stateOf = (index: number) =>
    index < current ? "past" : index === current ? "current" : "future"

  if (orientation === "vertical") {
    return (
      <ol aria-label="Progress" className="flex flex-col">
        {STAGES.map((step, index) => {
          const state = stateOf(index)
          const at = stamp(timestamps[step], timeZone)
          return (
            <li
              key={step}
              aria-current={state === "current" ? "step" : undefined}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              {index < STAGES.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-6 bottom-0 left-[11px] w-0.5",
                    index < current ? "bg-primary" : "bg-outline"
                  )}
                />
              ) : null}
              <Node index={index} state={state} />
              <div className="flex min-w-0 flex-col gap-1 pt-1.5">
                <span
                  className={cn(
                    "label-caps",
                    state === "future" ? "text-on-surface-muted" : "text-on-surface"
                  )}
                >
                  {STAGE_LABEL[step]}
                </span>
                {at ? <span className="mono-data-sm text-on-surface-muted">{at}</span> : null}
              </div>
            </li>
          )
        })}
      </ol>
    )
  }

  // Sized by its container, not the viewport, so it also fits narrow cards.
  return (
    <div className="@container">
      <ol aria-label="Progress" className="grid grid-cols-1 gap-4 @lg:grid-cols-4 @lg:gap-0">
        {STAGES.map((step, index) => {
          const state = stateOf(index)
          const at = stamp(timestamps[step], timeZone)
          return (
            <li
              key={step}
              aria-current={state === "current" ? "step" : undefined}
              className="flex gap-3 @lg:flex-col"
            >
              <div className="flex items-center">
                <Node index={index} state={state} />
                {index < STAGES.length - 1 ? (
                  <span
                    aria-hidden
                    className={cn(
                      "mx-2 hidden h-0.5 flex-1 @lg:block",
                      index < current ? "bg-primary" : "bg-outline"
                    )}
                  />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-col gap-1 pt-1 @lg:pt-0 @lg:pr-4">
                <span
                  className={cn(
                    "label-caps",
                    state === "future" ? "text-on-surface-muted" : "text-on-surface"
                  )}
                >
                  {STAGE_LABEL[step]}
                </span>
                <span className="mono-data-sm text-on-surface-muted">
                  {at ?? (state === "future" ? "Not yet" : "")}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
