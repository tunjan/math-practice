"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { CheckIcon, MinusIcon } from "lucide-react"
import { cn } from "cn"

/**
 * DESIGN.md › Checkbox: 20px, 6px radius, a hairline border; checked turns
 * blue-500 with a white check (blue marks "selected", never decoration).
 */
function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md",
        "border border-border bg-background text-tertiary-foreground transition-colors outline-none",
        "after:absolute after:-inset-2.5",
        "hover:border-input",
        "focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-border",
        "aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-error-container",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        "data-checked:border-tertiary-strong data-checked:bg-tertiary-strong",
        "data-indeterminate:border-tertiary-strong data-indeterminate:bg-tertiary-strong",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center [&>svg]:size-3.5 [&>svg]:[stroke-width:2.5]"
      >
        {props.indeterminate ? <MinusIcon /> : <CheckIcon />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
