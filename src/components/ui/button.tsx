import * as React from "react"
import Link from "next/link"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * DESIGN.md › Buttons
 *
 * One filled `primary` per view. Secondary is white with an `outline-strong`
 * border; tertiary is ghost. A destructive action is never a coloured button:
 * it is a ghost button with `error` ink, confirmed by a dialog.
 */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md border label-md select-none",
    "transition-[background-color,border-color,color,transform] duration-150 ease-out",
    "active:not-disabled:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "border-primary bg-primary text-on-primary hover:border-primary-hover hover:bg-primary-hover active:bg-primary-pressed",
        secondary:
          "border-outline-strong bg-surface text-on-surface hover:bg-surface-sunken",
        ghost:
          "border-transparent bg-transparent text-on-surface-muted hover:bg-surface-sunken hover:text-on-surface",
        destructive:
          "border-transparent bg-transparent text-error hover:bg-error-container hover:text-on-error-container",
        /** The confirm step of a destructive action, never its trigger. */
        danger:
          "border-[#dc2626] bg-[#dc2626] text-white hover:border-[#b91c1c] hover:bg-[#b91c1c]",
        /** Actions inside the floating `surface-inverse` bar */
        inverse:
          "border-transparent bg-transparent text-on-surface-inverse hover:bg-primary-hover",
        link:
          "h-auto border-transparent p-0 text-on-surface underline decoration-outline-strong underline-offset-4 hover:decoration-on-surface",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3",
        icon: "size-9 border-outline bg-surface p-0 text-on-surface-secondary hover:bg-surface-sunken hover:text-on-surface",
        "icon-sm": "size-8 p-0",
      },
    },
    compoundVariants: [
      { variant: "link", size: "default", className: "h-auto px-0" },
      { variant: "link", size: "sm", className: "h-auto px-0" },
    ],
    defaultVariants: {
      variant: "secondary",
      size: "default",
    },
  }
)

type ButtonVariants = VariantProps<typeof buttonVariants>

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & ButtonVariants) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant ?? "secondary"}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function ButtonLink({
  className,
  variant,
  size,
  href,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "className"> &
  ButtonVariants & { className?: string }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      nativeButton={false}
      data-variant={variant ?? "secondary"}
      render={<Link href={href} {...props} />}
      className={cn(buttonVariants({ variant, size }), className)}
    />
  )
}

export { Button, ButtonLink, buttonVariants, type ButtonVariants }
