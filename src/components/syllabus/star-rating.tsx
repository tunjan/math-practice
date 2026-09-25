"use client"

import * as React from "react"
import { Star } from "lucide-react"
import { cn } from "cn"

/**
 * 0–5 stars, Airtable's rating field. Editable, it's a radio group: arrow keys
 * move, clicking the current rating clears it. Read-only, it's one labelled
 * image.
 */
export function StarRating({
  value,
  onValueChange,
  label = "Rating",
  className,
}: {
  value: number
  /** Omit for read-only. */
  onValueChange?: (value: number) => void
  label?: string
  className?: string
}) {
  const [hover, setHover] = React.useState<number | null>(null)
  const shown = hover ?? value

  if (!onValueChange) {
    return (
      <span role="img" aria-label={`${value} of 5`} className={cn("inline-flex items-center gap-px", className)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <StarGlyph key={n} filled={n <= value} />
        ))}
      </span>
    )
  }

  const move = (event: React.KeyboardEvent, next: number) => {
    event.preventDefault()
    const clamped = Math.max(0, Math.min(5, next))
    onValueChange(clamped)
    const group = event.currentTarget.parentElement
    group?.querySelector<HTMLButtonElement>(`[data-star="${Math.max(clamped, 1)}"]`)?.focus()
  }

  return (
    <span
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex items-center gap-px", className)}
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          data-star={n}
          aria-checked={value === n}
          aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
          tabIndex={n === Math.max(value, 1) ? 0 : -1}
          onMouseEnter={() => setHover(n)}
          onClick={() => onValueChange(value === n ? 0 : n)}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowUp") move(event, value + 1)
            else if (event.key === "ArrowLeft" || event.key === "ArrowDown") move(event, value - 1)
            else if (event.key === "Home" || event.key === "0") move(event, 0)
            else if (/^[1-5]$/.test(event.key)) move(event, Number(event.key))
          }}
          className="rounded-xs p-px outline-none focus-visible:ring-2 focus-visible:ring-on-surface/30"
        >
          <StarGlyph filled={n <= shown} preview={hover !== null} />
        </button>
      ))}
    </span>
  )
}

function StarGlyph({ filled, preview = false }: { filled: boolean; preview?: boolean }) {
  return (
    <Star
      aria-hidden
      className={cn(
        "size-3.5",
        filled
          ? cn("fill-amber-400 text-amber-400", preview && "fill-amber-300 text-amber-300")
          : "fill-transparent text-neutral-300"
      )}
    />
  )
}
