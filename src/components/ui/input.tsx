import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

// text-input (DESIGN-x.ai.md): canvas-soft fill, hairline edge, 8px radius,
// body-md at 12px/16px padding. Inputs are the one interactive element that is
// NOT a pill — the brand keeps them as 8px rectangles.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-lg border border-hairline bg-canvas-soft px-4 py-3",
        "font-sans text-base leading-6 font-normal text-ink",
        "transition-colors outline-none",
        "placeholder:text-body-mid",
        "file:inline-flex file:border-0 file:bg-transparent file:text-sm file:text-ink",
        "hover:border-white/20",
        "focus-visible:border-white/40 focus-visible:ring-2 focus-visible:ring-white/20",
        "disabled:pointer-events-none disabled:opacity-40",
        "aria-invalid:border-destructive/60",
        className
      )}
      {...props}
    />
  )
}

export { Input }
