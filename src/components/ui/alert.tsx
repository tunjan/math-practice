import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * shadcn/ui Alert, restyled to DESIGN.md › Feedback: a pale semantic
 * container with its paired ink, 6px radius, no border. A leading icon, when
 * given, takes a 16px column and the text lines up beside it.
 */
const alertVariants = cva(
  [
    "group/alert relative grid w-full items-start gap-x-2.5 gap-y-1 rounded-md px-3 py-2.5 body-sm",
    "has-[>svg]:grid-cols-[--spacing(4)_1fr] [&>svg]:mt-px [&>svg]:size-4 [&>svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        error: "bg-error-container text-on-error-container",
        success: "bg-success-container text-on-success-container",
        warning: "bg-warning-container text-on-warning-container",
        info: "bg-info-container text-on-info-container",
      },
    },
    defaultVariants: {
      variant: "error",
    },
  }
)

function Alert({
  className,
  variant,
  role = "alert",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      role={role}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-medium group-has-[>svg]/alert:col-start-2", className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "min-w-0 group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertDescription, AlertTitle }
