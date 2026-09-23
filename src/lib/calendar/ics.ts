/**
 * Minimal RFC 5545 generator.
 *
 * Hand-rolled rather than pulled from a package: the whole surface here is one
 * VEVENT shape, and the parts that actually matter — escaping, line folding,
 * UTC stamps — are a few lines each and worth having in plain sight.
 */

export type CalendarEvent = {
  /** Stable across regenerations, or subscribers will see duplicates. */
  uid: string
  start: Date
  /** Exclusive. For an all-day event, the day after the last day. */
  end: Date
  /** Dates rather than moments: the UTC calendar days of start and end. */
  allDay?: boolean
  summary: string
  description?: string
  url?: string
  /** Bumped when the event changes, so clients accept the update. */
  sequence?: number
  /** Minutes before `start` to alarm. Omit for no alarm. */
  alarmMinutesBefore?: number
}

/** RFC 5545 §3.3.5 — UTC, no punctuation. */
function toIcsStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

/** RFC 5545 §3.3.4 — a floating date, for all-day events. */
function toIcsDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "")
}

/**
 * RFC 5545 §3.3.11. Backslash first, or it would re-escape the escapes it just
 * introduced. Newlines become the literal two characters \n.
 */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")
}

/**
 * RFC 5545 §3.1: lines must not exceed 75 octets, and continuations begin with
 * a single space. Folding is counted in BYTES, not characters — a task title
 * with an em dash or an accent would otherwise produce over-long lines that
 * strict parsers reject.
 */
function foldLine(line: string): string {
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= 75) return line

  const out: string[] = []
  let current = ""
  let currentBytes = 0
  // A continuation line carries one leading space, so its budget is 74.
  let limit = 75

  for (const char of line) {
    const size = encoder.encode(char).length
    if (currentBytes + size > limit) {
      out.push(current)
      current = ""
      currentBytes = 0
      limit = 74
    }
    current += char
    currentBytes += size
  }
  if (current) out.push(current)

  return out.join("\r\n ")
}

export function buildCalendar({
  name,
  description,
  events,
}: {
  name: string
  description: string
  events: CalendarEvent[]
}): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Maths Tasks//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(name)}`,
    `X-WR-CALDESC:${escapeText(description)}`,
    // Hint to clients how often to poll. Deadlines do not move often.
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ]

  const stamp = toIcsStamp(new Date())

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${stamp}`,
      ...(event.allDay
        ? [
            `DTSTART;VALUE=DATE:${toIcsDate(event.start)}`,
            `DTEND;VALUE=DATE:${toIcsDate(event.end)}`,
          ]
        : [`DTSTART:${toIcsStamp(event.start)}`, `DTEND:${toIcsStamp(event.end)}`]),
      `SUMMARY:${escapeText(event.summary)}`
    )

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeText(event.description)}`)
    }
    if (event.url) {
      lines.push(`URL:${escapeText(event.url)}`)
    }
    if (typeof event.sequence === "number") {
      lines.push(`SEQUENCE:${event.sequence}`)
    }
    if (event.alarmMinutesBefore) {
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `TRIGGER:-PT${event.alarmMinutesBefore}M`,
        `DESCRIPTION:${escapeText(event.summary)}`,
        "END:VALARM"
      )
    }

    lines.push("END:VEVENT")
  }

  lines.push("END:VCALENDAR")

  // CRLF throughout, per the spec — some clients are strict about it.
  return lines.map(foldLine).join("\r\n") + "\r\n"
}
