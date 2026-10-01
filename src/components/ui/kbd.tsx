import * as React from "react"
import { cn } from "cn"

/**
 * DESIGN.md › kbd-on-secondary
 *
 * A 4px-radius neutral chip with 12px light figures. Keyboard shortcuts are
 * shown this way on the surface they belong to, never hidden in a tooltip.
 */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-border px-1.5 font-sans text-xs leading-none font-light text-muted-foreground select-none [&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    />
  )
}

export { Kbd }
