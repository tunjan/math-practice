import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Pencil } from "lucide-react"

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
import { ReviewPanel } from "@/components/assignments/review-panel"
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

export default async function AssignmentDetailPage({
  params,
}: PageProps<"/tutor/assignments/[id]">) {
  await requireRole("tutor")
  const { id } = await params
  const supabase = await createClient()

  const { data: assignment } = await supabase
    .from("assignments")
    .select(
      `id, title, description, type, due_at, stage, verdict, reviewed_at,
       student_opened_at, submitted_at, created_at, completion_pct,
       categories(name, accent_key),
       profiles!assignments_student_id_fkey(id, full_name, email)`
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
      .order("created_at", { ascending: false }),
  ])

  const [materials, submissions] = await Promise.all([
    signFiles(supabase, MATERIALS_BUCKET, materialRows ?? []),
    signFiles(supabase, SUBMISSIONS_BUCKET, submissionRows ?? []),
  ])

  const stage = asStage(assignment.stage)
  const overdue =
    isOverdue(assignment.due_at) && stage !== "submitted" && stage !== "reviewed"

  return (
    <Band>
      <Container className="flex flex-col gap-10">
        <PageHeader
          eyebrow={TYPE_LABEL[assignment.type]}
          title={assignment.title}
          description={`${assignment.profiles?.full_name || "Unknown student"} · due ${formatDue(assignment.due_at)} (${relativeToNow(assignment.due_at)})`}
          action={
            <ButtonLink href={`/tutor/assignments/${id}/edit`}>
              <Pencil />
              Edit
            </ButtonLink>
          }
        />

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="strong">
            <StatusDot
              accent={statusAccent(stage, assignment.verdict, overdue)}
            />
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
          <Badge variant="muted">
            Student reports {assignment.completion_pct}% done
          </Badge>
        </div>

        {/* Lifecycle */}
        <section className="flex flex-col gap-4 rounded-lg border border-hairline bg-canvas-card p-6">
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
          {!assignment.student_opened_at ? (
            <p className="body-sm text-body-mid">
              {assignment.profiles?.full_name || "The student"} hasn&apos;t opened
              this yet.
            </p>
          ) : null}
        </section>

        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-10">
            {assignment.description ? (
              <section className="flex flex-col gap-4">
                <Eyebrow>Instructions</Eyebrow>
                <MathProse>{assignment.description}</MathProse>
              </section>
            ) : null}

            <section className="flex flex-col gap-4">
              <Eyebrow>Materials</Eyebrow>
              <FileList files={materials} emptyLabel="No materials attached." />
            </section>

            <section className="flex flex-col gap-4">
              <Eyebrow>Submitted work</Eyebrow>
              <FileList
                files={submissions}
                emptyLabel="Nothing handed in yet."
              />
            </section>
          </div>

          <aside className="flex flex-col gap-6">
            <ReviewPanel
              assignmentId={id}
              verdict={assignment.verdict}
              reviewedAt={assignment.reviewed_at}
              hasSubmission={submissions.length > 0}
            />
          </aside>
        </div>
      </Container>
    </Band>
  )
}
