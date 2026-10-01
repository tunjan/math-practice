"use client"

import * as React from "react"
import { CalendarDays, X } from "lucide-react"
import { cn } from "cn"

import { Calendar } from "@/components/ui/calendar"
import { chipClass } from "@/components/ui/chip"
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
  format,
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
  /** `chip` is the 32px composer chip, for dialogs that lay properties in a row. */
  variant?: "default" | "filled" | "chip"
  mono?: boolean
  /** Text for the chosen day, when the default "5 Oct 2026" is too long. */
  format?: (value: string) => string
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
          variant === "chip"
            ? [chipClass, "gap-1.5 text-left"]
            : [
                "flex h-10 items-center gap-2 px-3 text-left",
                mono ? "body-md tabular-nums" : "body-md",
                variant === "default" && "border-input bg-background",
                variant === "filled" && "border-transparent bg-muted focus-visible:bg-background",
                "data-popup-open:border-foreground data-popup-open:ring-3 data-popup-open:ring-foreground/10",
              ],
          className
        )}
      >
        <CalendarDays aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <span className={cn("min-w-0 flex-1 truncate", !selected && "text-muted-foreground")}>
          {selected ? (format ? format(value) : displayDay(selected)) : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto">
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
            className="mt-1 flex h-8 items-center justify-center gap-1.5 rounded-lg label-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X aria-hidden className="size-3.5" /> Clear date
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

export { DateField, formatDay, parseDay }
