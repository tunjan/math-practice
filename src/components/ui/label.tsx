import * as React from "react"
import { cn } from "cn"

/** Labels sit above their control. `label-md`, secondary ink. */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 label-md text-foreground/80 select-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-45",
        className
      )}
      {...props}
    />
  )
}

/** Label, control, then helper or error text below it. */
function Field({
  label,
  htmlFor,
  hint,
  error,
  messageId,
  className,
  children,
}: {
  label: React.ReactNode
  htmlFor?: string
  hint?: React.ReactNode
  error?: React.ReactNode
  /** Id for the hint or error line, so the control can point `aria-describedby` at it. */
  messageId?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div data-slot="field" className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p id={messageId} className="body-md text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="body-md text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export { Field, Label }
