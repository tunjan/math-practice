import * as React from "react"
import Link from "next/link"
import { CalendarClock, CircleCheck, ClipboardList, UserPlus } from "lucide-react"
import { cn } from "cn"

import { EmptyState, Page, PageHeader } from "@/components/brand/primitives"
import { NewTaskDialog } from "@/components/assignments/new-task-dialog"
import { StatusBadge } from "@/components/assignments/status-badge"
import { ButtonLink } from "@/components/ui/button"
import { formatDue, relativeToNow } from "@/lib/assignments/dates"
import type { AssignmentRow } from "@/lib/assignments/model"
import type { TaskOptions } from "@/lib/assignments/task-options"

export type OverviewRow = AssignmentRow & { overdue: boolean }

/**
 * The tutor's overview, to DESIGN.md › Layout: a 64px page header with the
 * page name and the one black action, then the content in a 1280px column.
 * Surfaces are white on white, told apart by hairlines alone.
 */
export function TutorOverview({
  stats,
  attention,
  upcoming,
  hasTasks,
  now,
  timeZone,
  taskOptions,
}: {
  stats: { label: string; value: number }[]
  /** Hand-ins to review, overdue work and returned tasks, most pressing first. */
  attention: OverviewRow[]
  /** Not handed in and due within seven days, soonest first. */
  upcoming: OverviewRow[]
  hasTasks: boolean
  now: Date
  timeZone: string
  taskOptions: TaskOptions
}) {
  return (
    <OverviewFrame
      actions={
        <>
          <ButtonLink href="/tutor/students" className="hidden sm:inline-flex">
            <UserPlus aria-hidden />
            Invite student
          </ButtonLink>
          <NewTaskDialog {...taskOptions} />
        </>
      }
    >
      <dl className="grid grid-cols-2 rounded-lg border border-outline lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              "flex min-w-0 flex-col gap-1 p-4",
              index % 2 === 1 && "border-l border-outline",
              index >= 2 && "border-t border-outline lg:border-t-0",
              index > 0 && "lg:border-l"
            )}
          >
            <dt className="truncate text-sm leading-5 text-on-surface-muted">{stat.label}</dt>
            <dd className="text-2xl leading-8 font-semibold text-on-surface tabular-nums">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Section
          title="Needs your attention"
          action={
            attention.length > 0 ? (
              <ButtonLink href="/tutor/assignments" variant="ghost" size="sm">
                View all
              </ButtonLink>
            ) : null
          }
        >
          {attention.length === 0 ? (
            hasTasks ? (
              <Empty
                icon={<CircleCheck />}
                title="All caught up"
                description="Hand-ins and overdue work will show up here."
              />
            ) : (
              <Empty
                icon={<ClipboardList />}
                title="No tasks yet"
                description="Set a problem set or some reading, pick a deadline, and it lands in the student's list."
              />
            )
          ) : (
            <CardList>
              {attention.map((row) => (
                <CardRow key={row.id} row={row}>
                  <span className="hidden shrink-0 text-sm text-on-surface-muted tabular-nums md:block">
                    {formatDue(row.dueAt, timeZone)}
                  </span>
                  <StatusBadge stage={row.stage} verdict={row.verdict} overdue={row.overdue} />
                </CardRow>
              ))}
            </CardList>
          )}
        </Section>

        <Section title="Due this week">
          {upcoming.length === 0 ? (
            <Empty icon={<CalendarClock />} title="Nothing due in the next 7 days" />
          ) : (
            <CardList>
              {upcoming.map((row) => (
                <CardRow key={row.id} row={row}>
                  <span className="flex shrink-0 flex-col items-end">
                    <span className="text-sm leading-6 text-on-surface-secondary tabular-nums">
                      {formatDue(row.dueAt, timeZone)}
                    </span>
                    <span className="text-xs leading-4 text-on-surface-muted">
                      {relativeToNow(row.dueAt, now)}
                    </span>
                  </span>
                </CardRow>
              ))}
            </CardList>
          )}
        </Section>
      </div>
    </OverviewFrame>
  )
}

const FIRST_STEPS = [
  {
    title: "Invite a student",
    description: "Create a link and send it to them. They choose their own email and password.",
  },
  {
    title: "Set a task",
    description: "A problem set or some reading, with a deadline. You can do this before they've joined.",
  },
  {
    title: "Review the hand-in",
    description: "Their work comes back here. Approve it, or return it with feedback.",
  },
] as const

/**
 * A tutor's first visit: nobody enrolled, nobody invited, nothing set. Four
 * zeros and two empty lists say nothing, so show the way in instead.
 */
export function TutorWelcome({ firstName }: { firstName?: string }) {
  return (
    <OverviewFrame>
      <div className="flex max-w-2xl flex-col gap-6 pt-3 sm:pt-7">
        <header className="flex flex-col gap-2">
          <h2 className="font-display text-3xl leading-[1.2] font-medium text-balance text-on-surface">
            {firstName ? `Welcome, ${firstName}` : "Welcome"}
          </h2>
          <p className="text-base leading-6 text-on-surface-muted">
            Your workspace is ready. Three steps take it from empty to a marked task.
          </p>
        </header>
        <ol role="list" className="divide-y divide-outline rounded-lg border border-outline">
          {FIRST_STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3 px-4 py-3">
              <span
                aria-hidden
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-xs font-medium text-on-surface-secondary tabular-nums"
              >
                {index + 1}
              </span>
              <div className="flex min-w-0 flex-col">
                <p className="text-sm leading-6 font-semibold text-on-surface">{step.title}</p>
                <p className="text-sm leading-5 text-on-surface-muted">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
        <ButtonLink href="/tutor/students" variant="primary" className="w-fit">
          <UserPlus aria-hidden />
          Invite your first student
        </ButtonLink>
      </div>
    </OverviewFrame>
  )
}

function OverviewFrame({
  actions,
  children,
}: {
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Page data-slot="tutor-overview" header={<PageHeader title="Overview" actions={actions} />}>
      {children}
    </Page>
  )
}

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex min-h-8 items-center justify-between gap-4">
        <h2 className="text-base leading-6 font-medium text-on-surface">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** Rows that share borders to read as one 12px block (DESIGN.md › Card list). */
function CardList({ children }: { children: React.ReactNode }) {
  return (
    <ul role="list" className="divide-y divide-outline rounded-lg border border-outline">
      {children}
    </ul>
  )
}

function CardRow({ row, children }: { row: OverviewRow; children: React.ReactNode }) {
  return (
    <li className="first:*:rounded-t-[11px] last:*:rounded-b-[11px]">
      <Link
        href={`/tutor/assignments/${row.id}`}
        className="flex items-center gap-4 px-4 py-3 transition-colors duration-100 hover:bg-surface-muted"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm leading-6 font-semibold text-on-surface">{row.title}</span>
          <span className="truncate text-sm leading-5 text-on-surface-muted">{row.studentName}</span>
        </span>
        {children}
      </Link>
    </li>
  )
}

function Empty(props: { icon: React.ReactNode; title: string; description?: string }) {
  return <EmptyState {...props} className="rounded-lg border border-outline" />
}
