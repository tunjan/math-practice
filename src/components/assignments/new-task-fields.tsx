"use client"

import * as React from "react"
import {
  BookOpen,
  CalendarClock,
  CircleAlert,
  FileText,
  Hash,
  ImageIcon,
  LoaderCircle,
  Plus,
  Sigma,
  UserRound,
  X,
} from "lucide-react"
import { cn } from "cn"

import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select"
import {
  DUE_PRESETS,
  formatDue,
  fromDateTimeLocalValue,
  isOverdue,
  resolvedTimeZone,
  toDateTimeLocalValue,
} from "@/lib/assignments/dates"
import type { Recipient, Topic } from "@/lib/assignments/task-options"

import type { UploadItem } from "./material-uploader"

/**
 * The New task composer: a title line, an instructions area, and a row of
 * property chips. Each chip shows its current value, or its name when empty,
 * so the structure explains itself without helper text.
 */

// ── Chip ────────────────────────────────────────────────────────────────────

const chipClass = [
  "inline-flex h-8 max-w-full items-center gap-1.5 rounded-md border border-outline-strong bg-surface px-2.5 label-sm text-on-surface",
  "transition-[background-color,border-color,color] duration-150",
  "hover:bg-surface-sunken data-popup-open:bg-surface-sunken",
  "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-on-surface-muted",
  "aria-invalid:border-error aria-invalid:text-error aria-invalid:[&_svg]:text-error",
].join(" ")

function ChipText({ children, empty }: { children: React.ReactNode; empty?: boolean }) {
  return <span className={cn("truncate", empty && "text-on-surface-muted")}>{children}</span>
}

// ── Student ─────────────────────────────────────────────────────────────────

export function StudentChip({
  recipients,
  value,
  onValueChange,
  invalid,
  describedBy,
}: {
  recipients: Recipient[]
  value: string | null
  onValueChange: (value: string | null) => void
  invalid?: boolean
  describedBy?: string
}) {
  const students = recipients.filter((r) => !r.pending)
  const invited = recipients.filter((r) => r.pending)
  const selected = recipients.find((r) => r.value === value)

  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as string | null)}>
      <SelectTrigger
        data-field="target"
        aria-label="Student"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={chipClass}
      >
        <UserRound aria-hidden />
        <ChipText empty={!selected}>{selected?.label ?? "Student"}</ChipText>
      </SelectTrigger>
      <SelectContent className="min-w-56">
        {students.length > 0 ? (
          <SelectGroup>
            {invited.length > 0 ? <SelectGroupLabel>Students</SelectGroupLabel> : null}
            {students.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ) : null}
        {invited.length > 0 ? (
          <SelectGroup>
            <SelectGroupLabel>Invited</SelectGroupLabel>
            {invited.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ) : null}
      </SelectContent>
    </Select>
  )
}

// ── Due ─────────────────────────────────────────────────────────────────────

/**
 * Presets for the common deadlines, and a `datetime-local` for anything else.
 * The input is zone-less, so it is read in the browser's own timezone and
 * sent as an absolute ISO string; the zone is named under it.
 *
 * Only rendered inside the dialog, which mounts on the client, so the local
 * clock can be read during the first render.
 */
/** On a Friday, "Friday" and "In a week" are the same moment: show it once. */
function uniquePresets(now: Date) {
  const resolved = DUE_PRESETS.map((preset) => ({ preset, at: preset.resolve(now) }))
  return resolved.filter(
    ({ at }, index) => resolved.findIndex((other) => +other.at === +at) === index
  )
}

export function DueChip({
  value,
  onValueChange,
  invalid,
  describedBy,
}: {
  /** Zone-less `YYYY-MM-DDTHH:mm`. */
  value: string
  onValueChange: (value: string) => void
  invalid?: boolean
  describedBy?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [now, setNow] = React.useState(() => new Date())
  const [zone] = React.useState(resolvedTimeZone)

  const iso = fromDateTimeLocalValue(value)?.toISOString() ?? ""
  const past = iso ? isOverdue(iso) : false

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setNow(new Date())
        setOpen(next)
      }}
    >
      <PopoverTrigger
        data-field="due"
        aria-label={iso ? `Due ${formatDue(iso)}${past ? ", in the past" : ""}` : "Due date"}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(chipClass, past && "text-error [&_svg]:text-error")}
      >
        <CalendarClock aria-hidden />
        <ChipText empty={!iso}>{iso ? formatDue(iso) : "Due date"}</ChipText>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <ul className="flex flex-col">
          {uniquePresets(now).map(({ preset, at }) => {
            const local = toDateTimeLocalValue(at)
            return (
              <li key={preset.key}>
                <button
                  type="button"
                  aria-pressed={local === value}
                  onClick={() => {
                    onValueChange(local)
                    setOpen(false)
                  }}
                  className="flex h-10 w-full items-center justify-between gap-3 rounded-md px-3 body-md text-on-surface outline-none hover:bg-surface-sunken focus-visible:bg-surface-sunken aria-pressed:font-medium"
                >
                  <span>{preset.short}</span>
                  <span className="mono-data-sm text-on-surface-muted">
                    {formatDue(at.toISOString())}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="-mx-2 my-2 h-px bg-outline" />
        <div className="flex flex-col gap-1.5 p-1">
          <Input
            type="datetime-local"
            mono
            aria-label="Date and time"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
          />
          <span className="px-0.5 caption text-on-surface-muted">{zone}</span>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ── Type ────────────────────────────────────────────────────────────────────

const TYPES = [
  { value: "problem_set", label: "Problem set", icon: Sigma },
  { value: "reading_notes", label: "Reading notes", icon: BookOpen },
] as const

export function TypeChip({
  value,
  onValueChange,
}: {
  value: string
  onValueChange: (value: string) => void
}) {
  const selected = TYPES.find((t) => t.value === value) ?? TYPES[0]
  const Icon = selected.icon

  return (
    <Select value={value} onValueChange={(next) => next && onValueChange(next as string)}>
      <SelectTrigger aria-label="Type" className={chipClass}>
        <Icon aria-hidden />
        <ChipText>{selected.label}</ChipText>
      </SelectTrigger>
      <SelectContent className="min-w-48">
        {TYPES.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            <type.icon aria-hidden />
            {type.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ── Topic ───────────────────────────────────────────────────────────────────

const NEW_TOPIC = "__new"

/** Pick a topic, or choose "New topic" to name one inline. */
export function TopicChip({
  topics,
  value,
  onValueChange,
}: {
  topics: Topic[]
  value: string | null
  onValueChange: (value: string | null) => void
}) {
  const selected = topics.find((t) => t.id === value)

  if (value === NEW_TOPIC) {
    return (
      <span className="inline-flex items-center gap-0.5">
        <span className="relative">
          <Hash
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-on-surface-muted"
          />
          <Input
            name="new_category"
            aria-label="New topic name"
            placeholder="New topic"
            maxLength={80}
            autoFocus
            className="h-8 w-44 pr-2.5 pl-8 label-sm"
          />
        </span>
        <button
          type="button"
          aria-label="Cancel new topic"
          onClick={() => onValueChange(null)}
          className="flex size-8 items-center justify-center rounded-md text-on-surface-muted hover:bg-surface-sunken hover:text-on-surface"
        >
          <X className="size-4" aria-hidden />
        </button>
      </span>
    )
  }

  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as string | null)}>
      <SelectTrigger aria-label="Topic" className={chipClass}>
        <Hash aria-hidden />
        <ChipText empty={!selected}>{selected?.name ?? "Topic"}</ChipText>
      </SelectTrigger>
      <SelectContent className="min-w-52">
        <SelectItem value={null}>No topic</SelectItem>
        {topics.map((topic) => (
          <SelectItem key={topic.id} value={topic.id}>
            {topic.name}
          </SelectItem>
        ))}
        <SelectSeparator />
        <SelectItem value={NEW_TOPIC}>
          <Plus aria-hidden />
          New topic
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

// ── Attachments ─────────────────────────────────────────────────────────────

export function AttachmentChips({
  items,
  onRemove,
}: {
  items: UploadItem[]
  onRemove: (item: UploadItem) => void
}) {
  if (items.length === 0) return null

  return (
    <ul aria-label="Attachments" className="flex flex-wrap gap-2">
      {items.map((item) => {
        const failed = item.status === "error"
        const Icon =
          item.status === "uploading"
            ? LoaderCircle
            : failed
              ? CircleAlert
              : item.mimeType === "application/pdf"
                ? FileText
                : ImageIcon
        return (
          <li
            key={item.id}
            className={cn(
              "inline-flex h-8 max-w-64 items-center gap-1.5 rounded-md bg-surface-sunken pr-0.5 pl-2.5 label-sm",
              failed ? "text-error" : "text-on-surface-secondary"
            )}
          >
            <Icon
              aria-hidden
              className={cn("size-4 shrink-0", item.status === "uploading" && "animate-spin")}
            />
            <span className="truncate">{item.fileName}</span>
            {item.status === "uploading" ? <span className="sr-only">, uploading</span> : null}
            {failed ? <span className="sr-only">, failed to upload</span> : null}
            <button
              type="button"
              aria-label={`Remove ${item.fileName}`}
              onClick={() => onRemove(item)}
              className="flex size-7 shrink-0 items-center justify-center rounded-sm text-on-surface-muted hover:bg-outline hover:text-on-surface"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
