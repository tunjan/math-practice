import * as React from "react"
import Link from "next/link"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * The pill is the entire shape system (DESIGN-x.ai.md). Every interactive
 * element is `rounded-full` with a translucent-white edge — never a solid one.
 *
 * `default` is deliberately the OUTLINE pill, not a filled one: the brand uses
 * outline pills almost exclusively, so an un-styled <Button> lands on-brand.
 * `primary` is the rare white-filled pill — at most one per screen.
 */
const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-full border border-transparent bg-clip-padding",
    "font-sans text-sm leading-5 font-normal whitespace-nowrap",
    "transition-colors duration-150 outline-none select-none",
    "focus-visible:ring-2 focus-visible:ring-white/55 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
    "disabled:pointer-events-none disabled:opacity-40",
    "aria-invalid:border-destructive/60",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        /** The canonical white-outline pill. */
        default:
          "border-white/25 bg-transparent text-ink hover:bg-white/8 hover:border-white/40 aria-expanded:bg-white/8",
        /** Alias of `default` — shadcn components ship `variant="outline"`. */
        outline:
          "border-white/25 bg-transparent text-ink hover:bg-white/8 hover:border-white/40 aria-expanded:bg-white/8",
        /** The rare white-filled pill. One per screen, maximum. */
        primary:
          "border-white bg-primary text-primary-foreground hover:bg-white/88",
        /** A filled-but-quiet pill for dense toolbars. */
        secondary:
          "border-hairline bg-canvas-soft text-ink hover:bg-canvas-mid/60",
        /** No chrome until touched. */
        ghost:
          "border-transparent bg-transparent text-body hover:bg-canvas-soft hover:text-ink aria-expanded:bg-canvas-soft aria-expanded:text-ink",
        /** Danger is carried by text and edge only — never a filled surface. */
        destructive:
          "border-destructive/40 bg-transparent text-destructive hover:bg-destructive/10 hover:border-destructive/70",
        link: "border-transparent text-ink underline-offset-4 hover:underline",
      },
      size: {
        // Touch targets inflate below `sm` to clear WCAG 44x44 on mobile.
        default: "h-9 px-4 max-sm:h-11 max-sm:px-5",
        sm: "h-8 px-3 text-sm max-sm:h-10",
        lg: "h-11 px-6 text-base",
        icon: "size-9 p-0 max-sm:size-11",
        "icon-sm": "size-8 p-0 max-sm:size-10",
        "icon-lg": "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

/**
 * A navigation control wearing the button's chrome. Base UI warns when a
 * `<button>` renders as an anchor, so `nativeButton` is turned off here rather
 * than at every call site.
 */
function ButtonLink({
  className,
  variant = "default",
  size = "default",
  href,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "className"> &
  VariantProps<typeof buttonVariants> & { className?: string }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      nativeButton={false}
      render={<Link href={href} {...props} />}
      className={cn(buttonVariants({ variant, size, className }))}
    />
  )
}

export { Button, ButtonLink, buttonVariants }
