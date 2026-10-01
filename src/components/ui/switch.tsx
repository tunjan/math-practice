"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "cn"

/**
 * DESIGN.md › Switch: a 16×32 track, neutral-200 off and blue-500 on, with a
 * white thumb. `sm` is the 12×24 version for dense rows.
 */
function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent p-px transition-colors outline-none",
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        "data-[size=default]:h-4 data-[size=default]:w-8 data-[size=sm]:h-3 data-[size=sm]:w-6",
        "focus-visible:ring-4 focus-visible:ring-border",
        "aria-invalid:ring-4 aria-invalid:ring-error-container",
        "data-checked:bg-tertiary-strong data-unchecked:bg-border",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-white shadow-xs transition-transform duration-150 ease-(--ease-dub) group-data-[size=default]/switch:size-3.5 group-data-[size=sm]/switch:size-2.5 data-unchecked:translate-x-0 group-data-[size=default]/switch:data-checked:translate-x-4 group-data-[size=sm]/switch:data-checked:translate-x-3"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
