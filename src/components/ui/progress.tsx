import { useId } from "react"

import { cn } from "cn"

/**
 * DESIGN.md › progress bars are `rounded-full`.
 *
 * DESIGN.md › usage meter: a 4px neutral-200 track with a blue-500 fill and the figure in tabular figures: a
 * percentage, or "3/12" when `max` counts something. With a visible
 * label it stacks (label and figure above the bar); with `hideLabel` it sits
 * inline (bar, then figure) for rows and cards.
 */
function Progress({
  value,
  max,
  label,
  hideLabel = false,
  className,
}: {
  /** 0 to 100 (or to `max`), or null when there is nothing to show yet */
  value: number | null
  /** Out of how many, for a count rather than a percentage */
  max?: number
  /** Accessible name; also the visible caption unless `hideLabel` */
  label: string
  hideLabel?: boolean
  className?: string
}) {
  const labelId = useId()
  const count = value === null || max === undefined ? null : Math.max(0, Math.min(max, value))
  const pct =
    value === null
      ? null
      : count !== null && max
        ? (count / max) * 100
        : Math.round(Math.max(0, Math.min(100, value)))
  const text = pct === null ? null : count !== null ? `${count}/${max}` : `${pct}%`

  const caption = (
    <span id={labelId} className={hideLabel ? "sr-only" : "text-sm text-foreground/80"}>
      {label}
    </span>
  )

  const figure = (
    <span className="shrink-0 text-right text-xs text-muted-foreground tabular-nums">
      {text ?? "–"}
    </span>
  )

  const track = (
    <span className={cn("block h-1 overflow-hidden rounded-full bg-border", hideLabel && "min-w-0 flex-1")}>
      <span
        className={cn(
          "block h-full rounded-full bg-tertiary-strong transition-[width] duration-300 ease-out motion-reduce:transition-none",
          pct !== null && pct > 0 && "min-w-1.5"
        )}
        style={{ width: `${pct ?? 0}%` }}
      />
    </span>
  )

  return (
    <span
      role="progressbar"
      aria-labelledby={labelId}
      aria-valuemin={0}
      aria-valuemax={max ?? 100}
      aria-valuenow={count ?? pct ?? undefined}
      aria-valuetext={pct === null ? "No value yet" : count !== null ? `${count} of ${max}` : `${pct}%`}
      className={cn(hideLabel ? "flex items-center gap-2.5" : "flex flex-col gap-2", className)}
    >
      {hideLabel ? (
        <>
          {caption}
          {track}
          {figure}
        </>
      ) : (
        <>
          <span className="flex items-baseline justify-between gap-3">
            {caption}
            {figure}
          </span>
          {track}
        </>
      )}
    </span>
  )
}

export { Progress }
