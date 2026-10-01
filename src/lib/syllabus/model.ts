import type { TagColor } from "@/components/ui/badge"
import type { Database } from "@/lib/supabase/database.types"

type Enums = Database["public"]["Enums"]

export type Programme = Enums["ib_programme"]
export type Course = Enums["ib_course"]
export type Level = Enums["ib_level"]
export type SyllabusLevel = Enums["syllabus_level"]

/** A student's course: all three set, or no course at all. */
export type StudentCourse = { programme: Programme; course: Course; level: Level }

export const PROGRAMMES = ["ib_dp", "gcse", "eso", "bachillerato"] as const satisfies readonly Programme[]
export const COURSES = ["AA", "AI", "0580", "3eso", "4eso", "1bach", "2bach"] as const satisfies readonly Course[]
export const LEVELS = ["SL", "HL", "Core", "Extended", "Ciencias", "Sociales", "Común"] as const satisfies readonly Level[]

export const PROGRAMME_LABEL: Record<Programme, string> = {
  ib_dp: "IB Diploma",
  gcse: "Cambridge IGCSE",
  eso: "ESO",
  bachillerato: "Bachillerato",
}

export const COURSE_LABEL: Record<Course, string> = {
  AA: "Analysis and approaches",
  AI: "Applications and interpretation",
  "0580": "Mathematics (0580)",
  "3eso": "3º ESO",
  "4eso": "4º ESO",
  "1bach": "1º Bachillerato",
  "2bach": "2º Bachillerato",
}

export const LEVEL_LABEL: Record<Level, string> = {
  SL: "Standard level",
  HL: "Higher level",
  Core: "Core",
  Extended: "Extended",
  Ciencias: "Ciencias",
  Sociales: "Sociales",
  Común: "Común",
}

export const PROGRAMME_COURSES: Record<Programme, readonly Course[]> = {
  ib_dp: ["AA", "AI"],
  gcse: ["0580"],
  eso: ["3eso", "4eso"],
  bachillerato: ["1bach", "2bach"],
}

export const PROGRAMME_LEVELS: Record<Programme, readonly Level[]> = {
  ib_dp: ["SL", "HL"],
  gcse: ["Core", "Extended"],
  eso: ["Común", "Ciencias", "Sociales"],
  bachillerato: ["Ciencias", "Sociales"],
}

export function courseLevels(programme: Programme, course?: Course | string | null): readonly Level[] {
  if (programme === "eso") {
    if (course === "3eso") return ["Común"] as const
    if (course === "4eso") return ["Ciencias", "Sociales"] as const
    return ["Común", "Ciencias", "Sociales"] as const
  }
  if (programme === "bachillerato") {
    return ["Ciencias", "Sociales"] as const
  }
  return PROGRAMME_LEVELS[programme] ?? LEVELS
}

/** "Maths AA HL", "GCSE Core Maths", or "1º Bachillerato (Ciencias)", the short name used in headers and tags. */
export function courseShortName(course: StudentCourse): string {
  if (course.course === "0580") {
    return course.level === "Core" ? "GCSE Core Maths" : "GCSE Extended Maths"
  }
  if (course.programme === "eso") {
    return course.course === "3eso" ? "3º ESO Matemáticas" : `4º ESO Matemáticas (${course.level})`
  }
  if (course.programme === "bachillerato") {
    return `${COURSE_LABEL[course.course]} (${course.level})`
  }
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

export const IB_TOPIC_NAMES: Record<number, string> = {
  1: "Number and algebra",
  2: "Functions",
  3: "Geometry and trigonometry",
  4: "Statistics and probability",
  5: "Calculus",
}

export const GCSE_TOPIC_NAMES: Record<number, string> = {
  1: "Number",
  2: "Algebra and graphs",
  3: "Coordinate geometry",
  4: "Geometry",
  5: "Mensuration",
  6: "Trigonometry",
  7: "Transformations and vectors",
  8: "Probability",
  9: "Statistics",
}

export const SPANISH_STRAND_NAMES: Record<string, Record<number, string>> = {
  "3eso": {
    1: "Números",
    2: "Álgebra",
    3: "Geometría",
    4: "Funciones",
    5: "Estadística y probabilidad",
  },
  "4eso-Ciencias": {
    1: "Números y operaciones",
    2: "Álgebra",
    3: "Geometría y trigonometría",
    4: "Funciones",
    5: "Estadística y probabilidad",
  },
  "4eso-Sociales": {
    1: "Números y matemática financiera",
    2: "Álgebra",
    3: "Geometría práctica",
    4: "Funciones",
    5: "Estadística y probabilidad",
  },
  "1bach-Ciencias": {
    1: "Números y álgebra",
    2: "Trigonometría",
    3: "Geometría analítica",
    4: "Funciones, límites y continuidad",
    5: "Cálculo diferencial (Derivadas)",
    6: "Estadística y probabilidad",
  },
  "1bach-Sociales": {
    1: "Aritmética y matemática financiera",
    2: "Álgebra",
    3: "Funciones y límites",
    4: "Derivadas y aplicaciones",
    5: "Estadística y probabilidad",
  },
  "2bach-Ciencias": {
    1: "Álgebra lineal",
    2: "Geometría en el espacio",
    3: "Continuidad y derivabilidad",
    4: "Cálculo integral",
    5: "Probabilidad y distribuciones",
  },
  "2bach-Sociales": {
    1: "Álgebra matricial",
    2: "Programación lineal",
    3: "Análisis matemático",
    4: "Probabilidad",
    5: "Inferencia estadística",
  },
}

export const SPANISH_FALLBACK_STRANDS: Record<number, string> = {
  1: "Números",
  2: "Álgebra",
  3: "Geometría",
  4: "Funciones",
  5: "Estadística y probabilidad",
  6: "Probabilidad y estadística",
}

export function topicName(
  topic: number,
  course?: Course | null,
  level?: SyllabusLevel | Level | null
): string {
  if (course === "0580") return GCSE_TOPIC_NAMES[topic] ?? `Topic ${topic}`
  if (course === "AA" || course === "AI") return IB_TOPIC_NAMES[topic] ?? `Topic ${topic}`
  if (course) {
    if (level && SPANISH_STRAND_NAMES[`${course}-${level}`]) {
      return SPANISH_STRAND_NAMES[`${course}-${level}`][topic] ?? `Tema ${topic}`
    }
    if (SPANISH_STRAND_NAMES[course]) {
      return SPANISH_STRAND_NAMES[course][topic] ?? `Tema ${topic}`
    }
    return SPANISH_FALLBACK_STRANDS[topic] ?? `Tema ${topic}`
  }
  return IB_TOPIC_NAMES[topic] ?? GCSE_TOPIC_NAMES[topic] ?? `Topic ${topic}`
}

/** Each strand has its own tag colour, the way an Airtable option does. */
export const TOPIC_COLOR = {
  1: "blue",
  2: "purple",
  3: "teal",
  4: "orange",
  5: "pink",
  6: "cyan",
  7: "yellow",
  8: "green",
  9: "red",
} as const satisfies Record<number, TagColor>

export function topicColor(topic: number): TagColor {
  return TOPIC_COLOR[topic as keyof typeof TOPIC_COLOR] ?? "gray"
}

/** The subtopics a student on this course studies, in syllabus order. */
export function topicsForCourse(all: SyllabusTopic[], course: StudentCourse): SyllabusTopic[] {
  return all
    .filter((t) => {
      if (t.course !== course.course) return false
      if (course.course === "0580") {
        return t.level === "Core" || course.level === "Extended"
      }
      if (course.programme === "ib_dp") {
        return t.level === "SL" || course.level === "HL"
      }
      return t.level === course.level
    })
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
export const GCSE_GRADES = [9, 8, 7, 6, 5, 4, 3, 2, 1] as const
export const SPANISH_GRADES = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as const

/** "78%" or "78.5%": whole numbers stay whole. */
export function formatPercent(percent: number): string {
  return `${Number.isInteger(percent) ? percent : percent.toFixed(1)}%`
}
