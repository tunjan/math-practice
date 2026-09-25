"use client"

import * as React from "react"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { type VariantProps } from "class-variance-authority"
import { cn } from "cn"

import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({
  variant: "chips",
})

/**
 * shadcn/ui ToggleGroup on Base UI: one tab stop, arrow keys move between
 * items. `track` wraps the items in a `surface-sunken` pill track.
 */
function ToggleGroup({
  className,
  variant = "chips",
  children,
  ...props
}: ToggleGroupPrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      className={cn(
        "flex w-fit items-center",
        variant === "chips" && "flex-wrap gap-1",
        variant === "track" &&
          "h-9 max-w-full gap-0.5 overflow-x-auto rounded-full bg-surface-sunken p-1 [scrollbar-width:none]",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant }}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  )
}

function ToggleGroupItem({
  className,
  children,
  ...props
}: TogglePrimitive.Props) {
  const { variant } = React.useContext(ToggleGroupContext)

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(toggleVariants({ variant }), className)}
      {...props}
    >
      {children}
    </TogglePrimitive>
  )
}

export { ToggleGroup, ToggleGroupItem }
