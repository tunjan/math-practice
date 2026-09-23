import { cn } from "cn"

/**
 * DESIGN.md › Progress and Onboarding
 *
 * A segmented tick track: thin `outline` ticks, completed ticks in the
 * product accent. Purely visual; pair it with a mono percentage for the value.
 */
function TickProgress({
  value,
  ticks = 20,
  className,
  label,
}: {
  /** 0 to 100 */
  value: number
  ticks?: number
  className?: string
  /** Accessible name, e.g. "Progress". Omit when the value is stated beside it. */
  label?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const filled = Math.round((clamped / 100) * ticks)

  return (
    <div
      role={label ? "progressbar" : undefined}
      aria-label={label}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
      aria-valuenow={label ? clamped : undefined}
      aria-hidden={label ? undefined : true}
      className={cn("flex h-3 w-full items-stretch justify-between", className)}
    >
      {Array.from({ length: ticks }, (_, index) => (
        <span
          key={index}
          className={cn(
            "w-[3px] rounded-full transition-colors duration-200",
            index < filled ? "bg-accent-orange" : "bg-outline"
          )}
        />
      ))}
    </div>
  )
}

export { TickProgress }
