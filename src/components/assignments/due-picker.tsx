"use client"

import * as React from "react"
import { Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDue, relativeToNow } from "@/lib/assignments/dates"
import { DUE_PRESETS, instantOf, wallClockOf } from "@/lib/assignments/due"
import { deviceTimeZone, sameClock, zoneCity, zoneOffsetLabel } from "@/lib/timezone"

/**
 * A `datetime-local` input plus quick presets, on the student's clock.
 *
 * The input is zone-less, so its value is read in the student's zone and
 * converted to an absolute ISO string on the way out. The zone is named on
 * screen, and when the tutor's own clock reads differently the deadline is
 * shown on that too.
 */
export function DuePicker({
  name,
  defaultValue,
  student,
}: {
  name: string
  /** Absolute ISO string. Defaults to tomorrow at 18:00 on the deadline's clock. */
  defaultValue?: string
  /** Whose clock the deadline is on. Without one, the tutor's own. */
  student?: { name: string; timeZone: string } | null
}) {
  const inputId = React.useId()

  // The device's zone is only known on the client; the server renders the
  // field empty rather than guess.
  const viewerZone = React.useSyncExternalStore(
    () => () => {},
    () => deviceTimeZone() ?? "UTC",
    () => null
  )
  const zone = student?.timeZone ?? viewerZone
  const hydrated = viewerZone !== null

  const initialValue = React.useMemo(
    () =>
      zone && hydrated
        ? defaultValue
          ? wallClockOf(defaultValue, zone)
          : DUE_PRESETS[0]!.resolve(new Date(), zone)
        : "",
    [zone, hydrated, defaultValue]
  )
  const [edited, setEdited] = React.useState<string | null>(null)
  const wall = edited ?? initialValue

  const parsed = zone ? instantOf(wall, zone) : null
  const iso = parsed?.toISOString() ?? ""
  const showViewerClock =
    Boolean(iso && zone && viewerZone) && !sameClock(zone!, viewerZone!, parsed!)

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId}>
        Due{zone && student ? ` (${student.name}’s time, ${zoneCity(zone)})` : ""}
      </Label>
      <input type="hidden" name={name} value={iso} />

      <Input
        id={inputId}
        type="datetime-local"
        value={wall}
        onChange={(event) => setEdited(event.target.value)}
        required
        className="sm:max-w-72"
      />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick deadlines">
        {DUE_PRESETS.map((preset) => (
          <Button
            key={preset.key}
            type="button"
            size="sm"
            disabled={!zone}
            onClick={() => zone && setEdited(preset.resolve(new Date(), zone))}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {parsed && zone ? (
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p>
            <span className="text-xs tabular-nums text-foreground/80">{formatDue(iso, zone)}</span>,{" "}
            {relativeToNow(iso)} ({zoneCity(zone)}, {zoneOffsetLabel(zone, parsed)})
          </p>
          {showViewerClock ? (
            <p className="flex items-center gap-1.5">
              <Globe aria-hidden className="size-4 shrink-0" />
              For you that’s{" "}
              <span className="text-xs tabular-nums text-foreground/80">
                {formatDue(iso, viewerZone!)}
              </span>
            </p>
          ) : null}
        </div>
      ) : hydrated ? (
        <p className="body-md text-destructive">Choose a date and time.</p>
      ) : null}
    </div>
  )
}
