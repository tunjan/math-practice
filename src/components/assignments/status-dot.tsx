import { cn } from "cn"

import type { StatusTone } from "@/lib/assignments/model"

/**
 * DESIGN.md › Badges: a 6px filled circle stands in for a pill where a pill
 * would be too heavy. Filled with the strong ink of the same tone the pill's
 * container uses, so a dot and a pill for one state always match.
 */
export const TONE_DOT: Record<StatusTone, string> = {
  violet: "bg-violet",
  accent: "bg-accent-orange",
  info: "bg-info",
  warning: "bg-warning",
  success: "bg-success",
  error: "bg-error",
}

export function StatusDot({ tone, className }: { tone: StatusTone; className?: string }) {
  return <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[tone], className)} />
}
