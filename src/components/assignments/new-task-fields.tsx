"use client"

import * as React from "react"
import {
  BookOpen,
  CalendarClock,
  CircleAlert,
  FileText,
  Globe,
  Hash,
  ImageIcon,
  ListChecks,
  LoaderCircle,
  Plus,
  Sigma,
  UserRound,
  X,
} from "lucide-react"
import { cn } from "cn"

import { DifficultyMeter } from "@/components/assignments/difficulty-meter"
import { chipClass } from "@/components/ui/chip"
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
import { formatDue, isOverdue } from "@/lib/assignments/dates"
import { DUE_PRESETS, instantOf, type WallClock } from "@/lib/assignments/due"
import type { Recipient, Topic } from "@/lib/assignments/task-options"
import {
  DIFFICULTIES,
  DIFFICULTY_LABEL,
  type Difficulty,
} from "@/lib/assignments/difficulty"
import { exercisesLabel, MAX_EXERCISES } from "@/lib/assignments/exercises"
import { sameClock, zoneCity, zoneOffsetLabel } from "@/lib/timezone"

import type { UploadItem } from "./material-uploader"

/**
 * The New task composer: a title line, an instructions area, and a row of
 * property chips. Each chip shows its current value, or its name when empty,
 * so the structure explains itself without helper text.
 */

// ── Chip ────────────────────────────────────────────────────────────────────

function ChipText({ children, empty }: { children: React.ReactNode; empty?: boolean }) {
  return <span className={cn("truncate", empty && "text-muted-foreground")}>{children}</span>
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
 * Everything here is on the deadline's clock, which is the student's: "Friday,
 * 18:00" is 18:00 where they are. The zone is named under the input.
 *
 * Only rendered inside the dialog, which mounts on the client, so the clock can
 * be read during the first render.
 */
/** On a Friday, "Friday" and "In a week" are the same moment: show it once. */
function uniquePresets(now: Date, timeZone: string) {
  const resolved = DUE_PRESETS.map((preset) => ({ preset, wall: preset.resolve(now, timeZone) }))
  return resolved.filter(
    ({ wall }, index) => resolved.findIndex((other) => other.wall === wall) === index
  )
}

export function DueChip({
  value,
  timeZone,
  onValueChange,
  invalid,
  describedBy,
}: {
  /** Wall-clock `YYYY-MM-DDTHH:mm` on `timeZone`'s clock. */
  value: WallClock
  /** The deadline's zone: the student's, or the tutor's own when unknown. */
  timeZone: string
  /** `preset` is the preset's key, or null for a time typed by hand. */
  onValueChange: (value: WallClock, preset: string | null) => void
  invalid?: boolean
  describedBy?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [now, setNow] = React.useState(() => new Date())

  const iso = instantOf(value, timeZone)?.toISOString() ?? ""
  const past = iso ? isOverdue(iso) : false
  const label = iso ? formatDue(iso, timeZone) : ""

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
        aria-label={iso ? `Due ${label}, ${zoneCity(timeZone)} time${past ? ", in the past" : ""}` : "Due date"}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(chipClass, past && "text-destructive [&_svg]:text-destructive")}
      >
        <CalendarClock aria-hidden />
        <ChipText empty={!iso}>{iso ? label : "Due date"}</ChipText>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <ul className="flex flex-col">
          {uniquePresets(now, timeZone).map(({ preset, wall }) => {
            const at = instantOf(wall, timeZone)
            return (
              <li key={preset.key}>
                <button
                  type="button"
                  aria-pressed={wall === value}
                  onClick={() => {
                    onValueChange(wall, preset.key)
                    setOpen(false)
                  }}
                  className="flex h-10 w-full items-center justify-between gap-3 rounded-lg px-3 body-md text-foreground outline-none hover:bg-muted focus-visible:bg-muted aria-pressed:font-medium"
                >
                  <span>{preset.short}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {at ? formatDue(at.toISOString(), timeZone) : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="-mx-2 my-2 h-px bg-border" />
        <div className="flex flex-col gap-1.5 p-1">
          <Input
            type="datetime-local" 
            aria-label={`Date and time, ${zoneCity(timeZone)} time`}
            value={value}
            onChange={(event) => onValueChange(event.target.value, null)}
          />
          <span className="px-0.5 text-xs text-muted-foreground">
            {zoneCity(timeZone)} time · {zoneOffsetLabel(timeZone, iso ? new Date(iso) : now)}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Under the chips: whose clock the deadline is on, and what it is on the
 * tutor's own when that differs. Silent when both clocks agree, so it only
 * speaks up when there is something to get wrong.
 */
export function DueClocks({
  iso,
  recipient,
  viewerZone,
}: {
  iso: string
  recipient: Recipient | undefined
  viewerZone: string
}) {
  if (!iso || !recipient) return null
  const at = new Date(iso)

  if (!recipient.timeZone) {
    return (
      <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
        <Globe aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span>
          This is your time ({zoneCity(viewerZone)}). {recipient.label}&rsquo;s time zone is set when
          they accept the invite.
        </span>
      </p>
    )
  }

  if (sameClock(recipient.timeZone, viewerZone, at)) return null

  return (
    <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
      <Globe aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>
        {recipient.label}&rsquo;s time ({zoneCity(recipient.timeZone)}). For you that&rsquo;s{" "}
        <span className="text-foreground/80 tabular-nums">{formatDue(iso, viewerZone)}</span>.
      </span>
    </p>
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

// ── Difficulty ──────────────────────────────────────────────────────────────

/** How hard the task is. */
export function DifficultyChip({
  value,
  onValueChange,
}: {
  value: Difficulty
  onValueChange: (value: Difficulty) => void
}) {
  return (
    <Select value={value} onValueChange={(next) => next && onValueChange(next as Difficulty)}>
      <SelectTrigger
        aria-label={`Difficulty: ${DIFFICULTY_LABEL[value]}`}
        className={chipClass}
      >
        <DifficultyMeter difficulty={value} className="text-muted-foreground" />
        <ChipText>{DIFFICULTY_LABEL[value]}</ChipText>
      </SelectTrigger>
      <SelectContent className="min-w-56">
        {DIFFICULTIES.map((difficulty) => (
          <SelectItem key={difficulty} value={difficulty}>
            <DifficultyMeter difficulty={difficulty} className="text-muted-foreground" />
            <span className="flex-1">{DIFFICULTY_LABEL[difficulty]}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ── Exercises ───────────────────────────────────────────────────────────────

/**
 * How many exercises the student ticks off. One is the default and reads as
 * the chip's name, since a single piece of work has nothing to count.
 */
export function ExercisesChip({
  value,
  onValueChange,
}: {
  value: number
  onValueChange: (value: number) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState(String(value))
  const id = React.useId()

  const settle = () => {
    const parsed = Number.parseInt(draft, 10)
    const next = Number.isNaN(parsed) ? 1 : Math.min(MAX_EXERCISES, Math.max(1, parsed))
    setDraft(String(next))
    onValueChange(next)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(String(value))
        else settle()
        setOpen(next)
      }}
    >
      <PopoverTrigger
        aria-label={value > 1 ? `Exercises: ${value}` : "Exercises: one"}
        className={chipClass}
      >
        <ListChecks aria-hidden />
        <ChipText empty={value <= 1}>{value > 1 ? exercisesLabel(value) : "Exercises"}</ChipText>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex flex-col gap-1.5 p-1">
          <label htmlFor={id} className="text-xs font-medium text-foreground/80">
            Number of exercises
          </label>
          <Input
            id={id}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_EXERCISES}
            step={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                settle()
                setOpen(false)
              }
            }}
            aria-describedby={`${id}-hint`}
            className="tabular-nums"
          />
          <span id={`${id}-hint`} className="px-0.5 text-xs text-muted-foreground">
            The student ticks them off as they go. Leave at 1 for a single piece of work.
          </span>
        </div>
      </PopoverContent>
    </Popover>
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
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
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
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
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
              "inline-flex h-8 max-w-64 items-center gap-1.5 rounded-lg bg-muted pr-0.5 pl-2.5 label-sm",
              failed ? "text-destructive" : "text-foreground/80"
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
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-border hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
