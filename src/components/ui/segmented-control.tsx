"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "cn"

/**
 * DESIGN.md › segmented-control
 *
 * DESIGN.md › Toggle group: a white 12px track with a hairline and 4px padding;
 * the active segment is an 8px `muted/50` chip with its own hairline. Held at
 * the 40px control height so it lines up with inputs beside it. Real radios
 * underneath, so arrow keys move between options and the value posts with the
 * form.
 */
export function SegmentedControl<T extends string>({
  legend,
  name,
  value,
  onValueChange,
  options,
  hideLegend = false,
  size = "default",
  className,
}: {
  legend: string
  name: string
  value: T
  onValueChange: (value: T) => void
  options: readonly { value: T; label: string; icon?: LucideIcon }[]
  /** For screen readers only, when the options already say what they are. */
  hideLegend?: boolean
  /** `sm` is 32px, for controls that sit inside a list row. */
  size?: "default" | "sm"
  className?: string
}) {
  return (
    <fieldset className={cn("flex min-w-0 flex-col", className)}>
      <legend className={hideLegend ? "sr-only" : "mb-2 label-md text-foreground/80"}>
        {legend}
      </legend>
      <div
        data-slot="segmented-control"
        className={cn(
          "grid rounded-xl border border-border bg-background",
          size === "sm" ? "h-8 gap-0.5 p-0.5" : "h-10 gap-1 p-1"
        )}
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const Icon = option.icon
          const checked = value === option.value
          return (
            <label
              key={option.value}
              data-slot="segmented-control-item"
              data-checked={checked || undefined}
              className={cn(
                "flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3",
                size === "sm" ? "label-sm" : "label-md",
                "transition-[background-color,border-color,color] duration-150",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foreground/50",
                checked
                  ? "border-border bg-muted/50 text-foreground shadow-xs"
                  : "border-transparent text-foreground/80 hover:text-foreground"
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onValueChange(option.value)}
                className="sr-only"
              />
              {Icon ? <Icon className="hidden size-4 shrink-0 sm:block" aria-hidden /> : null}
              <span className="truncate">{option.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
