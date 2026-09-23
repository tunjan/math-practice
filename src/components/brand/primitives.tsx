import * as React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "cn"

/**
 * Layout building blocks shared by every screen. DESIGN.md › Layout: content
 * is capped at 1280px with a 32px page margin (16px on phones), and the only
 * thing typed directly on the canvas is the page heading.
 */

function BrandMark(_props: { className?: string }) {
  return null
}

function Wordmark({ href, className }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center rounded-md text-on-surface transition-opacity hover:opacity-80",
        className
      )}
    >
      <span className="title-md tracking-[-0.01em]">Maths Tasks</span>
    </Link>
  )
}

function Page({
  className,
  width = "default",
  ...props
}: React.ComponentProps<"div"> & { width?: "default" | "narrow" | "wide" }) {
  return (
    <div
      data-slot="page"
      className={cn(
        "mx-auto flex w-full flex-col gap-6 px-4 py-6 md:px-8 md:py-8",
        width === "default" && "max-w-content",
        width === "narrow" && "max-w-4xl",
        width === "wide" && "max-w-wide",
        className
      )}
      {...props}
    />
  )
}

/** "← Tasks": the way back up, typed on the canvas above a page. */
function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-1.5 rounded-md label-md text-on-surface-secondary transition-colors hover:text-on-surface"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </Link>
  )
}

/**
 * The page heading. It sits on the canvas, so supporting text uses the
 * secondary ink for comfortable contrast rather than the muted ink.
 */
function PageHeader({
  title,
  description,
  actions,
  back,
  meta,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  back?: { href: string; label: string }
  /** Sits beside the title, e.g. a status pill. */
  meta?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn("flex flex-col gap-3", className)}>
      {back ? <BackLink {...back} /> : null}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="headline-lg min-w-0 text-on-surface">{title}</h1>
            {meta}
          </div>
          {description ? (
            <p className="body-md max-w-[70ch] text-on-surface-secondary">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  )
}

/** 40px bordered square that holds an icon on a card row. */
function IconTile({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-md border border-outline bg-surface text-on-surface-secondary [&_svg]:size-5",
        className
      )}
    >
      {children}
    </span>
  )
}

/** Empty state for the inside of a card. */
function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className
      )}
    >
      {icon ? <IconTile>{icon}</IconTile> : null}
      <div className="flex flex-col gap-1">
        <p className="title-md text-on-surface">{title}</p>
        {description ? (
          <p className="body-sm max-w-sm text-on-surface-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  )
}

/** Round initial for a person. 36px, `surface-muted`. */
function Avatar({
  name,
  size = "default",
  className,
}: {
  name: string
  size?: "default" | "sm"
  className?: string
}) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-surface-muted label-sm text-on-surface-secondary",
        size === "default" ? "size-9" : "size-7",
        className
      )}
    >
      {initials}
    </span>
  )
}

export { Avatar, BackLink, BrandMark, EmptyState, IconTile, Page, PageHeader, Wordmark }
