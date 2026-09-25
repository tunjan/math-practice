"use client"

import * as React from "react"
import { CalendarRange, ChevronRight, Search, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { TopicTags } from "@/components/syllabus/topic-tags"
import { StarRating } from "@/components/syllabus/star-rating"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { DayKey } from "@/lib/calendar/dates"
import { saveTopicProgress, type ProgressPatch } from "@/lib/syllabus/actions"
import {
  STATUS_COLOR,
  STATUS_LABEL,
  STATUSES,
  summarise,
  TOPIC_NAME,
  type TopicProgress,
  type TopicStatus,
  type TrackerRow,
} from "@/lib/syllabus/model"

type Filter = "all" | TopicStatus

const SHORT_DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })

function shortDay(day: string): string {
  return SHORT_DAY.format(new Date(`${day}T00:00:00Z`))
}

function windowLabel(progress: TopicProgress): string | null {
  const { plannedStart: start, plannedEnd: end } = progress
  if (start && end) return start === end ? shortDay(start) : `${shortDay(start)} – ${shortDay(end)}`
  if (start) return `From ${shortDay(start)}`
  if (end) return `By ${shortDay(end)}`
  return null
}

/**
 * The syllabus tracker: every subtopic of the student's course as one row of
 * an Airtable-style grid, grouped by strand. The tutor edits cells in place;
 * each change saves on its own and shows at once. The student gets the same
 * grid, read-only.
 */
export function SyllabusTracker({
  studentId,
  rows,
  editable,
  today,
  toolbar,
}: {
  studentId: string
  rows: TrackerRow[]
  editable: boolean
  today: DayKey
  /** Extra actions for the toolbar, e.g. import and export. */
  toolbar?: React.ReactNode
}) {
  const [optimistic, applyOptimistic] = React.useOptimistic(
    rows,
    (current: TrackerRow[], change: { ids: string[]; patch: ProgressPatch }) =>
      current.map((row) =>
        change.ids.includes(row.id) ? { ...row, progress: { ...row.progress, ...change.patch } } : row
      )
  )
  const [, startTransition] = React.useTransition()
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<Filter>("all")
  const [collapsed, setCollapsed] = React.useState<Set<number>>(new Set())
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const save = React.useCallback(
    (ids: string[], patch: ProgressPatch) => {
      startTransition(async () => {
        applyOptimistic({ ids, patch })
        const result = await saveTopicProgress(studentId, ids, patch)
        if (result.error) toast.error(result.error)
      })
    },
    [applyOptimistic, studentId]
  )

  const summary = summarise(optimistic)
  const q = query.trim().toLowerCase()
  const visible = optimistic.filter(
    (row) =>
      (filter === "all" || row.progress.status === filter) &&
      (!q || row.code.startsWith(q) || row.title.toLowerCase().includes(q))
  )
  const strands = [...new Set(visible.map((row) => row.topic))]
  const columns = editable ? 8 : 7

  const toggleRow = (id: string) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <section aria-label="Syllabus tracker" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Stat label="Seen" value={`${summary.seen}/${summary.total}`} />
        <Stat label="In progress" value={String(summary.inProgress)} />
        <Stat label="Scheduled" value={`${summary.scheduled}/${summary.total}`} />
        <Stat
          label="Average"
          value={summary.averageStars === null ? "–" : `${summary.averageStars.toFixed(1)} ★`}
        />
        <div
          className="ml-auto h-1.5 min-w-32 flex-1 overflow-hidden rounded-full bg-surface-sunken sm:max-w-48"
          role="progressbar"
          aria-label="Seen"
          aria-valuemin={0}
          aria-valuemax={summary.total}
          aria-valuenow={summary.seen}
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
            style={{ width: `${summary.total ? (summary.seen / summary.total) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-on-surface-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a subtopic"
            aria-label="Find a subtopic"
            className="h-8 pl-9 text-sm"
          />
        </div>
        <div role="group" aria-label="Show" className="flex flex-wrap gap-1">
          {(["all", ...STATUSES] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={cn(
                "h-8 rounded-md px-2.5 text-sm transition-colors",
                filter === value
                  ? "bg-surface-sunken font-medium text-on-surface"
                  : "text-on-surface-muted hover:bg-surface-hover hover:text-on-surface"
              )}
            >
              {value === "all" ? "All" : STATUS_LABEL[value]}
            </button>
          ))}
        </div>
        {toolbar ? <div className="ml-auto flex items-center gap-2">{toolbar}</div> : null}
      </div>

      <div className="overflow-x-auto rounded-lg border border-outline bg-surface">
        <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
          <thead>
            <tr className="h-9 border-b border-outline bg-surface-sunken/70 text-xs font-medium text-on-surface-muted">
              {editable ? (
                <th scope="col" className="w-10 border-r border-outline px-3">
                  <Checkbox
                    aria-label="Select all shown"
                    checked={visible.length > 0 && visible.every((row) => selected.has(row.id))}
                    indeterminate={visible.some((row) => selected.has(row.id)) && !visible.every((row) => selected.has(row.id))}
                    onCheckedChange={(checked) =>
                      setSelected(checked ? new Set(visible.map((row) => row.id)) : new Set())
                    }
                  />
                </th>
              ) : null}
              <Th className="w-20">Code</Th>
              <Th>Subtopic</Th>
              <Th className="w-32">Status</Th>
              <Th className="w-28">Knows it</Th>
              <Th className="w-40">Planned</Th>
              <Th className="w-16 text-right">Tasks</Th>
              <Th className="w-56 border-r-0">Notes</Th>
            </tr>
          </thead>
          {strands.map((strand) => {
            const inStrand = visible.filter((row) => row.topic === strand)
            const all = optimistic.filter((row) => row.topic === strand)
            const isCollapsed = collapsed.has(strand)
            return (
              <tbody key={strand}>
                <tr className="h-9 border-b border-outline bg-surface-muted">
                  <td colSpan={columns} className="px-3">
                    <button
                      type="button"
                      aria-expanded={!isCollapsed}
                      onClick={() =>
                        setCollapsed((current) => {
                          const next = new Set(current)
                          if (next.has(strand)) next.delete(strand)
                          else next.add(strand)
                          return next
                        })
                      }
                      className="flex w-full items-center gap-2 text-left"
                    >
                      <ChevronRight
                        aria-hidden
                        className={cn("size-4 text-on-surface-muted transition-transform", !isCollapsed && "rotate-90")}
                      />
                      <TopicTags tags={[{ code: String(strand), title: TOPIC_NAME[strand] ?? "", topic: strand, subtopic: 0 }]} inline />
                      <span className="font-medium text-on-surface">{TOPIC_NAME[strand]}</span>
                      <span className="text-xs text-on-surface-muted">
                        {all.filter((row) => row.progress.status === "seen").length}/{all.length} seen
                      </span>
                    </button>
                  </td>
                </tr>
                {isCollapsed
                  ? null
                  : inStrand.map((row) => (
                      <Row
                        key={row.id}
                        row={row}
                        editable={editable}
                        today={today}
                        selected={selected.has(row.id)}
                        onSelect={() => toggleRow(row.id)}
                        onSave={(patch) => save([row.id], patch)}
                      />
                    ))}
              </tbody>
            )
          })}
          {visible.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={columns} className="px-3 py-10 text-center text-sm text-on-surface-muted">
                  No subtopics match.
                </td>
              </tr>
            </tbody>
          ) : null}
        </table>
      </div>

      {editable && selected.size > 0 ? (
        <BulkBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          onSave={(patch) => {
            save([...selected], patch)
            setSelected(new Set())
          }}
        />
      ) : null}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="font-mono text-sm text-on-surface tabular-nums">{value}</span>
      <span className="text-xs text-on-surface-muted">{label}</span>
    </span>
  )
}

function Th({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <th scope="col" className={cn("border-r border-outline px-3 font-medium whitespace-nowrap", className)}>
      {children}
    </th>
  )
}

const cellClass = "border-r border-outline px-3 align-middle"

function Row({
  row,
  editable,
  today,
  selected,
  onSelect,
  onSave,
}: {
  row: TrackerRow
  editable: boolean
  today: DayKey
  selected: boolean
  onSelect: () => void
  onSave: (patch: ProgressPatch) => void
}) {
  const { progress } = row
  const late = progress.status !== "seen" && progress.plannedEnd !== null && progress.plannedEnd < today

  return (
    <tr
      data-selected={selected || undefined}
      className="h-10 border-b border-outline transition-colors hover:bg-surface-muted/60 data-selected:bg-blue-50/70"
    >
      {editable ? (
        <td className={cn(cellClass, "w-10")}>
          <Checkbox checked={selected} onCheckedChange={onSelect} aria-label={`Select ${row.code}`} />
        </td>
      ) : null}
      <td className={cellClass}>
        <TopicTags tags={[row]} inline />
      </td>
      <td className={cn(cellClass, "max-w-0")}>
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-on-surface" title={row.title}>
            {row.title}
          </span>
          {row.level === "AHL" ? (
            <span className="shrink-0 text-xs text-on-surface-muted" title="Additional higher level">
              HL
            </span>
          ) : null}
        </span>
      </td>
      <td className={cellClass}>
        {editable ? (
          <StatusSelect value={progress.status} onValueChange={(status) => onSave({ status })} label={`${row.code} status`} />
        ) : (
          <Badge variant={STATUS_COLOR[progress.status]}>{STATUS_LABEL[progress.status]}</Badge>
        )}
      </td>
      <td className={cellClass}>
        <StarRating
          value={progress.stars}
          label={`How well they know ${row.code}`}
          onValueChange={editable ? (stars) => onSave({ stars }) : undefined}
        />
      </td>
      <td className={cn(cellClass, late && "text-error")}>
        {editable ? (
          <PlannedCell progress={progress} code={row.code} late={late} onSave={onSave} />
        ) : (
          <span className={cn("text-sm", late ? "font-medium" : windowLabel(progress) ? "text-on-surface" : "text-on-surface-muted")}>
            {windowLabel(progress) ?? "–"}
          </span>
        )}
      </td>
      <td className={cn(cellClass, "text-right font-mono text-on-surface-secondary tabular-nums")}>
        {row.taskCount || <span className="text-on-surface-muted">–</span>}
      </td>
      <td className={cn(cellClass, "max-w-0 border-r-0")}>
        {editable ? (
          <NotesCell notes={progress.notes} code={row.code} onSave={(notes) => onSave({ notes })} />
        ) : (
          <span className="block truncate text-on-surface-secondary" title={progress.notes ?? undefined}>
            {progress.notes ?? ""}
          </span>
        )}
      </td>
    </tr>
  )
}

function StatusSelect({
  value,
  onValueChange,
  label,
}: {
  value: TopicStatus | null
  onValueChange: (value: TopicStatus) => void
  label: string
}) {
  return (
    <Select value={value} onValueChange={(next) => next && onValueChange(next as TopicStatus)}>
      <SelectTrigger
        aria-label={label}
        className="flex h-7 items-center rounded-md px-1 outline-none hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-on-surface/20"
      >
        {value ? (
          <Badge variant={STATUS_COLOR[value]}>{STATUS_LABEL[value]}</Badge>
        ) : (
          <span className="px-1 text-sm text-on-surface-muted">Status</span>
        )}
      </SelectTrigger>
      <SelectContent className="dub min-w-40">
        {STATUSES.map((status) => (
          <SelectItem key={status} value={status} className="h-9">
            <Badge variant={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function DateRangeForm({
  start,
  end,
  onSave,
  onClear,
}: {
  start: string | null
  end: string | null
  onSave: (start: string | null, end: string | null) => void
  onClear?: () => void
}) {
  const [from, setFrom] = React.useState(start ?? "")
  const [to, setTo] = React.useState(end ?? "")
  const invalid = Boolean(from && to && from > to)

  return (
    <form
      className="flex flex-col gap-3 p-1"
      onSubmit={(event) => {
        event.preventDefault()
        if (!invalid) onSave(from || null, to || null)
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs text-on-surface-muted">
          Start
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-9 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-on-surface-muted">
          End
          <Input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
            className="h-9 text-sm"
            aria-invalid={invalid || undefined}
          />
        </label>
      </div>
      {invalid ? <p className="text-xs text-error">End must be on or after the start.</p> : null}
      <div className="flex justify-end gap-2">
        {onClear ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        ) : null}
        <Button type="submit" variant="primary" size="sm" disabled={invalid}>
          Save
        </Button>
      </div>
    </form>
  )
}

function PlannedCell({
  progress,
  code,
  late,
  onSave,
}: {
  progress: TopicProgress
  code: string
  late: boolean
  onSave: (patch: ProgressPatch) => void
}) {
  const [open, setOpen] = React.useState(false)
  const label = windowLabel(progress)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`Plan ${code}${label ? `, currently ${label}` : ""}`}
        className={cn(
          "-mx-1 flex h-7 w-full items-center gap-1.5 rounded-md px-1 text-left text-sm outline-none hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-on-surface/20",
          label ? (late ? "font-medium text-error" : "text-on-surface") : "text-on-surface-muted"
        )}
      >
        {label ?? (
          <>
            <CalendarRange aria-hidden className="size-3.5" /> Plan
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className="dub w-80">
        <DateRangeForm
          key={String(open)}
          start={progress.plannedStart}
          end={progress.plannedEnd}
          onSave={(plannedStart, plannedEnd) => {
            onSave({ plannedStart, plannedEnd })
            setOpen(false)
          }}
          onClear={
            label
              ? () => {
                  onSave({ plannedStart: null, plannedEnd: null })
                  setOpen(false)
                }
              : undefined
          }
        />
      </PopoverContent>
    </Popover>
  )
}

function NotesCell({
  notes,
  code,
  onSave,
}: {
  notes: string | null
  code: string
  onSave: (notes: string | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState(notes ?? "")

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(notes ?? "")
        setOpen(next)
      }}
    >
      <PopoverTrigger
        aria-label={`Notes for ${code}`}
        className="-mx-1 block h-7 w-full truncate rounded-md px-1 text-left text-sm outline-none hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-on-surface/20"
      >
        {notes ? <span className="text-on-surface-secondary">{notes}</span> : <span className="text-on-surface-muted/60">Add a note</span>}
      </PopoverTrigger>
      <PopoverContent className="dub w-80" align="end">
        <form
          className="flex flex-col gap-2 p-1"
          onSubmit={(event) => {
            event.preventDefault()
            if (draft.trim() !== (notes ?? "")) onSave(draft.trim() || null)
            setOpen(false)
          }}
        >
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={2000}
            rows={4}
            aria-label={`Notes for ${code}`}
            placeholder="What to revisit, what went well…"
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) event.currentTarget.form?.requestSubmit()
            }}
          />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm">
              Save
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}

function BulkBar({
  count,
  onClear,
  onSave,
}: {
  count: number
  onClear: () => void
  onSave: (patch: ProgressPatch) => void
}) {
  const [planning, setPlanning] = React.useState(false)

  return (
    <div
      role="toolbar"
      aria-label="Edit selected subtopics"
      className="sticky bottom-4 z-10 mx-auto flex w-fit max-w-full flex-wrap items-center gap-1 rounded-xl bg-surface-inverse p-1.5 pl-4 text-sm text-on-surface-inverse shadow-overlay"
    >
      <span className="mr-2 font-medium tabular-nums">{count} selected</span>
      <Select value={null} onValueChange={(next) => next && onSave({ status: next as TopicStatus })}>
        <SelectTrigger render={<Button variant="inverse" size="sm" />}>Set status</SelectTrigger>
        <SelectContent className="dub min-w-40">
          {STATUSES.map((status) => (
            <SelectItem key={status} value={status} className="h-9">
              <Badge variant={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Badge>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Popover open={planning} onOpenChange={setPlanning}>
        <PopoverTrigger render={<Button variant="inverse" size="sm" />}>
          <CalendarRange aria-hidden /> Plan
        </PopoverTrigger>
        <PopoverContent className="dub w-80" side="top">
          <DateRangeForm
            start={null}
            end={null}
            onSave={(plannedStart, plannedEnd) => {
              onSave({ plannedStart, plannedEnd })
              setPlanning(false)
            }}
          />
        </PopoverContent>
      </Popover>
      <Button variant="inverse" size="icon-sm" aria-label="Clear selection" onClick={onClear}>
        <X aria-hidden />
      </Button>
    </div>
  )
}
