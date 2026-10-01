import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

/**
 * DESIGN.md › input-field
 *
 * 40px, 6px radius, white with an `outline-strong` border; focus darkens the
 * border inside a 4px halo (globals.css). The `filled` variant is the
 * read-only look: neutral-100, no border.
 */
const fieldBase = [
  "w-full min-w-0 rounded-sm border text-on-surface",
  "transition-[border-color,box-shadow,background-color] duration-150 outline-none",
  "placeholder:text-on-surface-muted",
  "focus-visible:border-on-surface-muted",
  "disabled:pointer-events-none disabled:bg-surface-sunken disabled:text-on-surface-muted",
  "aria-invalid:border-[#ef4444]",
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
