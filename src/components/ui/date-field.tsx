"use client"

import * as React from "react"
import { CalendarDays, X } from "lucide-react"
import { cn } from "cn"

import { Calendar } from "@/components/ui/calendar"
import { fieldBase } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

/** `YYYY-MM-DD` → a local-midnight Date, or undefined for "" or a bad value. */
function parseDay(value: string | null | undefined): Date | undefined {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null
  if (!match) return undefined
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? undefined : date
}

/** A local Date → `YYYY-MM-DD`, the same string a native date input produces. */
function formatDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function displayDay(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

/**
 * The shadcn "Date Picker": a field-styled trigger that opens a Calendar in a
 * popover. A drop-in for `<Input type="date">`: it takes and returns the same
 * `YYYY-MM-DD` string ("" when empty), honours `min`/`max`, and posts with a
 * form through a hidden input when given a `name`.
 */
function DateField({
  value,
  onChange,
  min,
  max,
  name,
  id,
  placeholder = "Pick a date",
  clearable = false,
  variant = "default",
  mono = false,
  className,
  ...aria
}: {
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  name?: string
  id?: string
  placeholder?: string
  /** Shows a clear button in the popover. For optional dates. */
  clearable?: boolean
  variant?: "default" | "filled"
  mono?: boolean
  className?: string
  "aria-label"?: string
  "aria-invalid"?: boolean
  "aria-required"?: boolean
  "aria-describedby"?: string
}) {
  const [open, setOpen] = React.useState(false)
  const selected = parseDay(value)
  const from = parseDay(min)
  const to = parseDay(max)

  const disabled = [from ? { before: from } : null, to ? { after: to } : null].filter(
    (matcher) => matcher !== null
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <PopoverTrigger
        id={id}
        {...aria}
        className={cn(
          fieldBase,
          "flex h-10 items-center gap-2 px-3 text-left",
          mono ? "mono-data" : "body-md",
          variant === "default" && "border-outline-strong bg-surface",
          variant === "filled" && "border-transparent bg-surface-sunken focus-visible:bg-surface",
          "data-popup-open:border-on-surface data-popup-open:ring-3 data-popup-open:ring-on-surface/10",
          className
        )}
      >
        <CalendarDays aria-hidden className="size-4 shrink-0 text-on-surface-muted" />
        <span className={cn("min-w-0 flex-1 truncate", !selected && "text-on-surface-muted")}>
          {selected ? displayDay(selected) : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="dub w-auto">
        <Calendar
          mode="single"
          required
          selected={selected}
          defaultMonth={selected ?? from ?? to}
          startMonth={from}
          endMonth={to}
          disabled={disabled}
          onSelect={(date) => {
            onChange(formatDay(date))
            setOpen(false)
          }}
        />
        {clearable && value ? (
          <button
            type="button"
            onClick={() => {
              onChange("")
              setOpen(false)
            }}
            className="mt-1 flex h-8 items-center justify-center gap-1.5 rounded-md label-md text-on-surface-muted transition-colors hover:bg-surface-hover hover:text-on-surface"
          >
            <X aria-hidden className="size-3.5" /> Clear date
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

export { DateField, formatDay, parseDay }
