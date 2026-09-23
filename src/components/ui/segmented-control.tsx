"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "cn"

/**
 * DESIGN.md › segmented-control
 *
 * A `surface-sunken` track with the active segment raised to `surface`, held
 * at the 40px control height so it lines up with inputs beside it. Real radios
 * underneath, so arrow keys move between options and the value posts with the
 * form. The active segment also takes a hairline: white on `surface-sunken`
 * alone is too faint to read as selected.
 */
export function SegmentedControl<T extends string>({
  legend,
  name,
  value,
  onValueChange,
  options,
  hideLegend = false,
  className,
}: {
  legend: string
  name: string
  value: T
  onValueChange: (value: T) => void
  options: readonly { value: T; label: string; icon?: LucideIcon }[]
  /** For screen readers only, when the options already say what they are. */
  hideLegend?: boolean
  className?: string
}) {
  return (
    <fieldset className={cn("flex min-w-0 flex-col", className)}>
      <legend className={hideLegend ? "sr-only" : "mb-2 label-md text-on-surface-secondary"}>
        {legend}
      </legend>
      <div
        data-slot="segmented-control"
        className="grid h-10 gap-1 rounded-full bg-surface-sunken p-1"
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
                "flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-full border px-2 label-md",
                "transition-[background-color,border-color,color] duration-150",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-on-surface",
                checked
                  ? "border-outline-strong bg-surface text-on-surface"
                  : "border-transparent text-on-surface-muted hover:text-on-surface"
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
