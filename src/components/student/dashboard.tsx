import Link from "next/link"
import { ArrowRight, CalendarCheck, Flame, GraduationCap, MessageSquareText, Sprout } from "lucide-react"
import { cn } from "cn"

import { Dot } from "@/components/calendar/month-grid"
import { ScoreTrend } from "@/components/student/score-trend"
import { StarRating } from "@/components/syllabus/star-rating"
import { TopicTags } from "@/components/syllabus/topic-tags"
import { Badge, badgeVariants } from "@/components/ui/badge"
import { Card, CardHeader, CardSection, StatStrip } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/reui/timeline"
import { formatDue } from "@/lib/assignments/dates"
import { dayKeyOf, formatDay, formatDayShort, relativeDay, WEEKDAYS, type DayKey } from "@/lib/calendar/dates"
import type { DayPlacement } from "@/lib/calendar/model"
import {
  ACTIVITY_WEEKS,
  activityLevel,
  DUE_SOON_DAYS,
  MIN_SCORES,
  type Activity,
  type Agenda,
  type Dashboard,
  type FeedbackEntry,
  type NextExam,
  type SyllabusGlance,
} from "@/lib/student/dashboard"
import { STATUS_LABEL, TOPIC_NAME, topicColor } from "@/lib/syllabus/model"

/** The same greens as the tracker's By topic chart: seen, then in progress. */
const SEEN = "#15803d"
const IN_PROGRESS = "#5bc27f"

/** Heatmap shades, none to busiest, on the same green ramp. */
const LEVEL_FILL = ["bg-surface-sunken", "bg-[#bbf7d0]", "bg-[#5bc27f]", "bg-[#15803d]"] as const

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

/** A card-header link to the page with the full picture. */
function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group/more inline-flex items-center gap-1 rounded-md label-sm text-on-surface-secondary transition-colors hover:text-on-surface"
    >
      {children}
      <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover/more:translate-x-0.5" />
    </Link>
  )
}

// ── Above the board ─────────────────────────────────────────────────────────

/** Stats, then the week and the next exam side by side. */
export function DashboardOverview({ dashboard }: { dashboard: Dashboard }) {
  const showExam = dashboard.nextExam !== null || dashboard.hasCourse
  return (
    <div className="flex flex-col gap-4">
      <DashboardStats dashboard={dashboard} />
      <div className={cn("grid gap-4", showExam && "lg:grid-cols-3")}>
        <WeekAgenda agenda={dashboard.agenda} className={showExam ? "lg:col-span-2" : undefined} />
        {showExam ? <NextExamCard next={dashboard.nextExam} today={dashboard.today} /> : null}
      </div>
    </div>
  )
}

function DashboardStats({ dashboard }: { dashboard: Dashboard }) {
  const { stats, timeZone } = dashboard
  return (
    <StatStrip
      stats={[
        {
          label: "Due soon",
          value: stats.dueSoon,
          note: stats.nextDue ? (
            <Link href={`/student/tasks/${stats.nextDue.id}`} className="line-clamp-1 hover:text-on-surface hover:underline">
              Next: {stats.nextDue.title}, {formatDue(stats.nextDue.dueAt, timeZone)}
            </Link>
          ) : (
            `Nothing due in the next ${DUE_SOON_DAYS} days`
          ),
        },
        {
          label: "Overdue",
          value: <span className={stats.overdue > 0 ? "text-error" : undefined}>{stats.overdue}</span>,
          note: stats.overdue > 0 ? "Hand these in first" : "You're on time",
        },
        {
          label: "With your tutor",
          value: stats.withTutor,
          note:
            stats.toRevise > 0
              ? `${plural(stats.toRevise, "task")} back with feedback`
              : stats.withTutor > 0
                ? "Waiting for review"
                : "Nothing waiting",
        },
        {
          label: "Points",
          value: stats.balance.toLocaleString("en-GB"),
          note: (
            <Link href="/student/aviary" className="hover:text-on-surface hover:underline">
              {stats.earned.toLocaleString("en-GB")} earned in total
            </Link>
          ),
        },
      ]}
    />
  )
}

/** Monday to Sunday: deadlines, exams and events per day, planned topics across the top. */
function WeekAgenda({ agenda, className }: { agenda: Agenda; className?: string }) {
  const first = agenda.days[0]!.day
  const last = agenda.days.at(-1)!.day
  const empty = agenda.plans.length === 0 && agenda.days.every((day) => day.items.length === 0)

  return (
    <Card className={className}>
      <CardHeader
        title="This week"
        description={`${formatDayShort(first)} – ${formatDayShort(last)}`}
        action={<MoreLink href="/student/calendar">Calendar</MoreLink>}
      />
      {agenda.plans.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-outline px-6 py-3">
          <span className="mr-1 text-xs text-on-surface-muted">Planned</span>
          {agenda.plans.map((plan) => (
            <span
              key={plan.id}
              title={plan.topics.map((t) => `${t.code} ${t.title}`).join(", ")}
              className={badgeVariants({ variant: topicColor(plan.topic) })}
            >
              <span>
                {TOPIC_NAME[plan.topic] ?? `Topic ${plan.topic}`} ·{" "}
                <span className="font-mono tabular-nums">{plan.topics.map((t) => t.code).join(" ")}</span>
              </span>
            </span>
          ))}
        </div>
      ) : null}
      {empty ? (
        <Empty className="py-8">
          <EmptyMedia variant="icon">
            <CalendarCheck />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>A clear week</EmptyTitle>
            <EmptyDescription>No deadlines, exams or events between now and Sunday.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ol className="flex flex-1 flex-col">
          {agenda.days.map((day, index) => (
            <li
              key={day.day}
              aria-label={formatDay(day.day)}
              className={cn(
                "flex min-w-0 gap-4 border-t border-outline px-6 py-2.5 first:border-t-0",
                day.isToday && "bg-surface-muted",
                // On a phone, a quiet day is noise; today always shows.
                day.items.length === 0 && !day.isToday && "max-sm:hidden"
              )}
            >
              <span
                className={cn(
                  "flex w-20 shrink-0 items-center gap-1.5 self-start pt-0.5 text-xs",
                  day.isPast ? "text-on-surface-muted" : "text-on-surface-secondary"
                )}
              >
                <span className="w-7">{WEEKDAYS[index]!.short}</span>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full font-mono tabular-nums",
                    day.isToday && "bg-on-surface font-medium text-surface"
                  )}
                >
                  {Number(day.day.slice(8))}
                </span>
                {day.isToday ? <span className="sr-only">Today</span> : null}
              </span>
              {day.items.length > 0 ? (
                <ul className="flex min-w-0 flex-1 flex-col gap-0.5">
                  {day.items.map((placement) => (
                    <AgendaEntry key={`${placement.item.type}:${placement.item.id}`} placement={placement} />
                  ))}
                </ul>
              ) : (
                <span className="self-center text-xs text-on-surface-muted">{day.isToday ? "Nothing today" : "–"}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

function AgendaEntry({ placement }: { placement: DayPlacement }) {
  const { item, time } = placement
  const row = "flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-sm"

  if (item.type === "exam") {
    return (
      <li>
        <Link href={item.href} className={cn(row, "w-fit max-w-full bg-surface-inverse text-on-surface-inverse hover:opacity-90")}>
          <GraduationCap aria-hidden className="size-3.5 shrink-0" />
          <span className="truncate">Exam: {item.title}</span>
        </Link>
      </li>
    )
  }

  const body = (
    <>
      <Dot placement={placement} />
      <span className="min-w-0 flex-1 truncate text-on-surface">{item.title}</span>
      {item.type === "deadline" ? (
        <Badge variant={item.status.tone} className="hidden sm:inline-flex">
          {item.status.label}
        </Badge>
      ) : null}
      <span className="w-12 shrink-0 text-right font-mono text-xs text-on-surface-muted tabular-nums">
        {time ?? "All day"}
      </span>
    </>
  )

  return (
    <li title={item.title}>
      {item.type === "deadline" ? (
        <Link href={item.href} className={cn(row, "transition-colors hover:bg-surface-hover")}>
          {body}
        </Link>
      ) : (
        <span className={row}>{body}</span>
      )}
    </li>
  )
}

/** The countdown to the next class exam, and its topics weakest first. */
function NextExamCard({ next, today }: { next: NextExam | null; today: DayKey }) {
  return (
    <Card>
      <CardHeader title="Next exam" action={<MoreLink href="/student/syllabus">Exams</MoreLink>} />
      {next ? (
        <>
          <CardSection className="flex flex-col gap-1">
            <span className="flex items-baseline gap-2">
              <span className="display-num text-on-surface">{next.daysAway}</span>
              <span className="body-md text-on-surface-muted">
                {next.daysAway === 1 ? "day to go" : next.daysAway === 0 ? "days: it's today" : "days to go"}
              </span>
            </span>
            <span className="title-md text-on-surface">{next.exam.title}</span>
            <span className="body-sm text-on-surface-muted">
              {formatDay(next.exam.date)} · {relativeDay(next.exam.date, today)}
            </span>
          </CardSection>
          {next.topics.length > 0 ? (
            <CardSection className="flex flex-col gap-2 py-4">
              <span className="label-caps text-on-surface-muted">Review first</span>
              <ul className="flex flex-col">
                {next.topics.slice(0, 5).map((topic) => (
                  <li key={topic.tag.code} className="flex items-center gap-2 py-1">
                    <TopicTags tags={[topic.tag]} inline />
                    <span className="min-w-0 flex-1 truncate text-sm text-on-surface-secondary" title={topic.tag.title}>
                      {topic.tag.title}
                    </span>
                    {topic.stars > 0 ? (
                      <StarRating value={topic.stars} />
                    ) : (
                      <span className="text-xs text-on-surface-muted">
                        {topic.status ? STATUS_LABEL[topic.status] : "Not rated"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {next.topics.length > 5 ? (
                <span className="text-xs text-on-surface-muted">and {next.topics.length - 5} more</span>
              ) : null}
            </CardSection>
          ) : null}
        </>
      ) : (
        <Empty>
          <EmptyMedia variant="icon">
            <GraduationCap />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No exams coming up</EmptyTitle>
            <EmptyDescription>
              Add your class exams on the <Link href="/student/syllabus">Syllabus</Link> page to count down to them here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </Card>
  )
}

// ── Below the board ─────────────────────────────────────────────────────────

/** How the student is getting on: syllabus, activity, feedback and exam scores. */
export function DashboardInsights({ dashboard }: { dashboard: Dashboard }) {
  const showScores = dashboard.scores.length >= MIN_SCORES
  return (
    <section aria-labelledby="progress-heading" className="flex flex-col gap-4">
      <h2 id="progress-heading" className="headline-md text-on-surface">
        Your progress
      </h2>
      <div className={cn("grid gap-4 md:grid-cols-2", dashboard.syllabus && "xl:grid-cols-3")}>
        {dashboard.syllabus ? <SyllabusCard glance={dashboard.syllabus} /> : null}
        <ActivityCard activity={dashboard.activity} />
        <FeedbackCard
          entries={dashboard.feedback}
          timeZone={dashboard.timeZone}
          today={dashboard.today}
          className={cn(dashboard.syllabus && "md:col-span-2 xl:col-span-1")}
        />
      </div>
      {showScores ? <ScoreTrend scores={dashboard.scores} /> : null}
    </section>
  )
}

/** Seen / in progress / to see across the course, then per strand. */
function SyllabusCard({ glance }: { glance: SyllabusGlance }) {
  const pct = (n: number) => `${(n / glance.total) * 100}%`
  return (
    <Card>
      <CardHeader title="Syllabus" action={<MoreLink href="/student/syllabus">Tracker</MoreLink>} />
      <CardSection className="flex flex-col gap-3">
        <span className="flex items-baseline gap-2">
          <span className="display-num text-on-surface">
            {glance.seen}
            <span className="text-on-surface-muted">/{glance.total}</span>
          </span>
          <span className="body-md text-on-surface-muted">subtopics seen</span>
        </span>
        <span
          role="img"
          aria-label={`${glance.seen} seen, ${glance.inProgress} in progress, ${glance.toSee} to see`}
          className="flex h-2 overflow-hidden rounded-full bg-surface-sunken"
        >
          <span style={{ width: pct(glance.seen), background: SEEN }} />
          <span style={{ width: pct(glance.inProgress), background: IN_PROGRESS }} />
        </span>
        <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-muted">
          <Legend color={SEEN}>{glance.seen} seen</Legend>
          <Legend color={IN_PROGRESS}>{glance.inProgress} in progress</Legend>
          <Legend color="var(--surface-sunken)">{glance.toSee} to see</Legend>
          {glance.averageStars !== null ? <span className="ml-auto">{glance.averageStars.toFixed(1)} ★ average</span> : null}
        </span>
      </CardSection>
      <CardSection className="py-4">
        <ul className="flex flex-col gap-2.5">
          {glance.strands.map((strand) => (
            <li key={strand.topic} className="grid grid-cols-[1fr_5rem_2.75rem] items-center gap-3 text-sm">
              <span className="truncate text-on-surface-secondary">
                <span className="font-mono text-on-surface-muted tabular-nums">{strand.topic}</span>{" "}
                {TOPIC_NAME[strand.topic] ?? `Topic ${strand.topic}`}
              </span>
              <span aria-hidden className="flex h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                <span style={{ width: `${(strand.seen / strand.total) * 100}%`, background: SEEN }} />
                <span style={{ width: `${(strand.inProgress / strand.total) * 100}%`, background: IN_PROGRESS }} />
              </span>
              <span className="text-right font-mono text-xs text-on-surface-muted tabular-nums">
                {strand.seen}/{strand.total}
              </span>
            </li>
          ))}
        </ul>
      </CardSection>
    </Card>
  )
}

function Legend({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="size-2 rounded-[2px] border border-black/5" style={{ background: color }} />
      {children}
    </span>
  )
}

/** Weeks of the heatmap that fit a phone's width. */
const PHONE_WEEKS = 12

const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" })

/** A contribution graph of hand-ins and first opens, with the weekly streak. */
function ActivityCard({ activity }: { activity: Activity }) {
  const quiet = activity.activeDays === 0
  return (
    <Card>
      <CardHeader title="Activity" description={`Hand-ins and first opens, last ${ACTIVITY_WEEKS} weeks`} />
      {quiet ? (
        <Empty>
          <EmptyMedia variant="icon">
            <Sprout />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Nothing yet</EmptyTitle>
            <EmptyDescription>Open a task or hand one in and the day lights up here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <CardSection className="grid grid-cols-3 gap-4">
            <Figure
              value={activity.streakWeeks}
              label="week streak"
              hint="Weeks in a row with a hand-in"
              icon={<Flame aria-hidden className={cn("size-4", activity.streakWeeks > 0 ? "text-accent-orange" : "text-on-surface-muted")} />}
            />
            <Figure value={activity.handIns} label={activity.handIns === 1 ? "hand-in" : "hand-ins"} />
            <Figure value={activity.activeDays} label={activity.activeDays === 1 ? "active day" : "active days"} />
          </CardSection>
          <CardSection className="py-4">
            <ActivityGrid activity={activity} />
          </CardSection>
        </>
      )}
    </Card>
  )
}

function Figure({ value, label, hint, icon }: { value: number; label: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <span className="flex flex-col gap-0.5" title={hint}>
      <span className="flex items-center gap-1 font-mono text-xl leading-tight font-medium text-on-surface tabular-nums">
        {value}
        {icon}
      </span>
      <span className="text-xs text-on-surface-muted">{label}</span>
    </span>
  )
}

/**
 * A month's name over the first week that starts in it, unless the last
 * label is too close to fit (the window's first column is often mid-month).
 */
function monthLabels(weeks: Activity["weeks"]): (string | null)[] {
  const labels: (string | null)[] = []
  let lastLabel = -Infinity
  weeks.forEach((week, index) => {
    const starts = index === 0 || weeks[index - 1]!.start.slice(0, 7) !== week.start.slice(0, 7)
    if (starts && index - lastLabel >= 3) {
      lastLabel = index
      labels.push(MONTH.format(new Date(`${week.start}T00:00:00Z`)))
    } else {
      labels.push(null)
    }
  })
  return labels
}

function ActivityGrid({ activity }: { activity: Activity }) {
  const months = monthLabels(activity.weeks)

  return (
    <figure
      role="img"
      aria-label={`${activity.activeDays} active days and ${activity.handIns} hand-ins in the last ${ACTIVITY_WEEKS} weeks`}
      className="flex flex-col gap-2"
    >
      <div className="flex gap-1.5">
        <div aria-hidden className="grid shrink-0 grid-rows-[0.875rem_repeat(7,0.75rem)] gap-[3px] text-[10px] leading-3 text-on-surface-muted">
          <span />
          {WEEKDAYS.map((day, index) => (
            <span key={day.short}>{index % 2 === 0 ? day.short.slice(0, 1) : ""}</span>
          ))}
        </div>
        {activity.weeks.map((week, index) => (
          <div
            key={week.start}
            aria-hidden
            className={cn(
              "grid shrink-0 grid-rows-[0.875rem_repeat(7,0.75rem)] gap-[3px]",
              // A phone fits the latest dozen weeks.
              index < ACTIVITY_WEEKS - PHONE_WEEKS && "max-sm:hidden"
            )}
          >
            <span className="w-3 overflow-visible text-[10px] leading-3 whitespace-nowrap text-on-surface-muted">
              {months[index]}
            </span>
            {week.days.map((day) => (
              <span
                key={day.day}
                title={day.future ? undefined : activityTitle(day.day, day.count, day.handIns)}
                className={cn(
                  "size-3 rounded-[3px]",
                  day.future ? "bg-transparent" : LEVEL_FILL[activityLevel(day.count, activity.max)]
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <figcaption aria-hidden className="flex items-center justify-end gap-1 text-[10px] text-on-surface-muted">
        Less
        {LEVEL_FILL.map((fill) => (
          <span key={fill} className={cn("size-2.5 rounded-[2px]", fill)} />
        ))}
        More
      </figcaption>
    </figure>
  )
}

function activityTitle(day: DayKey, count: number, handIns: number): string {
  if (count === 0) return `${formatDayShort(day)}: nothing`
  const opens = count - handIns
  return `${formatDayShort(day)}: ${[handIns ? plural(handIns, "hand-in") : null, opens ? plural(opens, "task") + " opened" : null]
    .filter(Boolean)
    .join(", ")}`
}

const VERDICT = {
  approved: { label: "Approved", variant: "success" },
  changes_requested: { label: "Changes requested", variant: "warning" },
} as const

/** The tutor's latest verdicts, newest first, as a ReUI timeline. */
function FeedbackCard({
  entries,
  timeZone,
  today,
  className,
}: {
  entries: FeedbackEntry[]
  timeZone: string
  today: DayKey
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader title="Recent feedback" />
      {entries.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <MessageSquareText />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No feedback yet</EmptyTitle>
            <EmptyDescription>When your tutor reviews a hand-in, their verdict appears here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <CardSection>
          {/* Every entry has happened, so every step reads as completed. */}
          <Timeline value={entries.length}>
            {entries.map((entry, index) => {
              const verdict = VERDICT[entry.verdict]
              return (
                <TimelineItem key={`${entry.taskId}:${entry.at}`} step={index + 1}>
                  <TimelineHeader>
                    <TimelineSeparator />
                    <TimelineDate dateTime={entry.at}>{relativeDay(dayKeyOf(entry.at, timeZone), today)}</TimelineDate>
                    <TimelineTitle className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Link href={`/student/tasks/${entry.taskId}`} className="min-w-0 truncate hover:underline">
                        {entry.title}
                      </Link>
                    </TimelineTitle>
                    <TimelineIndicator
                      className={cn(
                        "size-3 border-2",
                        entry.verdict === "approved" ? "border-success! bg-success" : "border-warning! bg-surface"
                      )}
                    />
                  </TimelineHeader>
                  <TimelineContent className="mt-1 flex flex-col gap-1.5">
                    <span className="flex flex-wrap gap-1.5">
                      <Badge variant={verdict.variant}>{verdict.label}</Badge>
                      {entry.points ? <Badge variant="yellow">+{plural(entry.points, "point")}</Badge> : null}
                    </span>
                    {entry.feedback ? <p className="line-clamp-2 text-on-surface-secondary">{entry.feedback}</p> : null}
                  </TimelineContent>
                </TimelineItem>
              )
            })}
          </Timeline>
        </CardSection>
      )}
    </Card>
  )
}
