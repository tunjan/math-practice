"use client"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * shadcn/ui Toggle, restyled to DESIGN.md.
 *
 * `chips`: 32px, 8px radius; the pressed chip sinks to `muted`.
 * `track`: a segment inside the white track (see ToggleGroup); the pressed
 * one is an 8px `muted/50` chip with its own hairline (DESIGN.md › Toggle group).
 */
const toggleVariants = cva(
  [
    "group/toggle inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap outline-none",
    "transition-colors duration-100",
    "focus-visible:ring-2 focus-visible:ring-foreground/50",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        chips: [
          "h-8 rounded-lg px-2.5 text-sm text-muted-foreground",
          "hover:bg-accent hover:text-foreground",
          "data-pressed:bg-muted data-pressed:font-medium data-pressed:text-foreground",
        ],
        track: [
          "h-full rounded-lg border border-transparent px-3 label-md text-muted-foreground",
          "hover:text-foreground",
          "data-pressed:border-border data-pressed:bg-muted/50 data-pressed:text-foreground data-pressed:shadow-xs",
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
