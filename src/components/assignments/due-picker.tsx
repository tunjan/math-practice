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
 * named on screen rather than assumed — a tutor setting deadlines from a
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

  const [localValue, setLocalValue] = React.useState(() =>
    toDateTimeLocalValue(
      defaultValue ? new Date(defaultValue) : DUE_PRESETS[0]!.resolve(new Date())
    )
  )

  // Rendered after mount so server and client agree during hydration — the
  // server has no idea what timezone the viewer is in.
  const [zone, setZone] = React.useState<string | null>(null)
  React.useEffect(() => setZone(resolvedTimeZone()), [])

  const parsed = fromDateTimeLocalValue(localValue)

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={inputId} className="eyebrow-sm text-body-mid">
        Due
      </Label>

      <input
        type="hidden"
        name={name}
        value={parsed ? parsed.toISOString() : ""}
      />

      <Input
        id={inputId}
        type="datetime-local"
        value={localValue}
        onChange={(event) => setLocalValue(event.target.value)}
        required
        className="[color-scheme:dark]"
      />

      <div className="flex flex-wrap gap-2">
        {DUE_PRESETS.map((preset) => (
          <Button
            key={preset.key}
            type="button"
            size="sm"
            onClick={() =>
              setLocalValue(toDateTimeLocalValue(preset.resolve(new Date())))
            }
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {parsed ? (
        <p className="body-sm text-body-mid">
          {formatDue(parsed.toISOString())} · {relativeToNow(parsed.toISOString())}
          {zone ? ` · ${zone}` : ""}
        </p>
      ) : null}
    </div>
  )
}
