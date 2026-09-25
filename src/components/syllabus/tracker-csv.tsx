"use client"

import * as React from "react"
import { ArrowRight, Download, Upload } from "lucide-react"
import { toast } from "sonner"

import { FormMessage } from "@/components/auth/form-message"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { importTopicProgress } from "@/lib/syllabus/actions"
import { parseTrackerCsv, trackerToCsv, type CsvImport } from "@/lib/syllabus/csv"
import { STATUS_COLOR, STATUS_LABEL, type TopicProgress, type TrackerRow } from "@/lib/syllabus/model"

/** Downloads the tracker as a CSV, built in the browser from what's on screen. */
export function ExportCsvButton({ rows, filename }: { rows: TrackerRow[]; filename: string }) {
  const download = React.useCallback(() => {
    // The BOM tells Excel the file is UTF-8, so accents in notes survive.
    const blob = new Blob(["\uFEFF", trackerToCsv(rows)], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }, [rows, filename])

  return (
    <Button variant="secondary" size="sm" onClick={download}>
      <Download aria-hidden /> Export CSV
    </Button>
  )
}

const FIELD_LABEL: Record<keyof TopicProgress, string> = {
  status: "Status",
  stars: "Stars",
  plannedStart: "Start",
  plannedEnd: "End",
  notes: "Notes",
}

function FieldValue({ field, progress }: { field: keyof TopicProgress; progress: TopicProgress }) {
  if (field === "status") return <Badge variant={STATUS_COLOR[progress.status]}>{STATUS_LABEL[progress.status]}</Badge>
  if (field === "stars") return <span className="font-mono tabular-nums">{progress.stars} ★</span>
  const value = progress[field]
  if (value === null || value === "") return <span className="text-on-surface-muted">empty</span>
  return (
    <span className="max-w-48 truncate font-mono text-xs tabular-nums" title={String(value)}>
      {String(value)}
    </span>
  )
}

/**
 * Upload or paste a tracker CSV, check it against the student's syllabus, see
 * exactly what would change, then apply it in one go. Nothing is written until
 * Apply, and a file with any problem can't be applied.
 */
export function ImportCsvDialog({ studentId, rows }: { studentId: string; rows: TrackerRow[] }) {
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState("")
  const [result, setResult] = React.useState<CsvImport | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()
  const fileRef = React.useRef<HTMLInputElement>(null)

  function reset() {
    setText("")
    setResult(null)
    setError(null)
  }

  function check(csv: string) {
    setError(null)
    setResult(csv.trim() ? parseTrackerCsv(csv, rows) : null)
  }

  async function readFile(file: File) {
    const csv = await file.text()
    setText(csv)
    check(csv)
  }

  function apply() {
    if (!result?.changes.length) return
    startTransition(async () => {
      const outcome = await importTopicProgress(
        studentId,
        result.changes.map((change) => ({ topicId: change.topicId, progress: change.after }))
      )
      if (outcome.error) return setError(outcome.error)
      toast.success(`Updated ${outcome.count} subtopic${outcome.count === 1 ? "" : "s"}`)
      setOpen(false)
      reset()
    })
  }

  const blocked = Boolean(result?.issues.length)
  const count = result?.changes.length ?? 0

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Upload aria-hidden /> Import CSV
      </Button>
      <DialogContent scope="dub" className="sm:w-[min(760px,calc(100vw-4rem))]">
        <DialogHeader
          title="Import CSV"
          description="Columns: code, title, level, status, stars, planned_start, planned_end, notes. Only code is required; a missing column leaves that field as it is."
        />
        <DialogBody className="flex flex-col gap-4">
          {error ? <FormMessage error={error} /> : null}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void readFile(file)
                event.target.value = ""
              }}
            />
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload aria-hidden /> Choose a file
            </Button>
            <span className="text-sm text-on-surface-muted">or paste it below</span>
          </div>
          <Textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              setResult(null)
            }}
            onPaste={(event) => {
              const pasted = event.clipboardData.getData("text")
              if (pasted && !text.trim()) {
                event.preventDefault()
                setText(pasted)
                check(pasted)
              }
            }}
            rows={6}
            aria-label="CSV"
            placeholder={"code,status,planned_start,planned_end\n1.1,in_progress,2026-10-05,2026-10-11"}
            className="font-mono text-xs"
          />

          {result ? (
            <div className="flex flex-col gap-3" aria-live="polite">
              {result.issues.length ? (
                <div role="alert" className="flex flex-col gap-2 rounded-md bg-error-container px-3 py-2.5 text-sm text-on-error-container">
                  <p className="font-medium">
                    {result.issues.length} problem{result.issues.length === 1 ? "" : "s"}: fix the file and check it again.
                  </p>
                  <ul className="flex flex-col gap-1">
                    {result.issues.map((issue, i) => (
                      <li key={i}>
                        {issue.row ? <span className="font-mono tabular-nums">Row {issue.row}: </span> : null}
                        {issue.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {result.warnings.map((warning) => (
                <p key={warning} className="text-sm text-on-surface-muted">
                  {warning}
                </p>
              ))}
              {!blocked && count === 0 ? (
                <p className="rounded-md border border-outline px-3 py-6 text-center text-sm text-on-surface-muted">
                  {result.rows} row{result.rows === 1 ? "" : "s"} read. Nothing would change.
                </p>
              ) : null}
              {!blocked && count > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-outline">
                  <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                    <caption className="sr-only">Changes the import would make</caption>
                    <thead>
                      <tr className="h-8 border-b border-outline bg-surface-sunken/70 text-xs text-on-surface-muted">
                        <th scope="col" className="w-16 px-3 font-medium">Code</th>
                        <th scope="col" className="px-3 font-medium">Subtopic</th>
                        <th scope="col" className="px-3 font-medium">Changes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.changes.map((change) => (
                        <tr key={change.topicId} className="border-b border-outline align-top last:border-b-0">
                          <td className="px-3 py-2 font-mono tabular-nums">{change.code}</td>
                          <td className="max-w-48 truncate px-3 py-2 text-on-surface-secondary" title={change.title}>
                            {change.title}
                          </td>
                          <td className="px-3 py-2">
                            <ul className="flex flex-col gap-1">
                              {change.fields.map((field) => (
                                <li key={field} className="flex flex-wrap items-center gap-1.5">
                                  <span className="w-12 text-xs text-on-surface-muted">{FIELD_LABEL[field]}</span>
                                  <FieldValue field={field} progress={change.before} />
                                  <ArrowRight aria-label="to" className="size-3 text-on-surface-muted" />
                                  <FieldValue field={field} progress={change.after} />
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter className="py-3">
          <div className="ml-auto flex items-center gap-2">
            <DialogClose render={<Button variant="secondary" className="border-outline" />}>Cancel</DialogClose>
            {result && !blocked && count > 0 ? (
              <Button variant="primary" onClick={apply} disabled={pending}>
                {pending ? "Applying" : `Apply ${count} change${count === 1 ? "" : "s"}`}
              </Button>
            ) : (
              <Button variant="primary" onClick={() => check(text)} disabled={!text.trim()}>
                Check
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
