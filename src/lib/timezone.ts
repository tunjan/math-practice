/**
 * An IANA zone name the runtime recognises, or null. The value comes from the
 * browser, so it is checked before it is stored: a bad zone in a profile would
 * make every date on that person's screens throw.
 */
export function validTimeZone(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 64) return null
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: value }).resolvedOptions().timeZone
  } catch {
    return null
  }
}

/** The zone this device's clock is set to, or null where the runtime won't say. */
export function deviceTimeZone(): string | null {
  try {
    return validTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  } catch {
    return null
  }
}

/** Every zone the runtime knows, for a picker. */
export function allTimeZones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone")
  } catch {
    return ["UTC"]
  }
}

/**
 * The place a zone is named after, the way people say it: "Asia/Singapore" is
 * "Singapore", "America/Argentina/Buenos_Aires" is "Buenos Aires".
 */
export function zoneCity(timeZone: string): string {
  const last = timeZone.split("/").pop() ?? timeZone
  return last.replace(/_/g, " ")
}

/** How far the zone's clock is ahead of UTC at that moment, in minutes. */
export function zoneOffsetMinutes(timeZone: string, at: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value)
  const wall = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"))
  return Math.round((wall - Math.floor(at.getTime() / 60_000) * 60_000) / 60_000)
}

/** "GMT+8", "GMT-3:30", "GMT": the offset as clocks show it. */
export function zoneOffsetLabel(timeZone: string, at: Date = new Date()): string {
  const minutes = zoneOffsetMinutes(timeZone, at)
  if (minutes === 0) return "GMT"
  const sign = minutes > 0 ? "+" : "-"
  const h = Math.floor(Math.abs(minutes) / 60)
  const m = Math.abs(minutes) % 60
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`
}

/** Whether two zones read the same time at that moment, whatever they're called. */
export function sameClock(a: string, b: string, at: Date = new Date()): boolean {
  return a === b || zoneOffsetMinutes(a, at) === zoneOffsetMinutes(b, at)
}

/**
 * "7h ahead", "2h 30m behind", "same time": one zone's clock against another's,
 * from the point of view of whoever is reading.
 */
export function clockDifference(timeZone: string, from: string, at: Date = new Date()): string {
  const diff = zoneOffsetMinutes(timeZone, at) - zoneOffsetMinutes(from, at)
  if (diff === 0) return "same time"
  const h = Math.floor(Math.abs(diff) / 60)
  const m = Math.abs(diff) % 60
  const span = [h ? `${h}h` : "", m ? `${m}m` : ""].filter(Boolean).join(" ")
  return `${span} ${diff > 0 ? "ahead" : "behind"}`
}
