"use client"

import * as React from "react"
import { toast } from "sonner"

import { reportProgress } from "@/lib/student/actions"

const STEP = 5

/**
 * The student's own report of how far along a task is. Dragging only moves the
 * figure; the value is saved when they let go, so a drag is one write.
 */
export function ProgressReport({
  assignmentId,
  value,
  save = reportProgress,
}: {
  assignmentId: string
  value: number
  save?: (assignmentId: string, pct: number) => Promise<{ error?: string }>
}) {
  const [pct, setPct] = React.useState(value)
  const [seen, setSeen] = React.useState(value)
  const saved = React.useRef(value)

  // The board behind the dialog refreshes after a save; follow it.
  if (value !== seen) {
    setSeen(value)
    setPct(value)
  }

  const commit = async () => {
    const next = Math.min(99, Math.max(1, pct))
    if (next === saved.current) return
    const previous = saved.current
    saved.current = next
    setPct(next)
    const result = await save(assignmentId, next)
    if (result.error) {
      saved.current = previous
      setPct(previous)
      toast.error(result.error)
    }
  }

  return (
    <div className="group flex items-center gap-3">
      <label htmlFor={`progress-${assignmentId}`} className="text-sm text-on-surface-muted">
        Progress
      </label>
      <input
        id={`progress-${assignmentId}`}
        type="range"
        min={0}
        max={100}
        step={STEP}
        value={pct}
        onChange={(event) => setPct(Number(event.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
        aria-valuetext={`${pct}% done`}
        style={{ "--fill": `${pct}%` } as React.CSSProperties}
        className={[
          "h-4 w-full max-w-48 cursor-pointer appearance-none bg-transparent focus-visible:outline-none",
          // Hairline track that fills with ink; the thumb only shows on hover or focus.
          "[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full",
          "[&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--color-on-surface,#222a35)_var(--fill),var(--color-outline,#e5e7eb)_var(--fill))]",
          "[&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-outline",
          "[&::-moz-range-progress]:h-1 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-on-surface",
          "[&::-webkit-slider-thumb]:-mt-[3px] [&::-webkit-slider-thumb]:size-2.5 [&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-on-surface [&::-webkit-slider-thumb]:opacity-0",
          "[&::-webkit-slider-thumb]:transition-opacity hover:[&::-webkit-slider-thumb]:opacity-100 focus-visible:[&::-webkit-slider-thumb]:opacity-100",
          "[&::-moz-range-thumb]:size-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-on-surface",
          "[&::-moz-range-thumb]:opacity-0 hover:[&::-moz-range-thumb]:opacity-100 focus-visible:[&::-moz-range-thumb]:opacity-100",
        ].join(" ")}
      />
      <span className="w-8 font-mono text-xs text-on-surface-muted tabular-nums">{pct}%</span>
    </div>
  )
}
