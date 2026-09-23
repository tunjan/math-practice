"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { CheckIcon, MinusIcon } from "lucide-react"
import { cn } from "cn"

/**
 * Selection control. Checked state takes the product accent, which is the
 * one place besides the brand mark and progress fills that orange appears.
 */
function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-xs",
        "border border-outline-strong bg-surface text-on-primary transition-colors",
        "after:absolute after:-inset-3",
        "hover:border-on-surface-muted",
        "disabled:cursor-not-allowed disabled:opacity-45",
        "data-checked:border-accent-orange data-checked:bg-accent-orange",
        "data-indeterminate:border-accent-orange data-indeterminate:bg-accent-orange",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center [&>svg]:size-3 [&>svg]:[stroke-width:3]"
      >
        {props.indeterminate ? <MinusIcon /> : <CheckIcon />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
