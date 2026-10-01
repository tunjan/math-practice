import * as React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "cn"

/**
 * Layout building blocks shared by every screen. DESIGN.md › Layout: a 64px
 * page header (48px on phones) ruled off from the content, which sits in a
 * centred 1280px column with a 12px gutter, 24px from `lg`.
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

type PageWidth = "default" | "narrow" | "wide"

const PAGE_WIDTH: Record<PageWidth, string> = {
  default: "max-w-content",
  narrow: "max-w-4xl",
  wide: "max-w-wide",
}

function Page({
  className,
  width = "default",
  header,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  width?: PageWidth
  /** A `PageHeader`. It spans the canvas; its contents line up with the column. */
  header?: React.ReactNode
}) {
  return (
    <div
      data-slot="page"
      data-width={width}
      className="group/page flex flex-1 flex-col bg-surface"
      {...props}
    >
      {header}
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-6 px-3 pt-5 pb-12 lg:px-6",
          PAGE_WIDTH[width],
          className
        )}
      >
        {children}
      </div>
    </div>
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
 * The page header bar: the page's name on the left, its controls on the right,
 * the one black action last. On a detail page a back arrow leads the title.
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
    <header data-slot="page-header" className={cn("shrink-0 border-b border-outline", className)}>
      <div
        // Lines up with the column of the `Page` it heads.
        className="mx-auto flex h-12 w-full max-w-content items-center justify-between gap-4 px-3 group-data-[width=narrow]/page:max-w-4xl group-data-[width=wide]/page:max-w-wide sm:h-16 lg:px-6"
      >
        <div className="flex min-w-0 items-center gap-3">
          {back ? (
            <Link
              href={back.href}
              aria-label={`Back to ${back.label}`}
              className="-ml-1.5 flex size-8 shrink-0 items-center justify-center rounded-md text-on-surface-muted transition-colors hover:bg-surface-hover hover:text-on-surface"
            >
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
          ) : null}
          <h1 className="min-w-0 truncate text-lg leading-7 font-semibold text-on-surface">{title}</h1>
          {meta}
          {description ? (
            <p className="hidden min-w-0 truncate text-sm text-on-surface-muted lg:block">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}

/** 32px neutral circle that holds an icon on a card row. */
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
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-on-surface-secondary [&_svg]:size-4",
        className
      )}
    >
      {children}
    </span>
  )
}

/** Empty state: a 64px icon tile, a 16px title, a balanced line of help. */
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
        "flex flex-col items-center justify-center gap-4 px-4 py-12 text-center",
        className
      )}
    >
      {icon ? (
        <span
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-on-surface [&_svg]:size-6"
        >
          {icon}
        </span>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="title-md text-on-surface">{title}</p>
        {description ? (
          <p className="body-md max-w-sm text-balance text-on-surface-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  )
}

/** Round initial for a person. 32px, neutral-100. */
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
        "flex shrink-0 items-center justify-center rounded-full bg-surface-sunken label-sm text-on-surface-secondary",
        size === "default" ? "size-8" : "size-6",
        className
      )}
    >
      {initials}
    </span>
  )
}

export { Avatar, BackLink, BrandMark, EmptyState, IconTile, Page, PageHeader, Wordmark }
