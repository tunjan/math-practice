"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight, Check, ChevronDown } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { MathProse } from "@/components/assignments/math-prose"
import type { StatusTone } from "@/lib/assignments/model"
import { formatDayShort, type DayKey } from "@/lib/calendar/dates"
import { setConfidence } from "@/lib/plans/actions"
import {
  CONFIDENCE_LABEL,
  MASTERY,
  TIMING,
  unitSelfProgress,
  unitTiming,
  type Confidence,
  type Mastery,
  type Objective,
  type Unit,
} from "@/lib/plans/model"

const CONFIDENCE_LEVELS = [0, 1, 2] as const satisfies readonly Confidence[]

/**
 * One unit in the plan's list. The mark on the left is the tutor's rating,
 * the ring on the right the student's own confidence. Opening it shows what
 * to rate and the tasks set for it.
 */
export function StudentUnit({ unit, today, isFocus }: { unit: Unit; today: DayKey; isFocus: boolean }) {
  const [expanded, setExpanded] = React.useState(isFocus)
  const panelId = React.useId()
  const timing = unitTiming(unit, today)
  const flag = timing === "due_soon" || timing === "overdue" ? TIMING[timing] : null
  const self = unit.objectives.some((o) => o.checkedAt) ? unitSelfProgress(unit.objectives) : null
  const hasDetail =
    Boolean(unit.description || unit.masteryNote) || unit.objectives.length > 0 || unit.tasks.length > 0

  return (
    <li className="group/row">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        disabled={!hasDetail}
        onClick={() => setExpanded((open) => !open)}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-100 group-first/row:rounded-t-xl enabled:hover:bg-surface-muted",
          !expanded && "group-last/row:rounded-b-xl"
        )}
      >
        <MasteryMark mastery={unit.mastery} current={isFocus} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn(
              "truncate text-sm font-medium",
              timing === "upcoming" ? "text-on-surface-muted" : "text-on-surface"
            )}
          >
            {unit.title}
          </span>
          <span className="truncate text-xs text-on-surface-muted">
            <span className="font-mono">
              {formatDayShort(unit.startsOn)} – {formatDayShort(unit.dueOn)}
            </span>
            {unit.topic ? ` · ${unit.topic.name}` : null}
          </span>
        </span>
        {flag ? <Pill tone={flag.tone}>{flag.label}</Pill> : null}
        {self !== null ? <ConfidenceRing value={self} /> : null}
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-on-surface-muted transition-transform duration-150",
            expanded && "rotate-180",
            !hasDetail && "invisible"
          )}
        />
      </button>

      {expanded && hasDetail ? (
        <div id={panelId} className="flex flex-col gap-5 pt-1 pr-4 pb-5 pl-12">
          {unit.description ? (
            <div className="text-sm text-pretty text-on-surface-secondary">
              <MathProse>{unit.description}</MathProse>
            </div>
          ) : null}

          {unit.masteryNote ? (
            <blockquote className="border-l-2 border-outline pl-3">
              <p className="text-xs text-on-surface-muted">
                Your tutor
                {unit.mastery !== "not_started" ? ` · ${MASTERY[unit.mastery].label}` : null}
              </p>
              <div className="mt-0.5 text-sm text-pretty text-on-surface">
                <MathProse>{unit.masteryNote}</MathProse>
              </div>
            </blockquote>
          ) : null}

          {unit.objectives.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {unit.objectives.map((objective) => (
                <ObjectiveCheck key={objective.id} objective={objective} />
              ))}
            </ul>
          ) : null}

          {unit.tasks.length > 0 ? (
            <ul className="-mx-2 flex flex-col">
              {unit.tasks.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/student?task=${task.id}`}
                    className="group/task flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-100 hover:bg-surface-muted"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-on-surface">{task.title}</span>
                    <Pill tone={task.status.tone}>{task.status.label}</Pill>
                    <ArrowUpRight
                      aria-hidden
                      className="size-4 shrink-0 text-on-surface-muted transition-colors group-hover/task:text-on-surface"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

/**
 * The tutor's rating as a mark: empty, half, or filled with a tick. An
 * unrated unit you are on now gets a heavier outline.
 */
function MasteryMark({ mastery, current }: { mastery: Mastery; current: boolean }) {
  return (
    <span
      className={cn(
        "relative flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full border",
        mastery === "not_started" ? "border-outline-strong" : "border-on-surface",
        mastery === "secure" && "bg-on-surface text-surface",
        current && mastery === "not_started" && "border-2 border-on-surface"
      )}
    >
      {mastery === "developing" ? <span aria-hidden className="absolute inset-y-0 left-0 w-1/2 bg-on-surface" /> : null}
      {mastery === "secure" ? <Check aria-hidden className="size-3" strokeWidth={3} /> : null}
      <span className="sr-only">
        {mastery === "not_started" ? "Not rated yet" : `Rated ${MASTERY[mastery].label.toLowerCase()}`}
        {current ? ", current unit" : null}
      </span>
    </span>
  )
}

/** The student's confidence across the unit's objectives, as a small ring. */
function ConfidenceRing({ value }: { value: number }) {
  const r = 7
  const c = 2 * Math.PI * r
  return (
    <span className="flex shrink-0 items-center gap-1.5" title="Your confidence">
      <svg viewBox="0 0 18 18" className="size-4 -rotate-90" aria-hidden>
        <circle cx="9" cy="9" r={r} fill="none" strokeWidth="2" className="stroke-outline" />
        <circle
          cx="9"
          cy="9"
          r={r}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className={cn(
            "stroke-on-surface transition-[stroke-dashoffset] duration-300 motion-reduce:transition-none",
            value === 0 && "hidden"
          )}
        />
      </svg>
      <span className="w-8 font-mono text-xs text-on-surface-muted tabular-nums">
        {value}%<span className="sr-only"> confident</span>
      </span>
    </span>
  )
}

/** One objective and the student's confidence on it, saved as soon as it is picked. */
function ObjectiveCheck({ objective }: { objective: Objective }) {
  const saved = objective.checkedAt ? objective.confidence : null
  const [value, setOptimistic] = React.useOptimistic<Confidence | null>(saved)
  const [, startTransition] = React.useTransition()

  function pick(next: Confidence) {
    startTransition(async () => {
      setOptimistic(next)
      const result = await setConfidence(objective.id, next)
      if (result.error) toast.error(result.error)
    })
  }

  return (
    <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <span className="text-sm text-pretty text-on-surface">{objective.statement}</span>
      <fieldset className="flex shrink-0 gap-1">
        <legend className="sr-only">{objective.statement}</legend>
        {CONFIDENCE_LEVELS.map((level) => (
          <label
            key={level}
            className={cn(
              "flex h-7 cursor-pointer items-center rounded-lg px-2.5 text-xs font-medium whitespace-nowrap transition-colors duration-100 has-focus-visible:shadow-[0_0_0_4px_rgb(0_0_0/0.2)]",
              value === level
                ? "bg-on-surface text-surface"
                : "text-on-surface-muted hover:bg-surface-sunken hover:text-on-surface"
            )}
          >
            <input
              type="radio"
              name={`confidence-${objective.id}`}
              value={level}
              checked={value === level}
              onChange={() => pick(level)}
              className="sr-only"
            />
            {CONFIDENCE_LABEL[level]}
          </label>
        ))}
      </fieldset>
    </li>
  )
}

/** A status in Dub's badge shape: sentence case on its tinted container. */
function Pill({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-px text-xs font-medium whitespace-nowrap",
        PILL[tone] ?? "bg-surface-sunken text-on-surface-secondary"
      )}
    >
      {children}
    </span>
  )
}

const PILL: Partial<Record<StatusTone, string>> = {
  success: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
  error: "bg-error-container text-on-error-container",
  info: "bg-info-container text-on-info-container",
  violet: "bg-violet-container text-on-violet-container",
  accent: "bg-accent-container text-on-accent-container",
}
