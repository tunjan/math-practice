import * as React from "react"
import { cn } from "cn"

/**
 * ex-data-table-cell: mono-caps headers on canvas-soft, body-sm cells, hairline
 * row borders, no zebra striping (the brand carries structure on hairlines).
 */

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-hairline">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom border-collapse", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-canvas-soft", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={className} {...props} />
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-t border-hairline transition-colors first:border-t-0",
        "hover:bg-canvas-soft/60 data-[selected=true]:bg-canvas-soft",
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
        "eyebrow-sm px-4 py-3 text-left align-middle text-body-mid whitespace-nowrap",
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
      className={cn("body-sm px-4 py-3 align-middle text-body", className)}
      {...props}
    />
  )
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow }
