import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

/**
 * DESIGN.md › input-field
 *
 * 40px, 6px radius, white with an `input` border; focus darkens the border
 * to `ring` inside a 4px `border` halo, red-tinted when invalid. The `filled` variant is the
 * read-only look: neutral-100, no border.
 */
const fieldBase = [
  "w-full min-w-0 rounded-md border text-foreground",
  "transition-[border-color,box-shadow,background-color] duration-150 outline-none",
  "placeholder:text-muted-foreground",
  "focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-border",
  "disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground",
  "aria-invalid:border-destructive aria-invalid:focus-visible:ring-error-container",
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
        mono ? "body-md tabular-nums" : "body-md",
        variant === "default" && "border-input bg-background",
        variant === "filled" &&
          "border-transparent bg-muted focus-visible:bg-background",
        className
      )}
      {...props}
    />
  )
}

export { Input, fieldBase }
