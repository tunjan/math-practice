"use client"

import * as React from "react"
import { isOverdue } from "@/lib/assignments/dates"

/**
 * Lateness, said quietly next to the action it conditions. Handing in is
 * still allowed, so it reads as a note, not a warning.
 *
 * Mounted whenever the student can still act, and watches the clock itself,
 * so a dialog left open across the deadline turns late on its own instead of
 * staying at whatever the server rendered.
 */
export function LateNotice({ dueAt }: { dueAt: string }) {
  const [overdue, setOverdue] = React.useState(() => isOverdue(dueAt))

  React.useEffect(() => {
    if (overdue) return
    const id = setInterval(() => {
      if (isOverdue(dueAt)) setOverdue(true)
    }, 30_000)
    return () => clearInterval(id)
  }, [overdue, dueAt])

  if (!overdue) return null

  // A quiet line, not a banner: the header already shows how late it is in
  // red, so this only says what handing in now means.
  return (
    <p role="status" className="flex items-center gap-2 text-xs text-on-surface-muted">
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-error" />
      Past the deadline. You can still hand in; it will be marked late.
    </p>
  )
}
