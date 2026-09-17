"use client"

import { useActionState } from "react"
import { CheckCircle2, RotateCcw, Undo2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FormMessage } from "@/components/auth/form-message"
import { Eyebrow } from "@/components/brand/primitives"
import {
  clearVerdict,
  setVerdict,
  type ReviewState,
} from "@/lib/assignments/actions"
import type { ReviewVerdict } from "@/lib/assignments/model"

/**
 * The tutor's verdict.
 *
 * Kept visually and structurally apart from the student's completion slider:
 * "I've done 80%" and "this is approved" are different claims by different
 * people, and the interface should never let one be mistaken for the other.
 */
export function ReviewPanel({
  assignmentId,
  verdict,
  reviewedAt,
  hasSubmission,
}: {
  assignmentId: string
  verdict: ReviewVerdict | null
  reviewedAt: string | null
  hasSubmission: boolean
}) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(
    setVerdict,
    {}
  )
  const [clearState, clearAction, clearing] = useActionState<
    ReviewState,
    FormData
  >(clearVerdict, {})

  if (verdict) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-hairline bg-canvas-card p-6">
        <Eyebrow size="sm">Your review</Eyebrow>

        <div className="flex flex-col gap-1">
          <p className="display-xs text-ink">
            {verdict === "approved" ? "Approved" : "Changes requested"}
          </p>
          {reviewedAt ? (
            <p className="body-sm text-body-mid">
              {new Date(reviewedAt).toLocaleString(undefined, {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          ) : null}
        </div>

        <FormMessage error={clearState.error} notice={clearState.notice} />

        <form action={clearAction}>
          <input type="hidden" name="assignment_id" value={assignmentId} />
          <Button type="submit" size="sm" variant="ghost" disabled={clearing}>
            <Undo2 />
            {clearing ? "Withdrawing…" : "Withdraw review"}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-hairline bg-canvas-card p-6">
      <div className="flex flex-col gap-1">
        <Eyebrow size="sm">Review</Eyebrow>
        <p className="body-sm text-body-mid">
          {hasSubmission
            ? "You can leave detailed feedback in the discussion below."
            : "Nothing has been handed in yet — you can still record a verdict."}
        </p>
      </div>

      <FormMessage error={state.error} notice={state.notice} />

      <div className="flex flex-wrap gap-3">
        <form action={action}>
          <input type="hidden" name="assignment_id" value={assignmentId} />
          <input type="hidden" name="verdict" value="approved" />
          <Button type="submit" variant="primary" disabled={pending}>
            <CheckCircle2 />
            Approve
          </Button>
        </form>

        <form action={action}>
          <input type="hidden" name="assignment_id" value={assignmentId} />
          <input type="hidden" name="verdict" value="changes_requested" />
          <Button type="submit" disabled={pending}>
            <RotateCcw />
            Return for revision
          </Button>
        </form>
      </div>
    </div>
  )
}
