import * as React from "react"
import { cn } from "cn"

/**
 * DESIGN.md › Layout, Elevation
 *
 * A card is one continuous white surface with a 1px `outline` border and no
 * shadow, subdivided by hairlines rather than stacked sub-cards. Tables inside
 * run full-bleed to the card edges, so padding lives on the sections, not on
 * the card.
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-outline bg-surface text-on-surface",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({
  className,
  title,
  description,
  action,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-outline px-6 py-4",
        className
      )}
      {...props}
    >
      {title || description ? (
        <div className="flex min-w-0 flex-col gap-0.5">
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
      ) : null}
      {children}
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="card-title"
      className={cn("title-md text-on-surface", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("body-sm text-on-surface-muted", className)}
      {...props}
    />
  )
}

/** A padded region. Consecutive sections are separated by a hairline. */
function CardSection({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-section"
      className={cn("border-t border-outline p-6 first:border-t-0", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex flex-wrap items-center gap-3 border-t border-outline px-6 py-4",
        className
      )}
      {...props}
    />
  )
}

/**
 * KPI strip: stat cells divided by vertical rules inside one white card.
 * Two columns on small screens, one row from `lg`.
 */
function StatStrip({
  stats,
  className,
}: {
  stats: { label: string; value: React.ReactNode; note?: React.ReactNode }[]
  className?: string
}) {
  return (
    <Card className={cn("grid grid-cols-2 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none", className)}>
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={cn(
            "flex min-w-0 flex-col gap-3 p-6",
            index % 2 === 1 && "border-l border-outline",
            index >= 2 && "border-t border-outline lg:border-t-0",
            index > 0 && "lg:border-l"
          )}
        >
          <span className="label-caps text-on-surface-muted">{stat.label}</span>
          <span className="display-num text-on-surface">{stat.value}</span>
          {stat.note ? (
            <span className="body-sm text-on-surface-muted">{stat.note}</span>
          ) : null}
        </div>
      ))}
    </Card>
  )
}

/** Label / value pairs down a card, e.g. a record's details. */
function DetailList({
  items,
  className,
}: {
  items: { label: string; value: React.ReactNode }[]
  className?: string
}) {
  return (
    <dl className={cn("flex flex-col", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-baseline justify-between gap-4 border-t border-outline px-6 py-3 first:border-t-0"
        >
          <dt className="body-sm shrink-0 text-on-surface-muted">{item.label}</dt>
          <dd className="body-md min-w-0 text-right text-on-surface">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardSection,
  CardTitle,
  DetailList,
  StatStrip,
}
