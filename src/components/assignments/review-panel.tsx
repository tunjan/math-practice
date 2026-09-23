"use client"

import { useActionState, useId, useState } from "react"
import { Check, RotateCcw, Undo2 } from "lucide-react"

import { MathProse } from "@/components/assignments/math-prose"
import { FormMessage } from "@/components/auth/form-message"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardSection } from "@/components/ui/card"
import { Field } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { clearVerdict, setVerdict, type ReviewState } from "@/lib/assignments/actions"
import type { ReviewVerdict } from "@/lib/assignments/model"
import { LOCALE } from "@/lib/assignments/dates"

/**
 * The tutor's verdict, with an optional written note (required when asking
 * for changes). Approve is the page's one filled action; asking for changes
 * is secondary. A recorded verdict can be withdrawn, quietly.
 */
export function ReviewPanel({
  assignmentId,
  verdict,
  feedback,
  reviewedAt,
  hasSubmission,
  timeZone,
}: {
  assignmentId: string
  verdict: ReviewVerdict | null
  feedback: string | null
  reviewedAt: string | null
  hasSubmission: boolean
  timeZone: string
}) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(setVerdict, {})
  const [clearState, clearAction, clearing] = useActionState<ReviewState, FormData>(
    clearVerdict,
    {}
  )
  // Controlled so a rejected submit (e.g. no feedback) doesn't wipe the draft.
  const [draft, setDraft] = useState("")
  const feedbackId = useId()

  if (verdict) {
    return (
      <Card>
        <CardHeader
          title="Review"
          action={
            <Badge variant={verdict === "approved" ? "success" : "warning"}>
              {verdict === "approved" ? "Approved" : "Changes requested"}
            </Badge>
          }
        />
        <CardSection className="flex flex-col gap-4">
          <p className="body-md text-on-surface-secondary">
            {verdict === "approved"
              ? "You approved this work. The student sees it as finished."
              : "You asked for changes. The student can hand in a new revision."}
          </p>
          {feedback ? (
            <div className="rounded-md border border-outline bg-surface-sunken px-4 py-3">
              <MathProse>{feedback}</MathProse>
            </div>
          ) : null}
          {reviewedAt ? (
            <p className="mono-data-sm text-on-surface-muted">
              {new Date(reviewedAt).toLocaleString(LOCALE, {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                timeZone,
              })}
            </p>
          ) : null}
          <FormMessage error={clearState.error} notice={clearState.notice} />
          <form action={clearAction}>
            <input type="hidden" name="assignment_id" value={assignmentId} />
            <Button type="submit" variant="ghost" size="sm" disabled={clearing} className="-ml-3">
              <Undo2 aria-hidden />
              {clearing ? "Withdrawing" : "Withdraw verdict"}
            </Button>
          </form>
        </CardSection>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Review"
        description={
          hasSubmission
            ? "Work has been handed in. Your verdict updates the student's list."
            : "Nothing handed in yet. You can still sign it off."
        }
      />
      <CardSection className="flex flex-col gap-3">
        <FormMessage error={state.error} notice={state.notice} />
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="assignment_id" value={assignmentId} />
          <Field
            label="Feedback"
            htmlFor={feedbackId}
            hint="Required when asking for changes. Markdown and $maths$ work."
          >
            <Textarea
              id={feedbackId}
              name="feedback"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={5000}
              rows={5}
              className="min-h-28"
              placeholder="What went well, and what to change."
            />
          </Field>
          <Button
            type="submit"
            name="verdict"
            value="approved"
            variant="primary"
            disabled={pending}
            className="w-full"
          >
            <Check aria-hidden />
            Approve
          </Button>
          <Button
            type="submit"
            name="verdict"
            value="changes_requested"
            disabled={pending}
            className="w-full"
          >
            <RotateCcw aria-hidden />
            Request changes
          </Button>
        </form>
      </CardSection>
    </Card>
  )
}
