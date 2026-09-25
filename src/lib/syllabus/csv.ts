import Papa from "papaparse"

import type { TrackerRow } from "./model"

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
