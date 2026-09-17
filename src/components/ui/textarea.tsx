import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-lg border border-hairline bg-canvas-soft px-4 py-3",
        "font-sans text-base leading-6 font-normal text-ink",
        "transition-colors outline-none",
        "placeholder:text-body-mid",
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

export { Textarea }
