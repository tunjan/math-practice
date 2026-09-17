"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "cn"
import { Container } from "@/components/brand/primitives"

export type NavItem = { href: string; label: string }

/**
 * nav-bar: canvas background, hairline underneath, body-sm links. The active
 * item is marked with a white underline rather than a filled pill — the brand
 * keeps fills for buttons.
 */
export function WorkspaceNav({
  items,
  action,
}: {
  items: NavItem[]
  action?: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/95 backdrop-blur-sm">
      <Container width="wide" className="px-6">
        <div className="flex h-14 items-center justify-between gap-6">
          <div className="flex items-center gap-8 overflow-x-auto">
            <Link
              href={items[0]?.href ?? "/"}
              className="display-xs shrink-0 text-ink transition-opacity hover:opacity-70"
            >
              Maths Tasks
            </Link>

            <nav className="flex items-center gap-1">
              {items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative rounded-full px-3 py-1.5 body-sm whitespace-nowrap transition-colors",
                      active
                        ? "text-ink"
                        : "text-body-mid hover:bg-canvas-soft hover:text-ink"
                    )}
                  >
                    {item.label}
                    {active ? (
                      <span
                        aria-hidden
                        className="absolute inset-x-3 -bottom-px h-px bg-ink"
                      />
                    ) : null}
                  </Link>
                )
              })}
            </nav>
          </div>

          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </Container>
    </header>
  )
}
