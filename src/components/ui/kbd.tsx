import * as React from "react"
import { cn } from "cn"

/**
 * DESIGN.md › kbd
 *
 * 28px `surface-sunken` keycap with an `outline` border. Keyboard shortcuts are
 * shown this way on the surface they belong to, never hidden in a tooltip.
 */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-7 min-w-7 items-center justify-center rounded-sm border border-outline bg-surface-sunken px-1.5 font-sans label-sm text-on-surface-muted",
        className
      )}
      {...props}
    />
  )
}

export { Kbd }
