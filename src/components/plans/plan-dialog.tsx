"use client"

import * as React from "react"
import { useId } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { savePlan, type PlanActionState } from "@/lib/plans/actions"
import type { DayKey } from "@/lib/calendar/dates"

import { useActionDone } from "./use-action-done"

export type PlanFields = {
  title: string
  goal: string | null
  startsOn: DayKey
  endsOn: DayKey
  weeklyGoalDays: number
}

/** Creates the student's plan, or edits its title, goal, dates and weekly goal. */
export function PlanDialog({
  studentId,
  plan,
  trigger,
}: {
  studentId: string
  /** The saved plan, or defaults for a new one. */
  plan: PlanFields
  trigger: React.ReactElement
}) {
  const [open, setOpen] = React.useState(false)
  // A fresh form on every opening, so a cancelled edit leaves nothing behind.
  const [draft, setDraft] = React.useState(0)

  return (
    <Dialog open={open} onOpenChange={setOpen} onOpenChangeComplete={(isOpen) => !isOpen && setDraft((n) => n + 1)}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <PlanForm key={draft} studentId={studentId} plan={plan} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

function PlanForm({
  studentId,
  plan,
  onSaved,
}: {
  studentId: string
  plan: PlanFields
  onSaved: () => void
}) {
  const [state, action, pending] = React.useActionState<PlanActionState, FormData>(savePlan, {})
  const ids = { title: useId(), goal: useId(), starts: useId(), ends: useId(), weekly: useId() }

  useActionDone(state, (notice) => {
    toast.success(notice)
    onSaved()
  })

  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col">
      <DialogHeader title="Learning plan" description="What the student is working towards, and by when." />
      <DialogBody className="flex flex-col gap-5">
        <input type="hidden" name="student_id" value={studentId} />
        <FormMessage error={state.error} />
        <Field label="Title" htmlFor={ids.title}>
          <Input id={ids.title} name="title" defaultValue={plan.title} maxLength={200} required />
        </Field>
        <Field label="Goal" htmlFor={ids.goal} hint="Optional. Markdown and $maths$ work.">
          <Textarea
            id={ids.goal}
            name="goal"
            defaultValue={plan.goal ?? ""}
            maxLength={5000}
            rows={3}
            placeholder="e.g. A 6 or 7 in IB Maths AA SL Paper 1 and 2."
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Starts" htmlFor={ids.starts}>
            <Input id={ids.starts} name="starts_on" type="date" mono defaultValue={plan.startsOn} required />
          </Field>
          <Field label="Ends" htmlFor={ids.ends}>
            <Input id={ids.ends} name="ends_on" type="date" mono defaultValue={plan.endsOn} required />
          </Field>
          <Field label="Study days a week" htmlFor={ids.weekly}>
            <Input
              id={ids.weekly}
              name="weekly_goal_days"
              type="number"
              min={1}
              max={7}
              mono
              defaultValue={plan.weeklyGoalDays}
              required
            />
          </Field>
        </div>
      </DialogBody>
      <DialogFooter className="justify-end">
        <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving" : "Save plan"}
        </Button>
      </DialogFooter>
    </form>
  )
}

