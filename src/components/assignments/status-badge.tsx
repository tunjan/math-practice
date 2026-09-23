import { Badge } from "@/components/ui/badge"
import {
  assignmentStatus,
  type ReviewVerdict,
  type Stage,
} from "@/lib/assignments/model"

/** The one way a task's condition is shown, in every table and header. */
export function StatusBadge({
  stage,
  verdict,
  overdue,
}: {
  stage: Stage
  verdict: ReviewVerdict | null
  overdue: boolean
}) {
  const { label, tone } = assignmentStatus(stage, verdict, overdue)
  return <Badge variant={tone}>{label}</Badge>
}

