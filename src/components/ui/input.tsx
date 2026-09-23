import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

/**
 * DESIGN.md › input-field
 *
 * 40px, 8px radius, white with an `outline-strong` border. The `filled`
 * variant is the recessed search field: `surface-sunken`, no border.
 */
const fieldBase = [
  "w-full min-w-0 rounded-md border text-on-surface",
  "transition-[border-color,box-shadow,background-color] duration-150 outline-none",
  "placeholder:text-on-surface-muted",
  "focus-visible:border-on-surface focus-visible:ring-3 focus-visible:ring-on-surface/10",
  "disabled:pointer-events-none disabled:bg-surface-sunken disabled:text-on-surface-muted",
  "aria-invalid:border-error aria-invalid:ring-3 aria-invalid:ring-error/15",
].join(" ")

function Input({
  className,
  variant = "default",
  mono = false,
  ...props
}: React.ComponentProps<"input"> & {
  variant?: "default" | "filled"
  /** For machine values: links, codes, dates. */
  mono?: boolean
}) {
  return (
    <InputPrimitive
      data-slot="input"
      className={cn(
        fieldBase,
        "h-10 px-3",
        mono ? "mono-data" : "body-md",
        variant === "default" && "border-outline-strong bg-surface",
        variant === "filled" &&
          "border-transparent bg-surface-sunken focus-visible:bg-surface",
        className
      )}
      {...props}
    />
  )
}

export { Input, fieldBase }
