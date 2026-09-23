import * as React from "react"
import { cn } from "cn"

import { fieldBase } from "./input"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        fieldBase,
        "body-md field-sizing-content min-h-40 border-outline-strong bg-surface px-3 py-2.5",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
