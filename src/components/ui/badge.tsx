import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * DESIGN.md › Badges and Status Pills
 *
 * Semantic pills: pale container, same-hue ink, `mono-tag`, 4px radius. They
 * answer "what condition is this record in?" and nothing else.
 * Outline pills: transparent, `outline-strong` border, neutral ink, for states
 * where nothing is happening. Never mix the two idioms inside one column.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap select-none [&>svg]:size-3 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "rounded-xs bg-surface-sunken px-2 py-1 mono-tag text-on-surface-secondary",
        success: "rounded-xs bg-success-container px-2 py-1 mono-tag text-on-success-container",
        warning: "rounded-xs bg-warning-container px-2 py-1 mono-tag text-on-warning-container",
        error: "rounded-xs bg-error-container px-2 py-1 mono-tag text-on-error-container",
        info: "rounded-xs bg-info-container px-2 py-1 mono-tag text-on-info-container",
        violet: "rounded-xs bg-violet-container px-2 py-1 mono-tag text-on-violet-container",
        accent: "rounded-xs bg-accent-container px-2 py-1 mono-tag text-on-accent-container",
        outline:
          "rounded-sm border border-outline-strong px-2.5 py-1 label-sm text-on-surface-secondary",
        solid: "rounded-sm bg-primary px-2.5 py-1 label-sm text-on-primary",
        plan: "rounded-sm bg-highlight-container px-2 py-1 mono-tag text-on-highlight-container",
        /** Count chip beside a label, e.g. a filter or a group heading */
        count:
          "min-w-5 justify-center rounded-xs bg-surface-sunken px-1.5 py-0.5 mono-tag text-on-surface-muted",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

function Badge({
  className,
  variant = "neutral",
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

export { Badge, badgeVariants, type BadgeVariant }
