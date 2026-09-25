import Papa from "papaparse"

import { isDayKey } from "@/lib/calendar/dates"

import { STATUS_LABEL, STATUSES, type TopicProgress, type TopicStatus, type TrackerRow } from "./model"

/**
 * The tracker as a spreadsheet: one row per subtopic, in syllabus order.
 * Status is its stored value (to_see, in_progress, seen) and dates are
 * YYYY-MM-DD, so a file can go out to Sheets or an LLM and come back in
 * unchanged. `code`, `title` and `level` identify the row; the rest is the
 * tutor's.
 */
export const CSV_COLUMNS = [
  "code",
  "title",
  "level",
  "status",
  "stars",
  "planned_start",
  "planned_end",
  "notes",
] as const

export type CsvColumn = (typeof CSV_COLUMNS)[number]

export function trackerToCsv(rows: TrackerRow[]): string {
  return Papa.unparse(
    {
      fields: [...CSV_COLUMNS],
      data: rows.map((row) => [
        row.code,
        row.title,
        row.level,
        row.progress.status,
        row.progress.stars,
        row.progress.plannedStart ?? "",
        row.progress.plannedEnd ?? "",
        row.progress.notes ?? "",
      ]),
    },
    // Quote everything so CSV readers keep codes like 1.10 as text. Sheets
    // and Excel still turn them into 1.1 on open, which is why the import
    // falls back to the title when code and title disagree.
    { quotes: true, newline: "\r\n" }
  )
}

/** "syllabus-ana-garcia-aa-hl-2026-09-25.csv" */
export function csvFilename(name: string, course: string, day: string): string {
  const slug = `${name} ${course}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `syllabus-${slug || "student"}-${day}.csv`
}

// ── Import ──────────────────────────────────────────────────────────────────

/** One subtopic whose progress the file changes. */
export type CsvChange = {
  topicId: string
  code: string
  title: string
  before: TopicProgress
  after: TopicProgress
  /** The fields that differ, in column order. */
  fields: (keyof TopicProgress)[]
}

export type CsvIssue = { row: number | null; message: string }

export type CsvImport = {
  /** Anything here rejects the file. */
  issues: CsvIssue[]
  /** Worth saying, but the file still applies. */
  warnings: string[]
  changes: CsvChange[]
  rows: number
}

const FIELD_ORDER: (keyof TopicProgress)[] = ["status", "stars", "plannedStart", "plannedEnd", "notes"]

/** Past this, the database refuses the window (0020). */
const MAX_WINDOW_DAYS = 366

function readStatus(value: string): TopicStatus | null {
  const v = value.trim().toLowerCase().replace(/[\s-]+/g, "_")
  const byValue = STATUSES.find((s) => s === v)
  if (byValue) return byValue
  return STATUSES.find((s) => STATUS_LABEL[s].toLowerCase().replace(/\s+/g, "_") === v) ?? null
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000)
}

/**
 * Reads a tracker CSV against a student's subtopics and works out what would
 * change. Nothing is written: any issue rejects the whole file, so it's fixed
 * and re-checked rather than half applied.
 *
 * Rows are matched by `code`. Spreadsheets turn 1.10 into 1.1, so when a
 * row's title names a different subtopic exactly, the title wins. A missing
 * column leaves that field alone; a blank cell leaves status and stars alone
 * and clears dates and notes, which is how an export writes "not set". Row
 * numbers are spreadsheet rows: the header is row 1.
 */
export function parseTrackerCsv(text: string, rows: TrackerRow[]): CsvImport {
  // LLMs wrap CSV in a ```csv fence even when asked not to.
  const body = text.trim().replace(/^```[\w-]*\s*\n/, "").replace(/\n\s*```\s*$/, "")
  const parsed = Papa.parse<Record<string, string>>(body, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, "_"),
  })

  const issues: CsvIssue[] = []
  const columns = new Set(parsed.meta.fields ?? [])
  if (!columns.has("code")) {
    return {
      issues: [{ row: 1, message: "The header row needs a code column." }],
      warnings: [],
      changes: [],
      rows: 0,
    }
  }
  const warnings: string[] = []
  const unknown = [...columns].filter((c) => c && !(CSV_COLUMNS as readonly string[]).includes(c))
  if (unknown.length) {
    warnings.push(`Ignoring column${unknown.length > 1 ? "s" : ""} ${unknown.join(", ")}.`)
  }
  for (const error of parsed.errors) {
    // Papa counts data rows from 0; the header is spreadsheet row 1.
    issues.push({ row: error.row === undefined ? null : error.row + 2, message: error.message })
  }

  const byCode = new Map(rows.map((r) => [r.code, r]))
  const byTitle = new Map(rows.map((r) => [r.title.trim().toLowerCase(), r]))
  const seen = new Map<string, number>()
  const changes: CsvChange[] = []

  parsed.data.forEach((record, index) => {
    const line = index + 2
    const cell = (column: CsvColumn) => (columns.has(column) ? (record[column] ?? "").trim() : undefined)

    const code = cell("code") ?? ""
    const title = cell("title")
    const titled = title ? byTitle.get(title.toLowerCase()) : undefined
    let topic = byCode.get(code)
    if (titled && titled !== topic) topic = titled
    if (!topic) {
      issues.push({
        row: line,
        message: code ? `${code} isn't a subtopic of this student's course.` : "The code is empty.",
      })
      return
    }
    const first = seen.get(topic.id)
    if (first) {
      issues.push({ row: line, message: `${topic.code} is already on row ${first}.` })
      return
    }
    seen.set(topic.id, line)

    const after: TopicProgress = { ...topic.progress }
    const problems: string[] = []

    const status = cell("status")
    if (status) {
      const value = readStatus(status)
      if (value) after.status = value
      else problems.push(`status "${status}" isn't one of ${STATUSES.join(", ")}`)
    }

    const stars = cell("stars")
    if (stars) {
      const value = Number(stars)
      if (Number.isInteger(value) && value >= 0 && value <= 5) after.stars = value
      else problems.push(`stars "${stars}" isn't a whole number from 0 to 5`)
    }

    for (const [column, key] of [
      ["planned_start", "plannedStart"],
      ["planned_end", "plannedEnd"],
    ] as const) {
      const value = cell(column)
      if (value === undefined) continue
      if (value === "") after[key] = null
      else if (isDayKey(value)) after[key] = value
      else problems.push(`${column} "${value}" isn't a date like 2026-10-05`)
    }
    if (after.plannedStart && after.plannedEnd) {
      if (after.plannedStart > after.plannedEnd) problems.push("planned_end is before planned_start")
      else if (daysBetween(after.plannedStart, after.plannedEnd) > MAX_WINDOW_DAYS) problems.push("the plan is longer than a year")
    }

    const notes = cell("notes")
    if (notes !== undefined) {
      if (notes.length > 2000) problems.push("notes are longer than 2,000 characters")
      else after.notes = notes || null
    }

    if (problems.length) {
      issues.push({ row: line, message: `${topic.code}: ${problems.join("; ")}.` })
      return
    }

    const fields = FIELD_ORDER.filter((key) => after[key] !== topic.progress[key])
    if (fields.length) {
      changes.push({ topicId: topic.id, code: topic.code, title: topic.title, before: topic.progress, after, fields })
    }
  })

  return { issues, warnings, changes: issues.length ? [] : changes, rows: parsed.data.length }
}

// ── LLM prompt ──────────────────────────────────────────────────────────────

/**
 * A prompt that asks an LLM to plan the tracker and answer with a CSV that
 * Import accepts as is: the schema, the rules the import checks, the window
 * and the student's current tracker (which lists every code they study).
 */
export function llmPlanPrompt({
  courseName,
  from,
  to,
  rows,
}: {
  /** "Maths AA HL" */
  courseName: string
  from: string
  to: string
  rows: TrackerRow[]
}): string {
  const open = rows.filter((row) => row.progress.status !== "seen").length
  return `You are helping an IB Diploma mathematics tutor plan the syllabus for one student taking ${courseName}.

Schedule the ${open} subtopics below that are not yet "seen" between ${from} and ${to}.

Reply with the CSV only: no commentary, no code fences.

Rules the import checks (a file that breaks one is rejected):
- The header row is exactly: ${CSV_COLUMNS.join(",")}
- One row per subtopic listed below, with the same code. Don't add, drop or repeat codes.
- Keep code, title and level exactly as given.
- status is one of: to_see, in_progress, seen. stars is a whole number from 0 to 5. Keep both as given.
- planned_start and planned_end are dates written YYYY-MM-DD, with planned_start on or before planned_end.
- notes are optional and under 2000 characters. Keep existing notes unless you have something to add.

How to plan:
- Every subtopic not yet "seen" gets a planned_start and planned_end between ${from} and ${to}.
- Rows already "seen" keep their dates as given (blank stays blank).
- Respect prerequisites: number and algebra and functions come before calculus, and SL content comes before the AHL content that builds on it.
- A subtopic usually takes one or two weeks. Windows may overlap, but keep each week to a realistic load.
- Leave the last weeks before ${to} for review rather than new content.
- Subtopics with low stars or already in progress can come earlier.
- A short note on why a subtopic is placed where it is is welcome.

The student's current tracker:
${trackerToCsv(rows)}
`
}

/** IB exams sit in May: plan up to 30 April of the next exam session. */
export function defaultPlanEnd(today: string): string {
  const year = Number(today.slice(0, 4))
  const month = Number(today.slice(5, 7))
  return `${month <= 4 ? year : year + 1}-04-30`
}
