import * as React from "react"

import { Eyebrow } from "@/components/brand/primitives"

/** ex-auth-form-card: canvas-soft surface, 8px radius, hairline edge. */
export function AuthCard({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-6 rounded-lg border border-hairline bg-canvas-soft p-6">
      <div className="flex flex-col gap-2">
        <Eyebrow size="sm">{eyebrow}</Eyebrow>
        <h1 className="display-sm text-ink">{title}</h1>
        {description ? (
          <p className="body-sm text-body-mid">{description}</p>
        ) : null}
      </div>

      {children}

      {footer ? (
        <div className="border-t border-hairline pt-4">{footer}</div>
      ) : null}
    </div>
  )
}
