"use client"

import * as React from "react"

import { LOCALE } from "@/lib/assignments/dates"
import { clockDifference, deviceTimeZone, zoneCity } from "@/lib/timezone"

/** Now, after mount, ticking each minute; null on the server. */
function useMinute(): Date | null {
  const [now, setNow] = React.useState<Date | null>(null)
  React.useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    // Land on the next minute boundary, then every minute after it.
    let interval: number | undefined
    const first = window.setTimeout(() => {
      tick()
      interval = window.setInterval(tick, 60_000)
    }, 60_000 - (Date.now() % 60_000))
    return () => {
      window.clearTimeout(first)
      window.clearInterval(interval)
    }
  }, [])
  return now
}

/**
 * A student's clock as it reads right now: "14:32", with where they are and
 * how far that is from the tutor's own clock. The time is client-only, since a
 * server-rendered minute would already be stale on arrival.
 */
export function LocalTime({ timeZone }: { timeZone: string }) {
  const now = useMinute()
  const viewer = React.useSyncExternalStore(
    () => () => {},
    () => deviceTimeZone(),
    () => null
  )

  const time = now
    ? now.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit", timeZone })
    : "--:--"
  const diff = now && viewer ? clockDifference(timeZone, viewer, now) : null

  return (
    <span className="flex flex-col items-end">
      <time
        dateTime={now?.toISOString()}
        className="text-foreground tabular-nums"
        aria-label={`${time} in ${zoneCity(timeZone)}`}
      >
        {time}
      </time>
      <span className="text-sm text-muted-foreground">
        {zoneCity(timeZone)}
        {diff && diff !== "same time" ? ` · ${diff}` : ""}
      </span>
    </span>
  )
}
