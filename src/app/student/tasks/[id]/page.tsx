import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  Band,
  Container,
  Eyebrow,
  PageHeader,
  StatusDot,
} from "@/components/brand/primitives"
import { Badge } from "@/components/ui/badge"
import { ButtonLink } from "@/components/ui/button"
import { FileList } from "@/components/assignments/file-list"
import { LifecycleTracker } from "@/components/assignments/lifecycle-tracker"
import { MathProse } from "@/components/assignments/math-prose"
import { CompletionControl } from "@/components/student/completion-control"
import { OpenReceipt } from "@/components/student/open-receipt"
import {
  SubmissionPanel,
  type SubmittedRevision,
} from "@/components/student/submission-panel"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
import { formatDue, isOverdue, relativeToNow } from "@/lib/assignments/dates"
import { MATERIALS_BUCKET, SUBMISSIONS_BUCKET } from "@/lib/assignments/files"
import { signFiles } from "@/lib/assignments/signing"
import {
  asStage,
  statusAccent,
  statusLabel,
  TYPE_LABEL,
  type DotAccentLike,
} from "@/lib/assignments/model"

export const metadata: Metadata = { title: "Task · Maths Tasks" }
export const dynamic = "force-dynamic"

export default async function StudentTaskPage({
  params,
}: PageProps<"/student/tasks/[id]">) {
  const profile = await requireRole("student")
  const { id } = await params
  const supabase = await createClient()

  // RLS already limits this to the student's own work; the row simply will not
  // be found if it belongs to someone else.
  const { data: assignment } = await supabase
    .from("assignments")
    .select(
      `id, title, description, type, due_at, stage, verdict, reviewed_at,
       student_opened_at, submitted_at, created_at, completion_pct,
       categories(name, accent_key)`
    )
    .eq("id", id)
    .maybeSingle()

  if (!assignment) notFound()

  const [{ data: materialRows }, { data: submissionRows }] = await Promise.all([
    supabase
      .from("assignment_files")
      .select("id, file_name, mime_type, size_bytes, storage_path")
      .eq("assignment_id", id)
      .order("sort_order"),
    supabase
      .from("submissions")
      .select("id, file_name, mime_type, size_bytes, storage_path, created_at, revision")
      .eq("assignment_id", id)
      .order("revision", { ascending: false })
      .order("created_at", { ascending: true }),
  ])

  const [materials, signedSubmissions] = await Promise.all([
    signFiles(supabase, MATERIALS_BUCKET, materialRows ?? []),
    signFiles(supabase, SUBMISSIONS_BUCKET, submissionRows ?? []),
  ])

  // Group the flat file list back into the revisions it was handed in as.
  const byRevision = new Map<number, SubmittedRevision>()
  ;(submissionRows ?? []).forEach((row, index) => {
    const signed = signedSubmissions[index]!
    const existing = byRevision.get(row.revision)
    const file = { ...signed, submissionId: row.id }

    if (existing) {
      existing.files.push(file)
    } else {
      byRevision.set(row.revision, {
        revision: row.revision,
        createdAt: row.created_at,
        files: [file],
      })
    }
  })
  const revisions = [...byRevision.values()].sort(
    (a, b) => b.revision - a.revision
  )

  const stage = asStage(assignment.stage)
  const overdue =
    isOverdue(assignment.due_at) && stage !== "submitted" && stage !== "reviewed"

  return (
    <Band>
      <OpenReceipt
        assignmentId={id}
        alreadyOpened={assignment.student_opened_at !== null}
      />

      <Container className="flex flex-col gap-10">
        <PageHeader
          eyebrow={TYPE_LABEL[assignment.type]}
          title={assignment.title}
          description={`Due ${formatDue(assignment.due_at)} · ${relativeToNow(assignment.due_at)}`}
          action={<ButtonLink href="/student">Back</ButtonLink>}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="strong">
            <StatusDot accent={statusAccent(stage, assignment.verdict, overdue)} />
            {overdue && !assignment.verdict
              ? "Overdue"
              : statusLabel(stage, assignment.verdict)}
          </Badge>
          {assignment.categories ? (
            <Badge>
              <StatusDot
                accent={assignment.categories.accent_key as DotAccentLike}
              />
              {assignment.categories.name}
            </Badge>
          ) : null}
        </div>

        {/* The tutor's verdict, stated plainly when there is one. */}
        {assignment.verdict ? (
          <div
            className={
              assignment.verdict === "approved"
                ? "rounded-lg border border-white/25 bg-canvas-card p-6"
                : "rounded-lg border border-sunset/40 bg-canvas-card p-6"
            }
          >
            <div className="flex flex-col gap-1">
              <Eyebrow size="sm">Your tutor</Eyebrow>
              <p className="display-xs text-ink">
                {assignment.verdict === "approved"
                  ? "Approved"
                  : "Asked for another go"}
              </p>
              <p className="body-sm text-body-mid">
                {assignment.verdict === "approved"
                  ? "Nothing more needed on this one."
                  : "Have a look at the discussion, then hand in a revision below."}
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-10">
            {assignment.description ? (
              <section className="flex flex-col gap-4">
                <Eyebrow>What to do</Eyebrow>
                <MathProse>{assignment.description}</MathProse>
              </section>
            ) : null}

            <section className="flex flex-col gap-4">
              <Eyebrow>Materials</Eyebrow>
              <FileList
                files={materials}
                emptyLabel="Your tutor didn't attach anything to this one."
              />
            </section>

            <SubmissionPanel
              assignmentId={id}
              studentId={profile.id}
              revisions={revisions}
              locked={assignment.verdict !== null}
            />
          </div>

          <aside className="flex flex-col gap-6">
            <CompletionControl
              assignmentId={id}
              value={assignment.completion_pct}
            />

            <div className="flex flex-col gap-4 rounded-lg border border-hairline bg-canvas-card p-6">
              <Eyebrow size="sm">Progress</Eyebrow>
              <LifecycleTracker
                stage={stage}
                timestamps={{
                  assigned: assignment.created_at,
                  opened: assignment.student_opened_at,
                  submitted: assignment.submitted_at,
                  reviewed: assignment.reviewed_at,
                }}
              />
            </div>
          </aside>
        </div>
      </Container>
    </Band>
  )
}
