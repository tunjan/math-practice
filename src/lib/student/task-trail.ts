import type { SignedFile } from "@/components/assignments/file-list"
import type { ReviewVerdict, Stage } from "@/lib/assignments/model"

export type WorkFile = SignedFile & { submissionId: string }

/** One handed-in revision. */
export type HandIn = { revision: number; at: string; files: WorkFile[] }

/** A tutor's verdict, any note they wrote with it, and the hand-in it judged. */
export type Review = {
  verdict: ReviewVerdict
  feedback: string | null
  at: string
  handedInAt: string | null
}

/**
 * Where the student stands: still working towards a hand-in, waiting on the
 * tutor, or done. Everything the trail shows as "current" follows from this.
 */
export type Phase = "working" | "waiting" | "approved"

export function phaseOf(stage: Stage, verdict: ReviewVerdict | null): Phase {
  if (verdict === "approved") return "approved"
  if (stage === "submitted" && verdict === null) return "waiting"
  return "working"
}

/** Only one task dialog is open at a time, so its title can have a fixed id. */
export const TASK_TITLE_ID = "task-dialog-title"
