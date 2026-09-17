import * as React from "react"
import { cn } from "cn"

/**
 * Brand primitives that sit above shadcn/ui — the pieces DESIGN-x.ai.md names
 * as signature components but that have no shadcn equivalent.
 */

/** eyebrow-mono: the uppercase tracked Geist Mono label above every headline. */
function Eyebrow({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"p"> & { size?: "default" | "sm" }) {
  return (
    <p
      data-slot="eyebrow"
      className={cn(
        size === "sm" ? "eyebrow-sm" : "eyebrow",
        "text-body-mid",
        className
      )}
      {...props}
    />
  )
}

/**
 * The accent palette lives almost entirely in illustrations. A 6px dot is the
 * one place it is allowed into the interface chrome — it carries status without
 * turning a badge into a coloured fill.
 */
const DOT_ACCENTS = {
  ink: "bg-ink",
  mute: "bg-body-mid",
  sunset: "bg-sunset",
  sunsetSoft: "bg-sunset-soft",
  dusk: "bg-dusk",
  twilight: "bg-twilight",
  breeze: "bg-breeze",
  danger: "bg-destructive",
} as const

type DotAccent = keyof typeof DOT_ACCENTS

function StatusDot({
  accent = "mute",
  pulse = false,
  className,
  ...props
}: React.ComponentProps<"span"> & { accent?: DotAccent; pulse?: boolean }) {
  return (
    <span
      data-slot="status-dot"
      aria-hidden
      className={cn(
        "inline-block size-1.5 shrink-0 rounded-full",
        DOT_ACCENTS[accent],
        pulse && "motion-safe:animate-pulse",
        className
      )}
      {...props}
    />
  )
}

/** divider-hairline: the 1px rule between bands. */
function Rule({ className, ...props }: React.ComponentProps<"hr">) {
  return (
    <hr
      data-slot="rule"
      className={cn("border-0 border-t border-hairline", className)}
      {...props}
    />
  )
}

/** content-band: a full-bleed section on canvas with generous vertical air. */
function Band({
  className,
  ruled = false,
  ...props
}: React.ComponentProps<"section"> & { ruled?: boolean }) {
  return (
    <section
      data-slot="band"
      className={cn(
        "w-full bg-canvas px-6 py-12 md:px-6 md:py-16",
        ruled && "border-t border-hairline",
        className
      )}
      {...props}
    />
  )
}

/** Marketing content centres at ~1200px; app shells run a little wider. */
function Container({
  className,
  width = "default",
  ...props
}: React.ComponentProps<"div"> & { width?: "default" | "wide" | "narrow" }) {
  return (
    <div
      data-slot="container"
      className={cn(
        "mx-auto w-full",
        width === "narrow" && "max-w-2xl",
        width === "default" && "max-w-[1200px]",
        width === "wide" && "max-w-[1440px]",
        className
      )}
      {...props}
    />
  )
}

/** The standard page heading: mono eyebrow over a weight-400 display line. */
function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="flex flex-col gap-2">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="display-sm text-ink md:display-md">{title}</h1>
        {description ? (
          <p className="body-md max-w-2xl text-body-mid">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

/** ex-empty-state-card: canvas-soft frame, generous padding, quiet caption. */
function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-hairline bg-canvas-soft px-6 py-12 text-center",
        className
      )}
    >
      {icon ? <div className="text-body-mid">{icon}</div> : null}
      <p className="body-md text-ink">{title}</p>
      {description ? (
        <p className="body-sm max-w-sm text-body-mid">{description}</p>
      ) : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  )
}

export {
  Band,
  Container,
  EmptyState,
  Eyebrow,
  PageHeader,
  Rule,
  StatusDot,
  type DotAccent,
}
