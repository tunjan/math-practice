import type { TagColor } from "@/components/ui/badge"
import type { Database } from "@/lib/supabase/database.types"

type Enums = Database["public"]["Enums"]

export type Programme = Enums["ib_programme"]
export type Course = Enums["ib_course"]
export type Level = Enums["ib_level"]
export type SyllabusLevel = Enums["syllabus_level"]

/** A student's course: all three set, or no course at all. */
export type StudentCourse = { programme: Programme; course: Course; level: Level }

export const PROGRAMMES = ["ib_dp"] as const satisfies readonly Programme[]
export const COURSES = ["AA", "AI"] as const satisfies readonly Course[]
export const LEVELS = ["SL", "HL"] as const satisfies readonly Level[]

export const PROGRAMME_LABEL: Record<Programme, string> = { ib_dp: "IB Diploma" }

export const COURSE_LABEL: Record<Course, string> = {
  AA: "Analysis and approaches",
  AI: "Applications and interpretation",
}

export const LEVEL_LABEL: Record<Level, string> = { SL: "Standard level", HL: "Higher level" }

/** "Maths AA HL", the short name used in headers and tags. */
export function courseShortName(course: StudentCourse): string {
  return `Maths ${course.course} ${course.level}`
}

/** Reads the three nullable profile columns into a course, or null. */
export function studentCourse(row: {
  programme: Programme | null
  course: Course | null
  level: Level | null
}): StudentCourse | null {
  return row.programme && row.course && row.level
    ? { programme: row.programme, course: row.course, level: row.level }
    : null
}

/** One subtopic, e.g. AA 1.2 "Arithmetic sequences and series". */
export type SyllabusTopic = {
  id: string
  course: Course
  level: SyllabusLevel
  topic: number
  subtopic: number
  code: string
  title: string
}

/** The five strands, shared by AA and AI. */
export const TOPIC_NAME: Record<number, string> = {
  1: "Number and algebra",
  2: "Functions",
  3: "Geometry and trigonometry",
  4: "Statistics and probability",
  5: "Calculus",
}

/** Each strand has its own tag colour, the way an Airtable option does. */
export const TOPIC_COLOR = {
  1: "blue",
  2: "purple",
  3: "teal",
  4: "orange",
  5: "pink",
} as const satisfies Record<number, TagColor>

export function topicColor(topic: number): TagColor {
  return TOPIC_COLOR[topic as keyof typeof TOPIC_COLOR] ?? "gray"
}

/** The subtopics a student on this course studies, in syllabus order. */
export function topicsForCourse(all: SyllabusTopic[], course: StudentCourse): SyllabusTopic[] {
  return all
    .filter((t) => t.course === course.course && (t.level === "SL" || course.level === "HL"))
    .sort((a, b) => a.topic - b.topic || a.subtopic - b.subtopic)
}

/** A syllabus tag on a task: enough to draw the pill and its tooltip. */
export type TopicTag = { code: string; title: string; topic: number; subtopic: number }

/**
 * Flattens `assignment_topics(syllabus_topics(code, title, topic, subtopic))`
 * into tags, in syllabus order.
 */
export function toTopicTags(
  rows: { syllabus_topics: TopicTag | null }[] | null | undefined
): TopicTag[] {
  return (rows ?? [])
    .flatMap((row) => (row.syllabus_topics ? [row.syllabus_topics] : []))
    .sort((a, b) => a.topic - b.topic || a.subtopic - b.subtopic)
}

// ── Tracker ─────────────────────────────────────────────────────────────────

export type TopicStatus = Enums["topic_status"]

export const STATUSES = ["to_see", "in_progress", "seen"] as const satisfies readonly TopicStatus[]

export const STATUS_LABEL: Record<TopicStatus, string> = {
  to_see: "To see",
  in_progress: "In progress",
  seen: "Seen",
}

export const STATUS_COLOR: Record<TopicStatus, TagColor> = {
  to_see: "gray",
  in_progress: "yellow",
  seen: "green",
}

/** What the tutor has recorded for one subtopic. Defaults when nothing is. */
export type TopicProgress = {
  status: TopicStatus
  stars: number
  plannedStart: string | null
  plannedEnd: string | null
  notes: string | null
}

export const EMPTY_PROGRESS: TopicProgress = {
  status: "to_see",
  stars: 0,
  plannedStart: null,
  plannedEnd: null,
  notes: null,
}

/** One row of the tracker: the subtopic, its progress and how many tasks cover it. */
export type TrackerRow = SyllabusTopic & { progress: TopicProgress; taskCount: number }

export type TrackerSummary = { total: number; seen: number; inProgress: number; scheduled: number; averageStars: number | null }

export function summarise(rows: TrackerRow[]): TrackerSummary {
  const rated = rows.filter((r) => r.progress.stars > 0)
  return {
    total: rows.length,
    seen: rows.filter((r) => r.progress.status === "seen").length,
    inProgress: rows.filter((r) => r.progress.status === "in_progress").length,
    scheduled: rows.filter((r) => r.progress.plannedStart || r.progress.plannedEnd).length,
    averageStars: rated.length ? rated.reduce((sum, r) => sum + r.progress.stars, 0) / rated.length : null,
  }
}

// ── Exams ───────────────────────────────────────────────────────────────────

/** A class exam: when, what, how it went, and what it covered. */
export type Exam = {
  id: string
  date: string
  title: string
  /** 0–100, or null until marked. */
  percent: number | null
  /** IB grade 1–7, or null until marked. */
  ibGrade: number | null
  notes: string | null
  topicIds: string[]
  topics: TopicTag[]
}

export const IB_GRADES = [1, 2, 3, 4, 5, 6, 7] as const

/** "78%" or "78.5%": whole numbers stay whole. */
export function formatPercent(percent: number): string {
  return `${Number.isInteger(percent) ? percent : percent.toFixed(1)}%`
}
