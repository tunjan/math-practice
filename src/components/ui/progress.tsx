import { useId } from "react"

import { cn } from "cn"

/**
 * DESIGN.md › progress bars are `rounded-full`.
 *
 * A hairline track with a solid ink fill and the figure in mono. With a visible
 * label it stacks (label and figure above the bar); with `hideLabel` it sits
 * inline (bar, then figure) for rows and cards.
 */
function Progress({
  value,
  label,
  hideLabel = false,
  className,
}: {
  /** 0 to 100, or null when there is nothing to show yet */
  value: number | null
  /** Accessible name; also the visible caption unless `hideLabel` */
  label: string
  hideLabel?: boolean
  className?: string
}) {
  const labelId = useId()
  const pct = value === null ? null : Math.round(Math.max(0, Math.min(100, value)))

  const caption = (
    <span id={labelId} className={hideLabel ? "sr-only" : "text-sm text-on-surface-secondary"}>
      {label}
    </span>
  )

  const figure = (
    <span className="shrink-0 text-right font-mono text-xs text-on-surface-muted tabular-nums">
      {pct === null ? "–" : `${pct}%`}
    </span>
  )

  const track = (
    <span className={cn("block h-1.5 overflow-hidden rounded-full bg-outline", hideLabel && "min-w-0 flex-1")}>
      <span
        className={cn(
          "block h-full rounded-full bg-on-surface transition-[width] duration-300 ease-out motion-reduce:transition-none",
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
      aria-valuemax={100}
      aria-valuenow={pct ?? undefined}
      aria-valuetext={pct === null ? "No value yet" : `${pct}%`}
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
