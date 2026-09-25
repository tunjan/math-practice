import { DashboardInsights, DashboardOverview } from "@/components/student/dashboard"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import type { CalendarItem, WeekPlan } from "@/lib/calendar/model"
import { buildDashboard, type DashboardTask } from "@/lib/student/dashboard"
import type { Exam, TopicTag, TrackerRow } from "@/lib/syllabus/model"

/**
 * The student home's dashboard with sample data, so it can be checked
 * without signing in or a database: Friday 25 September 2026, 10:00 London.
 * `?empty` shows a brand-new student with no course instead.
 */
const NOW = new Date("2026-09-25T09:00:00Z")
const TZ = "Europe/London"

const tag = (code: string, title: string): TopicTag => {
  const [topic, subtopic] = code.split(".").map(Number)
  return { code, title, topic: topic!, subtopic: subtopic! }
}

const T = {
  sci: tag("1.1", "Scientific notation"),
  arith: tag("1.2", "Arithmetic sequences and series"),
  geo: tag("1.3", "Geometric sequences and series"),
  fin: tag("1.4", "Financial applications of geometric sequences"),
  lines: tag("2.1", "Equations of straight lines"),
  quad: tag("2.6", "Quadratic functions"),
  trig: tag("3.1", "Distance and midpoint in 3D"),
  stats: tag("4.1", "Sampling and data"),
  diff: tag("5.3", "Differentiating powers and polynomials"),
}

const raw: [TopicTag, "to_see" | "in_progress" | "seen", number][] = [
  [T.sci, "seen", 5],
  [T.arith, "seen", 3],
  [T.geo, "in_progress", 2],
  [T.fin, "to_see", 0],
  [T.lines, "seen", 4],
  [T.quad, "in_progress", 1],
  [T.trig, "to_see", 0],
  [T.stats, "seen", 4],
  [T.diff, "to_see", 0],
]
const tracker: TrackerRow[] = raw.map(([t, status, stars], i) => ({
  id: `topic-${i}`,
  course: "AA",
  level: "SL",
  topic: t.topic,
  subtopic: t.subtopic,
  code: t.code,
  title: t.title,
  progress: { status, stars, plannedStart: null, plannedEnd: null, notes: null },
  taskCount: 0,
}))

/** Hand-ins spread over the past weeks, so the heatmap and streak have something to show. */
const history = ["2026-06-10", "2026-06-24", "2026-07-08", "2026-08-12", "2026-08-26", "2026-09-02", "2026-09-04", "2026-09-10", "2026-09-17", "2026-09-18", "2026-09-23"]

const tasks: DashboardTask[] = [
  {
    id: "t1",
    title: "Geometric series: problem set 3",
    dueAt: "2026-09-26T17:00:00Z",
    column: "in_progress",
    openedAt: "2026-09-22T16:00:00Z",
    handIns: [],
    reviews: [],
  },
  {
    id: "t2",
    title: "Quadratics: completing the square",
    dueAt: "2026-09-29T17:00:00Z",
    column: "assigned",
    openedAt: null,
    handIns: [],
    reviews: [],
  },
  {
    id: "t3",
    title: "Reading notes: financial maths",
    dueAt: "2026-09-23T17:00:00Z",
    column: "assigned",
    openedAt: "2026-09-21T18:00:00Z",
    handIns: [],
    reviews: [],
  },
  {
    id: "t4",
    title: "Straight lines: mixed practice",
    dueAt: "2026-09-24T17:00:00Z",
    column: "submitted",
    openedAt: "2026-09-19T15:00:00Z",
    handIns: [{ at: "2026-09-23T19:30:00Z" }],
    reviews: [],
  },
  {
    id: "t5",
    title: "Arithmetic sequences: exam-style questions",
    dueAt: "2026-09-18T17:00:00Z",
    column: "finished",
    openedAt: "2026-09-14T15:00:00Z",
    handIns: [{ at: "2026-09-17T20:00:00Z" }, { at: "2026-09-18T18:00:00Z" }],
    reviews: [
      { verdict: "changes_requested", feedback: "Good start. Question 4 uses the wrong formula for the sum: check whether it's finite.", at: "2026-09-17T21:00:00Z", handedInAt: "2026-09-17T20:00:00Z" },
      { verdict: "approved", feedback: "Much better. The sigma notation in Q6 is spot on.", at: "2026-09-19T09:00:00Z", handedInAt: "2026-09-18T18:00:00Z" },
    ],
  },
  {
    id: "t6",
    title: "Sampling and data: worksheet",
    dueAt: "2026-09-11T17:00:00Z",
    column: "revise",
    openedAt: "2026-09-08T15:00:00Z",
    handIns: [{ at: "2026-09-10T19:00:00Z" }],
    reviews: [{ verdict: "changes_requested", feedback: "Redo question 2 with a stratified sample.", at: "2026-09-12T10:00:00Z", handedInAt: "2026-09-10T19:00:00Z" }],
  },
  {
    id: "t7",
    title: "Scientific notation warm-up",
    dueAt: "2026-09-05T17:00:00Z",
    column: "finished",
    openedAt: "2026-09-01T15:00:00Z",
    handIns: [{ at: "2026-09-02T18:00:00Z" }, { at: "2026-09-04T18:00:00Z" }],
    reviews: [{ verdict: "approved", feedback: null, at: "2026-09-05T08:00:00Z", handedInAt: "2026-09-04T18:00:00Z" }],
  },
  // Older approved work, for the heatmap's history.
  ...history.slice(0, 5).map((day, i) => ({
    id: `old-${i}`,
    title: `Summer revision ${i + 1}`,
    dueAt: `${day}T17:00:00Z`,
    column: "finished" as const,
    openedAt: `${day}T08:00:00Z`,
    handIns: [{ at: `${day}T16:00:00Z` }],
    reviews: [{ verdict: "approved" as const, feedback: null, at: `${day}T20:00:00Z`, handedInAt: `${day}T16:00:00Z` }],
  })),
]

const deadline = (task: DashboardTask, label: string, tone: "violet" | "accent" | "info" | "error" | "warning" | "success"): CalendarItem => ({
  type: "deadline",
  id: task.id,
  title: task.title,
  dueAt: task.dueAt,
  href: `/student/tasks/${task.id}`,
  taskType: "problem_set",
  status: { label, tone },
  person: null,
  topics: [],
})

const exams: Exam[] = [
  { id: "e1", date: "2026-10-02", title: "Unit test: sequences and series", percent: null, ibGrade: null, notes: null, topicIds: [], topics: [T.sci, T.arith, T.geo, T.fin] },
  { id: "e2", date: "2026-09-11", title: "Functions quiz", percent: 74, ibGrade: 5, notes: null, topicIds: [], topics: [T.lines, T.quad] },
  { id: "e3", date: "2026-06-19", title: "End of year paper 1", percent: 61, ibGrade: 4, notes: null, topicIds: [], topics: [] },
  { id: "e4", date: "2026-05-08", title: "Statistics test", percent: 55, ibGrade: 4, notes: null, topicIds: [], topics: [T.stats] },
  { id: "e5", date: "2026-09-21", title: "Number mini-test", percent: 82, ibGrade: 6, notes: null, topicIds: [], topics: [T.sci] },
]

const calendar: CalendarItem[] = [
  deadline(tasks[2]!, "Overdue", "error"),
  deadline(tasks[3]!, "Submitted", "info"),
  deadline(tasks[0]!, "Opened", "accent"),
  deadline(tasks[1]!, "Assigned", "violet"),
  { type: "exam", id: "e5", title: "Number mini-test", date: "2026-09-21", percent: 82, ibGrade: 6, topics: [T.sci], person: null, href: "/student/syllabus" },
  {
    type: "event",
    id: "ev1",
    title: "Lesson with tutor",
    kind: "lesson",
    notes: null,
    allDay: false,
    startsAt: "2026-09-24T16:00:00Z",
    endsAt: "2026-09-24T17:00:00Z",
    mine: false,
    sharedWith: null,
    from: "your tutor",
  },
]

const plans: WeekPlan[] = [
  { id: "p1", studentId: "s", person: null, week: "2026-09-21", topic: 1, topics: [T.geo, T.fin], updatedAt: "2026-09-01T00:00:00Z" },
  { id: "p2", studentId: "s", person: null, week: "2026-09-21", topic: 2, topics: [T.quad], updatedAt: "2026-09-01T00:00:00Z" },
]

export default async function Fixture({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const empty = "empty" in (await searchParams)

  const dashboard = buildDashboard(
    empty
      ? { now: NOW, timeZone: TZ, tasks: [], points: { balance: 0, earned: 0, awards: [] }, exams: [], tracker: null, calendar: [], plans: [] }
      : {
          now: NOW,
          timeZone: TZ,
          tasks,
          points: { balance: 140, earned: 260, awards: [{ assignmentId: "t5", points: 30 }, { assignmentId: "t7", points: 10 }] },
          exams,
          tracker,
          calendar,
          plans,
        }
  )

  return (
    <div className="dub min-h-screen bg-surface">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-10 px-4 pt-10 pb-20 sm:px-8 sm:pt-14">
        <h1 className="font-display text-3xl font-medium text-on-surface sm:text-4xl">Hello, Sam</h1>
        <DashboardOverview dashboard={dashboard} />
        <Empty variant="outline">
          <EmptyHeader>
            <EmptyTitle>The task board goes here</EmptyTitle>
            <EmptyDescription>It&apos;s unchanged; see it on the real page.</EmptyDescription>
          </EmptyHeader>
        </Empty>
        <DashboardInsights dashboard={dashboard} />
      </div>
    </div>
  )
}
