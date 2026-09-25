import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Pencil } from "lucide-react"

import { Page, PageHeader } from "@/components/brand/primitives"
import { FileList, type SignedFile } from "@/components/assignments/file-list"
import { LifecycleTracker } from "@/components/assignments/lifecycle-tracker"
import { MathProse } from "@/components/assignments/math-prose"
import { ReviewPanel } from "@/components/assignments/review-panel"
import { StatusBadge } from "@/components/assignments/status-badge"
import { TaskComments } from "@/components/assignments/task-comments"
import { ButtonLink } from "@/components/ui/button"
import { Card, CardHeader, CardSection, DetailList } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
import { loadComments } from "@/lib/assignments/comments"
import { formatDue, isOverdue, relativeToNow } from "@/lib/assignments/dates"
import { MATERIALS_BUCKET, SUBMISSIONS_BUCKET } from "@/lib/assignments/files"
import { signFiles } from "@/lib/assignments/signing"
import { asStage, TYPE_LABEL } from "@/lib/assignments/model"
import { TopicTags } from "@/components/syllabus/topic-tags"
import { toTopicTags } from "@/lib/syllabus/model"

export const metadata: Metadata = { title: "Task · Maths Tasks" }
export const dynamic = "force-dynamic"

type Revision = { revision: number; handedInAt: string; files: SignedFile[] }

export default async function AssignmentDetailPage({
  params,
}: PageProps<"/tutor/assignments/[id]">) {
  const profile = await requireRole("tutor")
  const { id } = await params
  const supabase = await createClient()
  const tz = profile.timezone

  const { data: assignment } = await supabase
    .from("assignments")
    .select(
      `id, student_id, title, description, type, due_at, stage, verdict, feedback, reviewed_at,
       student_opened_at, submitted_at, created_at, completion_pct,
       categories(name), assignment_topics(syllabus_topics(code, title, topic, subtopic)),
       profiles!assignments_student_id_fkey(id, full_name, email)`
    )
    .eq("id", id)
    .maybeSingle()

  if (!assignment) notFound()

  const syllabusTags = toTopicTags(assignment.assignment_topics)
  const studentName =
    assignment.profiles?.full_name || assignment.profiles?.email || "Unknown student"

  const [{ data: materialRows }, { data: submissionRows }, comments] = await Promise.all([
    supabase
      .from("assignment_files")
      .select("id, file_name, mime_type, size_bytes, storage_path")
      .eq("assignment_id", id)
      .order("sort_order"),
    supabase
      .from("submissions")
      .select("id, file_name, mime_type, size_bytes, storage_path, created_at, revision, handed_in_at")
      .eq("assignment_id", id)
      // Drafts are the student's until handed in (including after an unsubmit).
      .not("handed_in_at", "is", null)
      .order("revision", { ascending: false })
      .order("created_at", { ascending: true }),
    loadComments(
      supabase,
      [{ id, studentId: assignment.student_id, studentName }],
      profile.id
    ),
  ])

  const [materials, submissions] = await Promise.all([
    signFiles(supabase, MATERIALS_BUCKET, materialRows ?? []),
    signFiles(supabase, SUBMISSIONS_BUCKET, submissionRows ?? []),
  ])

  const revisions: Revision[] = []
  ;(submissionRows ?? []).forEach((row, index) => {
    const file = submissions[index]!
    const last = revisions.at(-1)
    if (last && last.revision === row.revision) last.files.push(file)
    else
      revisions.push({
        revision: row.revision,
        handedInAt: row.handed_in_at ?? row.created_at,
        files: [file],
      })
  })

  const stage = asStage(assignment.stage)
  const overdue =
    isOverdue(assignment.due_at) && stage !== "submitted" && stage !== "reviewed"

  return (
    <Page>
      <PageHeader
        back={{ href: "/tutor/assignments", label: "Assignments" }}
        title={assignment.title}
        meta={<StatusBadge stage={stage} verdict={assignment.verdict} overdue={overdue} />}
        description={`${studentName}, due ${formatDue(assignment.due_at, tz)} (${relativeToNow(assignment.due_at)})`}
        actions={
          <ButtonLink href={`/tutor/assignments/${id}/edit`}>
            <Pencil aria-hidden />
            Edit
          </ButtonLink>
        }
      />

      <Card>
        <CardSection className="flex flex-col gap-5">
          <LifecycleTracker
            timeZone={tz}
            stage={stage}
            timestamps={{
              assigned: assignment.created_at,
              opened: assignment.student_opened_at,
              submitted: assignment.submitted_at,
              reviewed: assignment.reviewed_at,
            }}
          />
          {!assignment.student_opened_at ? (
            <p className="body-sm text-on-surface-muted">
              {studentName} hasn&apos;t opened this task yet.
            </p>
          ) : null}
        </CardSection>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="Hand-ins" description={revisions.length === 0 ? undefined : `${revisions.length} ${revisions.length === 1 ? "revision" : "revisions"}`} />
            {revisions.length === 0 ? (
              <p className="px-6 py-5 body-sm text-on-surface-muted">Nothing handed in yet.</p>
            ) : (
              revisions.map((revision) => (
                <section key={revision.revision} className="border-t border-outline first:border-t-0">
                  <div className="flex h-10 items-center justify-between gap-4 bg-surface-sunken px-6">
                    <span className="label-caps text-on-surface-muted">
                      Revision {revision.revision}
                    </span>
                    <span className="mono-data-sm text-on-surface-muted">
                      {formatDue(revision.handedInAt, tz)}
                    </span>
                  </div>
                  <FileList files={revision.files} />
                </section>
              ))
            )}
          </Card>

          <Card>
            <CardHeader title="Instructions" />
            <CardSection>
              {assignment.description ? (
                <MathProse>{assignment.description}</MathProse>
              ) : (
                <p className="body-sm text-on-surface-muted">No written instructions.</p>
              )}
            </CardSection>
          </Card>

          <Card>
            <CardHeader title="Materials" />
            <FileList files={materials} emptyLabel="No materials attached." />
          </Card>

          <Card>
            <CardSection>
              <TaskComments
                taskId={id}
                comments={comments.get(id) ?? []}
                viewer={{ role: "tutor", name: profile.fullName }}
                timeZone={tz}
              />
            </CardSection>
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <ReviewPanel
            assignmentId={id}
            verdict={assignment.verdict}
            feedback={assignment.feedback}
            reviewedAt={assignment.reviewed_at}
            hasSubmission={revisions.length > 0}
            timeZone={tz}
          />

          <Card>
            <CardHeader title="Details" />
            <DetailList
              items={[
                { label: "Student", value: studentName },
                { label: "Type", value: TYPE_LABEL[assignment.type] },
                { label: "Topic", value: assignment.categories?.name ?? "None" },
                ...(syllabusTags.length > 0
                  ? [{ label: "Syllabus", value: <TopicTags tags={syllabusTags} className="justify-end" /> }]
                  : []),
                {
                  label: "Due",
                  value: <span className="mono-data-sm">{formatDue(assignment.due_at, tz)}</span>,
                },
                {
                  label: "Set",
                  value: <span className="mono-data-sm">{formatDue(assignment.created_at, tz)}</span>,
                },
              ]}
            />
            <Progress
              value={assignment.completion_pct}
              label="Student’s estimate"
              className="border-t border-outline px-6 py-4"
            />
          </Card>
        </aside>
      </div>
    </Page>
  )
}
