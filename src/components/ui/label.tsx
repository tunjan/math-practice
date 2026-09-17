"use client"

import * as React from "react"
import { cn } from "cn"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        // Weight 400: the brand never bolds, not even a form label.
        "flex items-center gap-2 body-sm text-body select-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-40",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-40",
        className
      )}
      {...props}
    />
  )
}

export { Label }
