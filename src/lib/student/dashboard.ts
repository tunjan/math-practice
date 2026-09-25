/**
 * What the student's home shows above and below the task board, worked out
 * from data the page already loads. Pure: the page calls it on the server
 * with the request's clock, and the styleguide calls it with a fixture.
 */

import type { BoardColumn } from "@/lib/assignments/model"
import type { PointAward } from "@/lib/aviary/load"
import { addDays, daysBetween, dayKeyOf, weekStart, type DayKey } from "@/lib/calendar/dates"
import { placeByDay, type CalendarItem, type DayPlacement, type WeekPlan } from "@/lib/calendar/model"
import type { Review } from "@/lib/student/task-trail"
import {
  summarise,
  type Exam,
  type TopicStatus,
  type TopicTag,
  type TrackerRow,
  type TrackerSummary,
} from "@/lib/syllabus/model"

/** The fields of a student task the dashboard reads. `StudentTask` has them all. */
export type DashboardTask = {
  id: string
  title: string
  dueAt: string
  column: BoardColumn
  openedAt: string | null
  /** Oldest first. */
  handIns: { at: string }[]
  reviews: Review[]
}

export type DashboardInput = {
  now: Date
  timeZone: string
  tasks: DashboardTask[]
  /** Points left to spend and ever earned, and each award. */
  points: { balance: number; earned: number; awards: Pick<PointAward, "assignmentId" | "points">[] }
  exams: Exam[]
  /** The student's tracker, or null when they have no course. */
  tracker: TrackerRow[] | null
  /** Calendar items for at least this week: deadlines, exams and events. */
  calendar: CalendarItem[]
  /** Planned-topic week bars for at least this week. */
  plans: WeekPlan[]
}

// ── Stats ───────────────────────────────────────────────────────────────────

/** "Due soon" looks this many days ahead, today included. */
export const DUE_SOON_DAYS = 7

export type DashboardStats = {
  /** Not handed in, due from now to the end of the seventh day. */
  dueSoon: number
  nextDue: { id: string; title: string; dueAt: string } | null
  /** Not handed in and past the deadline: the board's own rule. */
  overdue: number
  /** Handed in, waiting for the tutor. */
  withTutor: number
  /** Feedback to act on. */
  toRevise: number
  balance: number
  earned: number
}

/** Still the student's to hand in. A "Feedback" task is, but its deadline has passed its purpose. */
function open(task: DashboardTask): boolean {
  return task.column === "assigned" || task.column === "in_progress"
}

function stats(input: DashboardInput, today: DayKey): DashboardStats {
  const { tasks, now, timeZone } = input
  const horizon = addDays(today, DUE_SOON_DAYS - 1)
  const upcoming = tasks
    .filter((task) => open(task) && new Date(task.dueAt) >= now && dayKeyOf(task.dueAt, timeZone) <= horizon)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))

  return {
    dueSoon: upcoming.length,
    nextDue: upcoming[0] ? { id: upcoming[0].id, title: upcoming[0].title, dueAt: upcoming[0].dueAt } : null,
    overdue: tasks.filter((task) => open(task) && new Date(task.dueAt) < now).length,
    withTutor: tasks.filter((task) => task.column === "submitted").length,
    toRevise: tasks.filter((task) => task.column === "revise").length,
    balance: input.points.balance,
    earned: input.points.earned,
  }
}

// ── This week ───────────────────────────────────────────────────────────────

export type AgendaDay = { day: DayKey; isToday: boolean; isPast: boolean; items: DayPlacement[] }

export type Agenda = {
  /** The Monday. */
  week: DayKey
  days: AgendaDay[]
  /** Planned subtopics this week, one bar per strand. */
  plans: WeekPlan[]
}

function agenda(input: DashboardInput, today: DayKey): Agenda {
  const week = weekStart(today)
  const byDay = placeByDay(input.calendar, input.timeZone)
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(week, i)
    return { day, isToday: day === today, isPast: day < today, items: byDay.get(day) ?? [] }
  })
  return { week, days, plans: input.plans.filter((plan) => plan.week === week) }
}

// ── Next exam ───────────────────────────────────────────────────────────────

export type ExamTopic = { tag: TopicTag; stars: number; status: TopicStatus | null }

export type NextExam = {
  exam: Exam
  /** 0 on the day. */
  daysAway: number
  /** Its subtopics, weakest first: fewest stars, then least far along. */
  topics: ExamTopic[]
}

const STATUS_RANK: Record<TopicStatus, number> = { to_see: 0, in_progress: 1, seen: 2 }

function nextExam(input: DashboardInput, today: DayKey): NextExam | null {
  const exam = input.exams
    .filter((candidate) => candidate.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))[0]
  if (!exam) return null

  const progress = new Map((input.tracker ?? []).map((row) => [row.code, row.progress]))
  const topics = exam.topics
    .map((tag) => {
      const row = progress.get(tag.code)
      return { tag, stars: row?.stars ?? 0, status: row?.status ?? null }
    })
    .sort(
      (a, b) =>
        a.stars - b.stars ||
        (a.status ? STATUS_RANK[a.status] : -1) - (b.status ? STATUS_RANK[b.status] : -1) ||
        a.tag.topic - b.tag.topic ||
        a.tag.subtopic - b.tag.subtopic
    )

  return { exam, daysAway: daysBetween(today, exam.date), topics }
}

// ── Syllabus ────────────────────────────────────────────────────────────────

export type StrandProgress = { topic: number; seen: number; inProgress: number; total: number }

export type SyllabusGlance = TrackerSummary & { toSee: number; strands: StrandProgress[] }

function syllabus(rows: TrackerRow[] | null): SyllabusGlance | null {
  if (!rows || rows.length === 0) return null
  const summary = summarise(rows)
  const strands = [...new Set(rows.map((row) => row.topic))]
    .sort((a, b) => a - b)
    .map((topic) => {
      const inStrand = rows.filter((row) => row.topic === topic)
      return {
        topic,
        seen: inStrand.filter((row) => row.progress.status === "seen").length,
        inProgress: inStrand.filter((row) => row.progress.status === "in_progress").length,
        total: inStrand.length,
      }
    })
  return { ...summary, toSee: summary.total - summary.seen - summary.inProgress, strands }
}

// ── Activity ────────────────────────────────────────────────────────────────

/** Weeks of history the heatmap shows, this week included. */
export const ACTIVITY_WEEKS = 18

export type ActivityDay = {
  day: DayKey
  /** Hand-ins and first opens that day. */
  count: number
  handIns: number
  future: boolean
}

export type Activity = {
  /** Columns, oldest first; each Monday to Sunday. */
  weeks: { start: DayKey; days: ActivityDay[] }[]
  /** Across the window. */
  activeDays: number
  handIns: number
  /**
   * Weeks in a row with at least one hand-in, up to this one. A week that
   * hasn't had one yet doesn't break the run until it's over, so on a Monday
   * the streak still counts the weeks before.
   */
  streakWeeks: number
  /** The busiest day's count, for scaling the shades. */
  max: number
}

function activity(input: DashboardInput, today: DayKey): Activity {
  const { tasks, timeZone } = input
  const handInsByDay = new Map<DayKey, number>()
  const opensByDay = new Map<DayKey, number>()
  const bump = (map: Map<DayKey, number>, day: DayKey) => map.set(day, (map.get(day) ?? 0) + 1)

  for (const task of tasks) {
    for (const handIn of task.handIns) bump(handInsByDay, dayKeyOf(handIn.at, timeZone))
    if (task.openedAt) bump(opensByDay, dayKeyOf(task.openedAt, timeZone))
  }

  const thisWeek = weekStart(today)
  const first = addDays(thisWeek, -7 * (ACTIVITY_WEEKS - 1))
  let activeDays = 0
  let handIns = 0
  let max = 0

  const weeks = Array.from({ length: ACTIVITY_WEEKS }, (_, w) => {
    const start = addDays(first, 7 * w)
    const days = Array.from({ length: 7 }, (_, d) => {
      const day = addDays(start, d)
      const future = day > today
      const dayHandIns = future ? 0 : (handInsByDay.get(day) ?? 0)
      const count = future ? 0 : dayHandIns + (opensByDay.get(day) ?? 0)
      if (count > 0) activeDays++
      handIns += dayHandIns
      max = Math.max(max, count)
      return { day, count, handIns: dayHandIns, future }
    })
    return { start, days }
  })

  // Walk back from this week over every hand-in, not just the window's.
  const weeksWithHandIn = new Set([...handInsByDay.keys()].map(weekStart))
  let streakWeeks = 0
  let week = weeksWithHandIn.has(thisWeek) ? thisWeek : addDays(thisWeek, -7)
  while (weeksWithHandIn.has(week)) {
    streakWeeks++
    week = addDays(week, -7)
  }

  return { weeks, activeDays, handIns, streakWeeks, max }
}

/** 0 for nothing, then 1–3 by thirds of the busiest day. */
export function activityLevel(count: number, max: number): 0 | 1 | 2 | 3 {
  if (count <= 0 || max <= 0) return 0
  return Math.min(3, Math.max(1, Math.ceil((count / max) * 3))) as 1 | 2 | 3
}

// ── Feedback ────────────────────────────────────────────────────────────────

/** How many reviews the timeline lists. */
export const FEEDBACK_ITEMS = 5

export type FeedbackEntry = {
  taskId: string
  title: string
  verdict: Review["verdict"]
  feedback: string | null
  at: string
  /** Points the approval earned, on the approval that earned them. */
  points: number | null
}

function feedback(input: DashboardInput): FeedbackEntry[] {
  const points = new Map(
    input.points.awards.flatMap((award) => (award.assignmentId ? [[award.assignmentId, award.points] as const] : []))
  )
  const entries = input.tasks.flatMap((task) => {
    // Points are awarded once per task, for its latest approval.
    const latestApproval = task.reviews
      .filter((review) => review.verdict === "approved")
      .reduce<string | null>((latest, review) => (latest === null || review.at > latest ? review.at : latest), null)
    return task.reviews.map((review) => ({
      taskId: task.id,
      title: task.title,
      verdict: review.verdict,
      feedback: review.feedback?.trim() || null,
      at: review.at,
      points: review.verdict === "approved" && review.at === latestApproval ? (points.get(task.id) ?? null) : null,
    }))
  })
  return entries.sort((a, b) => b.at.localeCompare(a.at)).slice(0, FEEDBACK_ITEMS)
}

// ── Exam scores ─────────────────────────────────────────────────────────────

export type ScorePoint = { id: string; date: DayKey; title: string; percent: number; ibGrade: number | null }

/** Fewer than this and there's no trend to draw. */
export const MIN_SCORES = 2

function scores(exams: Exam[]): ScorePoint[] {
  return exams
    .flatMap((exam) =>
      exam.percent === null
        ? []
        : [{ id: exam.id, date: exam.date, title: exam.title, percent: exam.percent, ibGrade: exam.ibGrade }]
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
}

// ── All of it ───────────────────────────────────────────────────────────────

export type Dashboard = {
  today: DayKey
  timeZone: string
  stats: DashboardStats
  agenda: Agenda
  nextExam: NextExam | null
  syllabus: SyllabusGlance | null
  activity: Activity
  feedback: FeedbackEntry[]
  scores: ScorePoint[]
  /** Whether the student can reach /student/syllabus (and add exams there). */
  hasCourse: boolean
}

export function buildDashboard(input: DashboardInput): Dashboard {
  const today = dayKeyOf(input.now, input.timeZone)
  return {
    today,
    timeZone: input.timeZone,
    stats: stats(input, today),
    agenda: agenda(input, today),
    nextExam: nextExam(input, today),
    syllabus: syllabus(input.tracker),
    activity: activity(input, today),
    feedback: feedback(input),
    scores: scores(input.exams),
    hasCourse: input.tracker !== null,
  }
}
