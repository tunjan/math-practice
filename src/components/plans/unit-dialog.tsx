"use client"

import * as React from "react"
import { useId } from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

import { FormMessage } from "@/components/auth/form-message"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Topic } from "@/lib/assignments/task-options"
import type { DayKey } from "@/lib/calendar/dates"
import { saveUnit, type PlanActionState } from "@/lib/plans/actions"

import { useActionDone } from "./use-action-done"

export type UnitFields = {
  id: string | null
  title: string
  topicId: string | null
  description: string | null
  startsOn: DayKey
  dueOn: DayKey
  objectives: { id: string; statement: string }[]
}

/** Adds a unit to the plan, or edits one together with its objectives. */
export function UnitDialog({
  planId,
  unit,
  topics,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  planId: string
  unit: UnitFields
  topics: Topic[]
  trigger?: React.ReactElement
  /** Controlled, for opening from a menu item rather than a trigger. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen
  const [draft, setDraft] = React.useState(0)

  return (
    <Dialog open={open} onOpenChange={setOpen} onOpenChangeComplete={(isOpen) => !isOpen && setDraft((n) => n + 1)}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent>
        <UnitForm key={draft} planId={planId} unit={unit} topics={topics} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

type DraftObjective = { key: string; id: string | null; statement: string }

let nextKey = 0
const newKey = () => `new-${nextKey++}`

function UnitForm({
  planId,
  unit,
  topics,
  onSaved,
}: {
  planId: string
  unit: UnitFields
  topics: Topic[]
  onSaved: () => void
}) {
  const [state, action, pending] = React.useActionState<PlanActionState, FormData>(saveUnit, {})
  const [objectives, setObjectives] = React.useState<DraftObjective[]>(() =>
    unit.objectives.length > 0
      ? unit.objectives.map((o) => ({ key: o.id, id: o.id, statement: o.statement }))
      : [{ key: newKey(), id: null, statement: "" }]
  )
  const ids = { title: useId(), topic: useId(), starts: useId(), due: useId(), description: useId() }

  useActionDone(state, (notice) => {
    toast.success(notice)
    onSaved()
  })

  function update(key: string, statement: string) {
    setObjectives((list) => list.map((o) => (o.key === key ? { ...o, statement } : o)))
  }

  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col">
      <DialogHeader
        title={unit.id ? "Edit unit" : "Add unit"}
        description="A block of the plan with its own dates and objectives."
      />
      <DialogBody className="flex flex-col gap-5">
        <input type="hidden" name="plan_id" value={planId} />
        <input type="hidden" name="unit_id" value={unit.id ?? ""} />
        <input
          type="hidden"
          name="objectives"
          value={JSON.stringify(objectives.map((o) => ({ id: o.id, statement: o.statement })))}
        />
        <FormMessage error={state.error} />

        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
          <Field label="Title" htmlFor={ids.title}>
            <Input
              id={ids.title}
              name="title"
              defaultValue={unit.title}
              maxLength={200}
              required
              placeholder="e.g. Quadratics"
            />
          </Field>
          <Field label="Topic" htmlFor={ids.topic}>
            <NativeSelect id={ids.topic} name="category_id" defaultValue={unit.topicId ?? ""}>
              <option value="">No topic</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Starts" htmlFor={ids.starts}>
            <Input id={ids.starts} name="starts_on" type="date" mono defaultValue={unit.startsOn} required />
          </Field>
          <Field label="Due" htmlFor={ids.due}>
            <Input id={ids.due} name="due_on" type="date" mono defaultValue={unit.dueOn} required />
          </Field>
        </div>

        <Field label="Notes" htmlFor={ids.description} hint="Optional. Markdown and $maths$ work.">
          <Textarea
            id={ids.description}
            name="description"
            defaultValue={unit.description ?? ""}
            maxLength={5000}
            rows={3}
          />
        </Field>

        <fieldset className="flex flex-col gap-2">
          <legend className="label-md text-on-surface-secondary">Objectives</legend>
          <p className="body-sm text-on-surface-muted">
            What the student should be able to do. They rate their confidence on each.
          </p>
          <ol className="flex flex-col gap-2">
            {objectives.map((objective, index) => (
              <li key={objective.key} className="flex items-center gap-2">
                <span className="mono-data-sm w-5 shrink-0 text-right text-on-surface-muted">{index + 1}</span>
                <Input
                  aria-label={`Objective ${index + 1}`}
                  value={objective.statement}
                  onChange={(event) => update(objective.key, event.target.value)}
                  maxLength={300}
                  placeholder="I can…"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove objective ${index + 1}`}
                  onClick={() => setObjectives((list) => list.filter((o) => o.key !== objective.key))}
                >
                  <X aria-hidden />
                </Button>
              </li>
            ))}
          </ol>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit"
            disabled={objectives.length >= 20}
            onClick={() => setObjectives((list) => [...list, { key: newKey(), id: null, statement: "" }])}
          >
            <Plus aria-hidden />
            Add objective
          </Button>
        </fieldset>
      </DialogBody>
      <DialogFooter className="justify-end">
        <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving" : unit.id ? "Save unit" : "Add unit"}
        </Button>
      </DialogFooter>
    </form>
  )
}
