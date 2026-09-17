"use client"

import { useActionState, useId, useState } from "react"

import { Button } from "@/components/ui/button"
import { Eyebrow } from "@/components/brand/primitives"
import { FormMessage } from "@/components/auth/form-message"
import { setCompletion, type ProgressState } from "@/lib/student/actions"

/**
 * The student's own sense of how far through they are.
 *
 * Explicitly labelled as self-reported, and never shown next to the tutor's
 * verdict as though the two were the same kind of statement.
 */
export function CompletionControl({
  assignmentId,
  value,
}: {
  assignmentId: string
  value: number
}) {
  const [state, action, pending] = useActionState<ProgressState, FormData>(
    setCompletion,
    {}
  )
  const [pct, setPct] = useState(value)
  const sliderId = useId()

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-lg border border-hairline bg-canvas-card p-6"
    >
      <input type="hidden" name="assignment_id" value={assignmentId} />

      <div className="flex flex-col gap-1">
        <Eyebrow size="sm">How far have you got?</Eyebrow>
        <p className="body-sm text-body-mid">
          Just for you and your tutor to see at a glance. It isn&apos;t a grade.
        </p>
      </div>

      <FormMessage error={state.error} notice={state.notice} />

      <div className="flex items-center gap-4">
        <input
          id={sliderId}
          name="completion_pct"
          type="range"
          min={0}
          max={100}
          step={10}
          value={pct}
          onChange={(event) => setPct(Number(event.target.value))}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-canvas-mid accent-white outline-none"
          aria-label="Percent complete"
        />
        <span className="numeric w-12 text-right body-md text-ink">{pct}%</span>
      </div>

      <Button
        type="submit"
        size="sm"
        disabled={pending || pct === value}
        className="self-start"
      >
        {pending ? "Saving…" : "Save progress"}
      </Button>
    </form>
  )
}
