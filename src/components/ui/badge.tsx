import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * DESIGN.md › Tags
 *
 * Every tag is an Airtable single-select pill: a fully rounded pale fill, the
 * shared near-black ink, 12px regular text. The colour names the option; the
 * semantic names (success, warning…) are the status tones mapped onto it.
 * `outline`, `solid` and `count` are not tags and keep their own shapes.
 */
const TAG = "h-5 max-w-full rounded-full px-2 text-xs leading-none font-normal text-on-tag [&>span]:truncate"

const TAG_COLORS = {
  gray: "bg-tag-gray",
  blue: "bg-tag-blue",
  cyan: "bg-tag-cyan",
  teal: "bg-tag-teal",
  green: "bg-tag-green",
  yellow: "bg-tag-yellow",
  orange: "bg-tag-orange",
  red: "bg-tag-red",
  pink: "bg-tag-pink",
  purple: "bg-tag-purple",
} as const

type TagColor = keyof typeof TAG_COLORS

const TAG_COLOR_NAMES = Object.keys(TAG_COLORS) as TagColor[]

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap select-none [&>svg]:size-3 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        ...Object.fromEntries(TAG_COLOR_NAMES.map((c) => [c, cn(TAG, TAG_COLORS[c])])) as Record<TagColor, string>,
        neutral: cn(TAG, TAG_COLORS.gray),
        success: cn(TAG, TAG_COLORS.green),
        warning: cn(TAG, TAG_COLORS.yellow),
        error: cn(TAG, TAG_COLORS.red),
        info: cn(TAG, TAG_COLORS.blue),
        violet: cn(TAG, TAG_COLORS.purple),
        accent: cn(TAG, TAG_COLORS.orange),
        outline:
          "rounded-sm border border-outline-strong px-2.5 py-1 label-sm text-on-surface-secondary",
        solid: "rounded-sm bg-primary px-2.5 py-1 label-sm text-on-primary",
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

/**
 * A stable colour for a free-text option (a category name), so the same
 * option is the same colour everywhere, as in Airtable. Gray is left for
 * "nothing set".
 */
function tagColorFor(name: string): TagColor {
  const palette = TAG_COLOR_NAMES.filter((c) => c !== "gray")
  let hash = 0
  for (const ch of name.trim().toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return palette[hash % palette.length]!
}

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

export { Badge, badgeVariants, TAG_COLORS, tagColorFor, type BadgeVariant, type TagColor }
