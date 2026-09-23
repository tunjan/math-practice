import * as React from "react"
import { cn } from "cn"

/**
 * DESIGN.md › Tables
 *
 * Full-bleed to the card edges. Header: `surface-sunken`, `label-caps`.
 * Body: 56px rows, `outline` dividers, `surface-sunken` hover, no zebra.
 * The outer cells line up with the card header's 24px inset.
 */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn("w-full border-collapse text-left", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("border-b border-outline bg-surface-sunken", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&>tr:last-child]:border-b-0", className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "group/row h-14 border-b border-outline bg-surface transition-colors duration-100",
        "hover:bg-surface-sunken data-[selected=true]:bg-surface-sunken",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-4 text-left align-middle label-caps whitespace-nowrap text-on-surface-muted first:pl-6 last:pr-6",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-2 align-middle body-md text-on-surface first:pl-6 last:pr-6",
        className
      )}
      {...props}
    />
  )
}

/** Two-line identity cell: primary line in ink, secondary line muted. */
function TableIdentity({
  primary,
  secondary,
  leading,
  className,
}: {
  primary: React.ReactNode
  secondary?: React.ReactNode
  leading?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      {leading}
      <div className="flex min-w-0 flex-col">
        <span className="truncate body-md text-on-surface">{primary}</span>
        {secondary ? (
          <span className="truncate body-sm text-on-surface-muted">{secondary}</span>
        ) : null}
      </div>
    </div>
  )
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableIdentity, TableRow }
