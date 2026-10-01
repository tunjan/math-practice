import * as React from "react"
import Link from "next/link"

/** White, 16px radius, hairline border, no shadow. Footer below a rule. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="headline-md text-foreground">{title}</h1>
          {description ? (
            <p className="body-md text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children}
      </div>
      {footer ? (
        <div className="border-t border-border bg-muted px-6 py-4 body-md text-muted-foreground sm:px-8">
          {footer}
        </div>
      ) : null}
    </div>
  )
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="label-md text-foreground underline decoration-input underline-offset-4 transition-colors hover:decoration-foreground"
    >
      {children}
    </Link>
  )
}
