import * as React from "react"
import Link from "next/link"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * DESIGN.md › Buttons
 *
 * 8px radius, 1px border, 14px medium label. Black `primary` for the one action
 * that matters on a view; white `secondary` for everything beside it; `ghost`
 * for toolbar actions. Hover lifts a filled button onto a 4px hairline halo,
 * press sinks it a touch, release springs back (DESIGN.md › Motion).
 *
 * Red appears only on hover (`destructive`) or on the confirm step (`danger`).
 * The reds are one shade darker than Dub's red-500 so white text passes AA.
 */
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap select-none",
    "rounded-md border text-sm leading-5 font-medium outline-none",
    // Colour settles quickly; the halo and the press spring on Dub's curve.
    "transition-[color,background-color,border-color,text-decoration-color,box-shadow,scale] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
    "active:scale-[0.97] active:duration-75",
    "focus-visible:ring-4 focus-visible:ring-on-surface/15",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    // Disabled and loading share the quiet `bg-subtle` look and stay put.
    "data-disabled:scale-100 data-disabled:cursor-not-allowed data-disabled:shadow-none data-disabled:ring-0",
    "data-loading:cursor-progress",
    "motion-reduce:transition-none motion-reduce:active:scale-100",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "border-primary bg-primary text-on-primary shadow-xs",
          "hover:border-primary-hover hover:bg-primary-hover hover:ring-4 hover:ring-outline",
          "active:bg-primary-pressed",
          "data-disabled:border-outline data-disabled:bg-surface-sunken data-disabled:text-on-surface-muted",
        ],
        secondary: [
          "border-outline bg-surface text-on-surface shadow-xs",
          "hover:bg-surface-muted active:bg-surface-sunken",
          "data-popup-open:border-outline-strong data-popup-open:ring-4 data-popup-open:ring-outline",
          "data-disabled:bg-surface-sunken data-disabled:text-on-surface-muted",
        ],
        ghost: [
          "border-transparent bg-transparent text-on-surface-secondary",
          "hover:bg-surface-hover hover:text-on-surface active:bg-on-surface/10",
          "data-popup-open:bg-surface-hover data-popup-open:text-on-surface",
          "data-disabled:bg-transparent data-disabled:text-on-surface-muted",
        ],
        /** Dub's danger-outline: red ink at rest, a red fill once you mean it. */
        destructive: [
          "border-transparent bg-transparent text-error",
          "hover:border-[#dc2626] hover:bg-[#dc2626] hover:text-white active:border-[#b91c1c] active:bg-[#b91c1c]",
          "data-disabled:border-transparent data-disabled:bg-transparent data-disabled:text-on-surface-muted",
        ],
        /** The confirm step of a destructive action, never its trigger. */
        danger: [
          "border-[#dc2626] bg-[#dc2626] text-white shadow-xs",
          "hover:border-[#b91c1c] hover:bg-[#b91c1c] hover:ring-4 hover:ring-[#fee2e2]",
          "data-disabled:border-outline data-disabled:bg-surface-sunken data-disabled:text-on-surface-muted",
        ],
        /** Actions inside the floating `surface-inverse` bar */
        inverse: [
          "border-transparent bg-transparent text-on-surface-inverse",
          "hover:bg-white/10 active:bg-white/15",
          "data-disabled:bg-transparent data-disabled:text-on-surface-inverse/40",
        ],
        link: [
          "h-auto border-transparent p-0 text-on-surface underline decoration-outline-strong underline-offset-4",
          "hover:decoration-current active:scale-100",
          "data-disabled:text-on-surface-muted data-disabled:no-underline",
        ],
      },
      size: {
        default: "h-10 px-3",
        sm: "h-8 gap-1.5 px-3",
        icon: "size-9 p-0",
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

type ButtonProps = ButtonPrimitive.Props &
  ButtonVariants & {
    /** Swaps the leading icon for a spinner and holds focus while disabled. */
    loading?: boolean
    /** A keycap on the right edge, e.g. "N". Hidden below `md`. */
    shortcut?: React.ReactNode
  }

function Button({
  className,
  variant,
  size,
  loading = false,
  shortcut,
  disabled,
  focusableWhenDisabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant ?? "secondary"}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      focusableWhenDisabled={focusableWhenDisabled ?? loading}
      className={cn(
        buttonVariants({ variant, size }),
        // The spinner takes the leading icon's place so the width holds.
        loading && "[&>[data-spinner]+svg]:hidden",
        className
      )}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
      {shortcut ? <ButtonKbd tone={variant}>{shortcut}</ButtonKbd> : null}
    </ButtonPrimitive>
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

function Spinner() {
  return (
    <span data-spinner aria-hidden className="inline-flex animate-in duration-300 fade-in zoom-in-50">
      <svg viewBox="0 0 16 16" fill="none" className="animate-spin [animation-duration:700ms]">
        <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" />
        <path d="M14.25 8A6.25 6.25 0 0 0 8 1.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  )
}

/** Keycap inside a button: neutral-700 on black, neutral-200 on white. */
function ButtonKbd({ tone, children }: { tone: ButtonVariants["variant"]; children: React.ReactNode }) {
  const onFill = tone === "primary" || tone === "danger"
  return (
    <kbd
      aria-hidden
      className={cn(
        "-mr-1 hidden h-5 min-w-5 items-center justify-center rounded-xs px-1.5 font-sans text-xs leading-none font-light md:inline-flex",
        "transition-colors duration-200 group-data-disabled/button:bg-outline group-data-disabled/button:text-on-surface-muted",
        onFill ? "bg-white/20 text-white/70" : "bg-surface-sunken text-on-surface-muted"
      )}
    >
      {children}
    </kbd>
  )
}

export { Button, ButtonLink, buttonVariants, type ButtonProps, type ButtonVariants }
