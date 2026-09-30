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
