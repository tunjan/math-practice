"use client"

import * as React from "react"
import Link from "next/link"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { MathProse } from "@/components/assignments/math-prose"
import { Badge } from "@/components/ui/badge"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { formatDayShort, type DayKey } from "@/lib/calendar/dates"
import { setConfidence } from "@/lib/plans/actions"
import {
  CONFIDENCE_LABEL,
  MASTERY,
  TIMING,
  unitSelfProgress,
  unitTiming,
  type Confidence,
  type Objective,
  type Unit,
} from "@/lib/plans/model"

const CONFIDENCE_OPTIONS = ([0, 1, 2] as const).map((c) => ({
  value: String(c) as "0" | "1" | "2",
  label: CONFIDENCE_LABEL[c],
}))

/**
 * One unit on the student's timeline. The node on the rail says where it
 * stands (secure, current, still to come); opening it shows the objectives to
 * rate, the tutor's note and the tasks set for it.
 */
export function StudentUnit({
  unit,
  today,
  isFocus,
  isLast,
}: {
  unit: Unit
  today: DayKey
  isFocus: boolean
  isLast: boolean
}) {
  const [expanded, setExpanded] = React.useState(isFocus)
  const panelId = React.useId()
  const timing = unitTiming(unit, today)
  const flag = timing === "due_soon" || timing === "overdue" ? TIMING[timing] : null
  const self = unitSelfProgress(unit.objectives)
  const secure = unit.mastery === "secure"

  return (
    <li className="relative flex gap-4">
      {/* The rail: a node per unit, joined by a hairline. */}
      <div aria-hidden className="relative flex w-6 shrink-0 justify-center">
        {!isLast ? <span className="absolute top-7 bottom-0 w-px bg-outline" /> : null}
        <span
          className={cn(
            "relative mt-1.5 flex size-5 items-center justify-center rounded-full border",
            secure
              ? "border-accent-orange bg-accent-orange text-white"
              : isFocus
                ? "border-on-surface bg-surface ring-4 ring-on-surface/10"
                : "border-outline-strong bg-surface"
          )}
        >
          {secure ? <Check className="size-3" strokeWidth={3} /> : null}
        </span>
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col", isLast ? "pb-0" : "pb-8")}>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((open) => !open)}
          className="group/unit -mx-2 -my-1 flex min-w-0 items-start gap-3 rounded-lg px-2 py-1 text-left transition-colors hover:bg-surface-sunken"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={cn("text-base font-medium", timing === "upcoming" ? "text-on-surface-secondary" : "text-on-surface")}>
                {unit.title}
              </span>
              {flag ? <Badge variant={flag.tone}>{flag.label}</Badge> : null}
              {unit.mastery !== "not_started" ? (
                <Badge variant={MASTERY[unit.mastery].tone}>{MASTERY[unit.mastery].label}</Badge>
              ) : null}
            </span>
            <span className="text-sm text-on-surface-muted">
              <span className="font-mono text-xs">
                {formatDayShort(unit.startsOn)} – {formatDayShort(unit.dueOn)}
              </span>
              {unit.topic ? ` · ${unit.topic.name}` : null}
            </span>
          </span>
          {self !== null ? (
            <span className="mt-0.5 font-mono text-xs text-on-surface-muted">
              {self}%<span className="sr-only"> confident</span>
            </span>
          ) : null}
          <ChevronDown
            aria-hidden
            className={cn(
              "mt-0.5 size-4 shrink-0 text-on-surface-muted transition-transform duration-150",
              expanded && "rotate-180"
            )}
          />
        </button>

        {expanded ? (
          <div id={panelId} className="flex flex-col gap-5 pt-4">
            {unit.masteryNote ? (
              <figure className="rounded-lg bg-surface-sunken px-4 py-3">
                <figcaption className="text-xs font-medium text-on-surface-muted">Your tutor</figcaption>
                <p className="mt-1 text-sm text-pretty text-on-surface">{unit.masteryNote}</p>
              </figure>
            ) : null}

            {unit.description ? (
              <div className="text-sm">
                <MathProse>{unit.description}</MathProse>
              </div>
            ) : null}

            {unit.objectives.length > 0 ? (
              <ul className="flex flex-col divide-y divide-outline rounded-lg border border-outline">
                {unit.objectives.map((objective) => (
                  <ObjectiveCheck key={objective.id} objective={objective} />
                ))}
              </ul>
            ) : null}

            {unit.tasks.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {unit.tasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-4">
                    <Link
                      href={`/student?task=${task.id}`}
                      className="truncate text-sm text-on-surface underline decoration-outline-strong underline-offset-4 hover:decoration-on-surface"
                    >
                      {task.title}
                    </Link>
                    <Badge variant={task.status.tone}>{task.status.label}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  )
}

/** One objective and the student's confidence on it, saved as soon as it is picked. */
function ObjectiveCheck({ objective }: { objective: Objective }) {
  const saved = objective.checkedAt ? (String(objective.confidence) as "0" | "1" | "2") : ""
  const [value, setOptimistic] = React.useOptimistic<"0" | "1" | "2" | "">(saved)
  const [, startTransition] = React.useTransition()

  function pick(next: "0" | "1" | "2" | "") {
    if (next === "") return
    startTransition(async () => {
      setOptimistic(next)
      const result = await setConfidence(objective.id, Number(next) as Confidence)
      if (result.error) toast.error(result.error)
    })
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-pretty text-on-surface">{objective.statement}</span>
      <SegmentedControl
        legend={objective.statement}
        hideLegend
        size="sm"
        name={`confidence-${objective.id}`}
        value={value}
        onValueChange={pick}
        options={CONFIDENCE_OPTIONS}
        className="w-full shrink-0 sm:w-80"
      />
    </li>
  )
}
