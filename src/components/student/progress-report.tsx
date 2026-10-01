"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { reportProgress } from "@/lib/student/actions"

/** Long enough to tap through a few exercises as one write. */
const SAVE_DELAY = 600

/**
 * The student's own count of exercises done, out of the tutor's total. The
 * buttons step by one; the figure can be typed into to jump. Changes settle
 * for a moment before saving, so a run of taps is one write.
 */
export function ProgressReport({
  assignmentId,
  done,
  total,
  save = reportProgress,
}: {
  assignmentId: string
  done: number
  total: number
  save?: (assignmentId: string, done: number) => Promise<{ error?: string }>
}) {
  const [count, setCount] = React.useState(done)
  const [draft, setDraft] = React.useState(String(done))
  const [seen, setSeen] = React.useState(done)
  const saved = React.useRef(done)
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  const pending = React.useRef<number | null>(null)
  const id = React.useId()

  // The board behind the dialog refreshes after a save; follow it.
  if (done !== seen) {
    setSeen(done)
    setCount(done)
    setDraft(String(done))
  }

  const commit = React.useCallback(
    async (next: number) => {
      if (next === saved.current) return
      const previous = saved.current
      saved.current = next
      const result = await save(assignmentId, next)
      if (result.error) {
        saved.current = previous
        setCount(previous)
        setDraft(String(previous))
        toast.error(result.error)
      }
    },
    [assignmentId, save]
  )

  // Closing the dialog mid-wait still saves.
  React.useEffect(
    () => () => {
      clearTimeout(timer.current)
      if (pending.current !== null) void commit(pending.current)
    },
    [commit]
  )

  const change = (next: number, delay = SAVE_DELAY) => {
    const clamped = Math.min(total, Math.max(0, next))
    setCount(clamped)
    setDraft(String(clamped))
    clearTimeout(timer.current)
    pending.current = clamped
    timer.current = setTimeout(() => {
      pending.current = null
      void commit(clamped)
    }, delay)
  }

  const typed = () => {
    const parsed = Number.parseInt(draft, 10)
    if (Number.isNaN(parsed)) setDraft(String(count))
    else change(parsed, 0)
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        Exercises done
      </label>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="One fewer done"
          disabled={count <= 0}
          onClick={() => change(count - 1)}
        >
          <Minus aria-hidden />
        </Button>
        <span className="flex items-baseline gap-1 font-mono text-sm text-foreground tabular-nums">
          <input
            id={id}
            inputMode="numeric"
            value={draft}
            onChange={(event) => setDraft(event.target.value.replace(/\D/g, "").slice(0, 3))}
            onBlur={typed}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                typed()
              }
            }}
            aria-describedby={`${id}-total`}
            style={{ width: `${Math.max(1, String(total).length)}ch` }}
            className="rounded-sm bg-transparent text-right outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          />
          <span id={`${id}-total`} className="text-muted-foreground">
            <span aria-hidden>/ </span>
            <span className="sr-only">of </span>
            {total}
          </span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="One more done"
          disabled={count >= total}
          onClick={() => change(count + 1)}
        >
          <Plus aria-hidden />
        </Button>
      </div>
    </div>
  )
}
