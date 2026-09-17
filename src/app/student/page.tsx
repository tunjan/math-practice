import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"

import { cn } from "cn"
import {
  Band,
  Container,
  EmptyState,
  Eyebrow,
  PageHeader,
  StatusDot,
} from "@/components/brand/primitives"
import { Badge } from "@/components/ui/badge"
import { ButtonLink } from "@/components/ui/button"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
import { formatDue, isOverdue, relativeToNow } from "@/lib/assignments/dates"
import {
  asStage,
  statusAccent,
  statusLabel,
  TYPE_LABEL,
  type DotAccentLike,
} from "@/lib/assignments/model"

export const metadata: Metadata = { title: "Practice · Maths Tasks" }
export const dynamic = "force-dynamic"

export default async function StudentPracticePage() {
  const profile = await requireRole("student")
  const supabase = await createClient()

  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      `id, title, type, due_at, stage, verdict, completion_pct,
       categories(name, accent_key)`
    )
    .order("due_at", { ascending: true })

  const all = assignments ?? []
  // "Done" means the tutor signed it off — not that the student handed it in.
  // Work that is submitted but unreviewed is still live as far as they should
  // be concerned.
  const active = all.filter((task) => task.verdict !== "approved")
  const completed = all.filter((task) => task.verdict === "approved")

  const upNext = active[0]
  const rest = active.slice(1)

  const firstName = profile.fullName.split(" ")[0] || "there"

  return (
    <Band>
      <Container width="wide" className="flex flex-col gap-10">
        <PageHeader
          eyebrow="Practice"
          title={`Hello, ${firstName}`}
          description={
            active.length === 0
              ? "Nothing outstanding — nice work."
              : `${active.length} task${active.length === 1 ? "" : "s"} on the go.`
          }
        />

        {/* Up next: the single most pressing thing, given the room to be read. */}
        {upNext ? (
          <section className="flex flex-col gap-5 rounded-lg border border-white/25 bg-canvas-card p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow size="sm" className="text-ink">
                Up next
              </Eyebrow>
              <span aria-hidden className="text-body-mid">
                ·
              </span>
              <span
                className={cn(
                  "eyebrow-sm",
                  isOverdue(upNext.due_at) ? "text-destructive" : "text-body-mid"
                )}
              >
                {isOverdue(upNext.due_at) ? "Overdue" : "Due"}{" "}
                {relativeToNow(upNext.due_at)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="display-sm text-ink">{upNext.title}</h2>
              <p className="body-md text-body-mid">
                {TYPE_LABEL[upNext.type]} · {formatDue(upNext.due_at)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="strong">
                <StatusDot
                  accent={statusAccent(
                    asStage(upNext.stage),
                    upNext.verdict,
                    isOverdue(upNext.due_at)
                  )}
                />
                {statusLabel(asStage(upNext.stage), upNext.verdict)}
              </Badge>
              {upNext.categories ? (
                <Badge>
                  <StatusDot
                    accent={upNext.categories.accent_key as DotAccentLike}
                  />
                  {upNext.categories.name}
                </Badge>
              ) : null}
              {upNext.completion_pct > 0 ? (
                <Badge variant="muted">{upNext.completion_pct}% done</Badge>
              ) : null}
            </div>

            <ButtonLink
              variant="primary"
              size="lg"
              href={`/student/tasks/${upNext.id}`}
              className="self-start"
            >
              Open it
              <ArrowRight />
            </ButtonLink>
          </section>
        ) : (
          <EmptyState
            icon={<CheckCircle2 className="size-6" />}
            title="Nothing due"
            description="You're all caught up. Ask for a challenge if you want more practice."
          />
        )}

        {/* Everything else still live */}
        {rest.length > 0 ? (
          <section className="flex flex-col gap-3">
            <Eyebrow>Also on</Eyebrow>
            <ul className="flex flex-col gap-2">
              {rest.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/student/tasks/${task.id}`}
                    className="flex items-center gap-4 rounded-lg border border-hairline bg-canvas-card px-4 py-3 transition-colors hover:border-white/25"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate body-md text-ink">
                        {task.title}
                      </span>
                      <span className="body-sm text-body-mid">
                        {TYPE_LABEL[task.type]} · due {formatDue(task.due_at)}
                      </span>
                    </span>

                    <Badge variant="strong" className="shrink-0">
                      <StatusDot
                        accent={statusAccent(
                          asStage(task.stage),
                          task.verdict,
                          isOverdue(task.due_at)
                        )}
                      />
                      {isOverdue(task.due_at) && !task.verdict
                        ? "Overdue"
                        : statusLabel(asStage(task.stage), task.verdict)}
                    </Badge>

                    <ArrowRight className="size-4 shrink-0 text-body-mid" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Finished work, kept but pushed down */}
        {completed.length > 0 ? (
          <section className="flex flex-col gap-3 border-t border-hairline pt-8">
            <Eyebrow>Approved</Eyebrow>
            <ul className="flex flex-col gap-2">
              {completed.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/student/tasks/${task.id}`}
                    className="flex items-center gap-4 rounded-lg border border-hairline px-4 py-3 transition-colors hover:border-white/25"
                  >
                    <StatusDot accent="twilight" />
                    <span className="min-w-0 flex-1 truncate body-sm text-body">
                      {task.title}
                    </span>
                    <span className="eyebrow-sm shrink-0 text-body-mid">
                      {formatDue(task.due_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </Band>
  )
}
