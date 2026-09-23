"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DUE_PRESETS,
  formatDue,
  fromDateTimeLocalValue,
  relativeToNow,
  resolvedTimeZone,
  toDateTimeLocalValue,
} from "@/lib/assignments/dates"

/**
 * A `datetime-local` input plus quick presets.
 *
 * The input is zone-less, so the value is interpreted in the browser's own
 * timezone and converted to an absolute ISO string on the way out. The zone is
 * named on screen rather than assumed: a tutor setting deadlines from a
 * different country should be able to see which clock they are setting.
 */
export function DuePicker({
  name,
  defaultValue,
}: {
  name: string
  /** Absolute ISO string. Defaults to tomorrow at 18:00 local. */
  defaultValue?: string
}) {
  const inputId = React.useId()

  // The local wall-clock value depends on the browser's timezone, so it is
  // only computed on the client; the server renders the field empty.
  const zone = React.useSyncExternalStore(
    () => () => {},
    () => resolvedTimeZone(),
    () => null
  )
  const hydrated = zone !== null

  const initialValue = React.useMemo(
    () =>
      hydrated
        ? toDateTimeLocalValue(
            defaultValue ? new Date(defaultValue) : DUE_PRESETS[0]!.resolve(new Date())
          )
        : "",
    [hydrated, defaultValue]
  )
  const [edited, setEdited] = React.useState<string | null>(null)
  const localValue = edited ?? initialValue
  const setLocalValue = setEdited

  const parsed = fromDateTimeLocalValue(localValue)

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId}>Due</Label>
      <input type="hidden" name={name} value={parsed ? parsed.toISOString() : ""} />

      <Input
        id={inputId}
        type="datetime-local"
        value={localValue}
        onChange={(event) => setLocalValue(event.target.value)}
        required
        mono
        className="sm:max-w-72"
      />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick deadlines">
        {DUE_PRESETS.map((preset) => (
          <Button
            key={preset.key}
            type="button"
            size="sm"
            onClick={() => setLocalValue(toDateTimeLocalValue(preset.resolve(new Date())))}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {parsed ? (
        <p className="body-sm text-on-surface-muted">
          <span className="mono-data-sm text-on-surface-secondary">
            {formatDue(parsed.toISOString())}
          </span>
          , {relativeToNow(parsed.toISOString())}
          {zone ? ` (${zone})` : ""}
        </p>
      ) : hydrated ? (
        <p className="body-sm text-error">Choose a date and time.</p>
      ) : null}
    </div>
  )
}
