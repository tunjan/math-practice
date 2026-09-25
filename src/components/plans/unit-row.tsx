"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, ChevronDown, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { SegmentedControl } from "@/components/ui/segmented-control"
import type { Topic } from "@/lib/assignments/task-options"
import { formatDayShort, type DayKey } from "@/lib/calendar/dates"
import { deleteUnit, moveUnit, setMastery, type PlanActionState } from "@/lib/plans/actions"
import {
  CONFIDENCE_LABEL,
  MASTERY,
  MASTERY_LEVELS,
  TIMING,
  unitSelfProgress,
  unitTiming,
  type Confidence,
  type Mastery,
  type Unit,
} from "@/lib/plans/model"

import { UnitDialog } from "./unit-dialog"

/**
 * One unit on the tutor's plan. The row carries what the tutor scans for:
 * title, dates, the student's self-check and the tutor's own rating, which
 * saves as soon as it is picked. Opening the row shows the detail behind it.
 */
export function UnitRow({
  unit,
  planId,
  topics,
  today,
  isFirst,
  isLast,
}: {
  unit: Unit
  planId: string
  topics: Topic[]
  today: DayKey
  isFirst: boolean
  isLast: boolean
}) {
  const [expanded, setExpanded] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)
  // Shows the new rating at once; falls back to the saved one if the save fails.
  const [mastery, setOptimisticMastery] = React.useOptimistic(unit.mastery)
  const [pending, startTransition] = React.useTransition()
  const panelId = React.useId()

  const timing = unitTiming({ ...unit, mastery }, today)
  const flag = timing === "due_soon" || timing === "overdue" ? TIMING[timing] : null
  const self = unitSelfProgress(unit.objectives)

  function run(
    fn: () => Promise<PlanActionState>,
    after?: (result: PlanActionState) => void,
    optimistic?: () => void
  ) {
    startTransition(async () => {
      optimistic?.()
      const result = await fn()
      if (result.error) toast.error(result.error)
      after?.(result)
    })
  }

  function rate(next: Mastery) {
    const form = new FormData()
    form.set("unit_id", unit.id)
    form.set("mastery", next)
    form.set("mastery_note", unit.masteryNote ?? "")
    run(() => setMastery({}, form), undefined, () => setOptimisticMastery(next))
  }

  return (
    <li className="border-t border-outline first:border-t-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-6 py-4">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((open) => !open)}
          className="group/unit flex min-w-0 flex-1 basis-60 items-center gap-4 rounded-md text-left outline-offset-4"
        >
          <span className="mono-data-sm w-5 shrink-0 text-on-surface-muted">
            {String(unit.position).padStart(2, "0")}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex items-center gap-2">
              <span className="title-md truncate text-on-surface">{unit.title}</span>
              <ChevronDown
                aria-hidden
                className={cn(
                  "size-4 shrink-0 text-on-surface-muted transition-transform duration-150 group-hover/unit:text-on-surface",
                  expanded && "rotate-180"
                )}
              />
            </span>
            <span className="body-sm truncate text-on-surface-muted">
              <span className="mono-data-sm">
                {formatDayShort(unit.startsOn)} – {formatDayShort(unit.dueOn)}
              </span>
              {unit.topic ? ` · ${unit.topic.name}` : null}
            </span>
          </span>
          {flag ? <Badge variant={flag.tone}>{flag.label}</Badge> : null}
        </button>

        <div className="flex w-full items-center gap-4 sm:w-auto">
          {self !== null ? (
            <Progress value={self} label="Student’s self-check" hideLabel className="w-32 shrink-0" />
          ) : null}

          <SegmentedControl
            legend={`Your rating for ${unit.title}`}
            hideLegend
            size="sm"
            name={`mastery-${unit.id}`}
            value={mastery}
            onValueChange={rate}
            options={MASTERY_LEVELS.map((level) => ({ value: level, label: MASTERY[level].label }))}
            className="min-w-0 flex-1 sm:w-72 sm:flex-none"
          />

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Actions for ${unit.title}`}
              disabled={pending}
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-on-surface-muted transition-colors hover:bg-surface-sunken hover:text-on-surface data-popup-open:bg-surface-sunken"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setEditing(true)}>
                <Pencil aria-hidden />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem disabled={isFirst} onClick={() => run(() => moveUnit(unit.id, "up"))}>
                <ArrowUp aria-hidden />
                Move up
              </DropdownMenuItem>
              <DropdownMenuItem disabled={isLast} onClick={() => run(() => moveUnit(unit.id, "down"))}>
                <ArrowDown aria-hidden />
                Move down
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmingDelete(true)}>
                <Trash2 aria-hidden />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {expanded ? (
        <div id={panelId} className="flex flex-col gap-5 px-6 pb-5 sm:pl-15">
          {unit.objectives.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {unit.objectives.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-4">
                  <span className="body-sm text-on-surface">{o.statement}</span>
                  <ConfidencePips value={o.checkedAt ? o.confidence : null} />
                </li>
              ))}
            </ul>
          ) : (
            <Button variant="ghost" size="sm" className="-ml-3 w-fit" onClick={() => setEditing(true)}>
              <Plus aria-hidden />
              Add objectives
            </Button>
          )}

          {unit.tasks.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {unit.tasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-4">
                  <Link
                    href={`/tutor/assignments/${task.id}`}
                    className="body-sm truncate text-on-surface underline decoration-outline-strong underline-offset-4 hover:decoration-on-surface"
                  >
                    {task.title}
                  </Link>
                  <Badge variant={task.status.tone}>{task.status.label}</Badge>
                </li>
              ))}
            </ul>
          ) : null}

          <NoteField key={unit.masteryNote ?? ""} unitId={unit.id} mastery={mastery} note={unit.masteryNote} />
        </div>
      ) : null}

      <UnitDialog
        open={editing}
        onOpenChange={setEditing}
        planId={planId}
        topics={topics}
        unit={{
          id: unit.id,
          title: unit.title,
          topicId: unit.topic?.id ?? null,
          description: unit.description,
          startsOn: unit.startsOn,
          dueOn: unit.dueOn,
          objectives: unit.objectives,
        }}
      />

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={`Delete ${unit.title}?`}
        description="Its objectives and the student's self-check go with it. Linked tasks stay."
        confirm={
          <Button
            variant="danger"
            disabled={pending}
            onClick={() =>
              run(
                () => deleteUnit(unit.id),
                () => setConfirmingDelete(false)
              )
            }
          >
            Delete
          </Button>
        }
      />
    </li>
  )
}

/** Three pips for the student's confidence; hollow until they rate it. */
function ConfidencePips({ value }: { value: Confidence | null }) {
  const filled = value === null ? 0 : value + 1
  return (
    <span className="flex shrink-0 items-center gap-2">
      <span className="body-sm text-on-surface-muted">{value === null ? "Not rated" : CONFIDENCE_LABEL[value]}</span>
      <span className="flex gap-0.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn("h-3 w-1 rounded-full", i < filled ? "bg-on-surface" : "bg-outline")}
          />
        ))}
      </span>
    </span>
  )
}

/** The note that travels with the rating. Saves when the field is left. */
function NoteField({ unitId, mastery, note }: { unitId: string; mastery: Mastery; note: string | null }) {
  const [value, setValue] = React.useState(note ?? "")
  const [pending, startTransition] = React.useTransition()
  const id = React.useId()

  function save() {
    if (value.trim() === (note ?? "")) return
    const form = new FormData()
    form.set("unit_id", unitId)
    form.set("mastery", mastery)
    form.set("mastery_note", value)
    startTransition(async () => {
      const result = await setMastery({}, form)
      if (result.error) toast.error(result.error)
      else toast.success("Note saved")
    })
  }

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        Note for the student
      </label>
      <Input
        id={id}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur()
        }}
        disabled={pending}
        maxLength={2000}
        placeholder="Note for the student"
      />
    </div>
  )
}
