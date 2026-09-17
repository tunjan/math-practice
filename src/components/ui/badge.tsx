import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * The brand publishes no semantic colour palette, so badges are never coloured
 * fills. They are mono-caps labels inside a hairline pill; where a status needs
 * a colour cue it gets a 6px accent dot alongside (see <StatusDot />).
 */
const badgeVariants = cva(
  [
    "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5",
    "overflow-hidden rounded-full border px-2.5",
    "eyebrow-sm whitespace-nowrap transition-colors",
    "focus-visible:ring-2 focus-visible:ring-white/55",
    "[&>svg]:pointer-events-none [&>svg]:size-3!",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-hairline bg-transparent text-body",
        /** Higher-contrast outline for the one label that must be read first. */
        strong: "border-white/25 bg-transparent text-ink",
        /** The rare filled pill. Use for a single count or "NEW" marker. */
        solid: "border-white bg-primary text-primary-foreground",
        muted: "border-transparent bg-canvas-soft text-body-mid",
        destructive: "border-destructive/40 bg-transparent text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      { className: cn(badgeVariants({ variant }), className) },
      props
    ),
    render,
    state: { slot: "badge", variant },
  })
}

export { Badge, badgeVariants }
