"use client"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * shadcn/ui Toggle, restyled to DESIGN.md.
 *
 * `chips`: 32px, 6px radius; the pressed chip sinks to `surface-sunken`.
 * `track`: a segment inside the white track (see ToggleGroup); the pressed
 * one is an 8px `surface-muted` chip with its own hairline.
 */
const toggleVariants = cva(
  [
    "group/toggle inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap outline-none",
    "transition-colors duration-100",
    "focus-visible:ring-2 focus-visible:ring-on-surface/25",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        chips: [
          "h-8 rounded-md px-2.5 text-sm text-on-surface-muted",
          "hover:bg-surface-hover hover:text-on-surface",
          "data-pressed:bg-surface-sunken data-pressed:font-medium data-pressed:text-on-surface",
        ],
        track: [
          "h-full rounded-md border border-transparent px-3 label-md text-on-surface-muted",
          "hover:text-on-surface",
          "data-pressed:border-outline data-pressed:bg-surface-muted data-pressed:text-on-surface",
        ],
      },
    },
    defaultVariants: {
      variant: "chips",
    },
  }
)

function Toggle({
  className,
  variant,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
