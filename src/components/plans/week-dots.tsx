import { cn } from "cn"

import { formatDayLong, WEEKDAYS } from "@/lib/calendar/dates"
import type { WeekStatus } from "@/lib/plans/streak"

/**
 * This week, Monday to Sunday: a filled dot for each study day. Orange is the
 * progress colour; future days are hollow so the week reads as time passing.
 */
export function WeekDots({ week, className }: { week: WeekStatus; className?: string }) {
  return (
    <ol className={cn("flex items-center gap-1.5", className)} aria-label="Study days this week">
      {week.days.map((d, i) => (
        <li key={d.day} className="flex flex-col items-center gap-1">
          <span
            className={cn(
              "size-3 rounded-full border",
              d.active
                ? "border-accent-orange bg-accent-orange"
                : d.isFuture
                  ? "border-dashed border-outline-strong"
                  : "border-outline-strong bg-surface-sunken",
              d.isToday && "ring-2 ring-on-surface/15 ring-offset-1"
            )}
            aria-hidden
          />
          <span className="mono-data-sm text-on-surface-muted" aria-hidden>
            {WEEKDAYS[i]!.short.charAt(0)}
          </span>
          <span className="sr-only">
            {formatDayLong(d.day)}: {d.active ? "studied" : d.isFuture ? "still to come" : "no study"}
          </span>
        </li>
      ))}
    </ol>
  )
}
