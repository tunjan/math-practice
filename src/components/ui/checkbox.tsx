"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cn } from "cn"
import { CheckIcon } from "lucide-react"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // 4px square, hairline edge. Checked flips to the ink fill — the same
        // white-on-near-black polarity as the primary pill.
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px]",
        "border border-hairline bg-canvas-soft transition-colors outline-none",
        // Widen the hit area on touch without widening the box.
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        "hover:border-white/30",
        "focus-visible:border-white/40 focus-visible:ring-2 focus-visible:ring-white/40",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "aria-invalid:border-destructive/60",
        "data-checked:border-white data-checked:bg-primary data-checked:text-primary-foreground",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
