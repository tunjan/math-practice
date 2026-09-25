import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * shadcn Empty (base), restyled to DESIGN.md tokens: a centred block for
 * "nothing here yet", with an optional icon tile, a title, a line of help and
 * an action. `outline` draws the dashed frame used where a list would be.
 */
const emptyVariants = cva(
  "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 text-center text-balance",
  {
    variants: {
      variant: {
        default: "px-6 py-10",
        outline: "rounded-lg border border-dashed border-outline-strong px-6 py-12",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Empty({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyVariants>) {
  return <div data-slot="empty" className={cn(emptyVariants({ variant }), className)} {...props} />
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="empty-header" className={cn("flex max-w-sm flex-col items-center gap-2", className)} {...props} />
  )
}

const emptyMediaVariants = cva(
  "mb-1 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        /** The 40px bordered tile the rest of the app puts icons in. */
        icon: "size-10 rounded-md border border-outline bg-surface text-on-surface-secondary [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      aria-hidden
      className={cn(emptyMediaVariants({ variant }), className)}
      {...props}
    />
  )
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="empty-title" className={cn("title-md text-on-surface", className)} {...props} />
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-description"
      className={cn(
        "body-sm text-on-surface-muted [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-on-surface",
        className
      )}
      {...props}
    />
  )
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn("flex w-full max-w-sm min-w-0 flex-col items-center gap-3 text-balance", className)}
      {...props}
    />
  )
}

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle }
