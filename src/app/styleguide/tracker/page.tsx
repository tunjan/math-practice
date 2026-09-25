import { SyllabusTracker } from "@/components/syllabus/syllabus-tracker"
import type { TrackerRow } from "@/lib/syllabus/model"

const raw: [number, number, "SL" | "AHL", string, TrackerRow["progress"]["status"], number, string | null, string | null, number, string | null][] = [
  [1, 1, "SL", "Scientific notation", "seen", 5, "2026-09-01", "2026-09-05", 2, null],
  [1, 2, "SL", "Arithmetic sequences and series", "seen", 3, "2026-09-08", "2026-09-14", 3, "Sigma notation still shaky"],
  [1, 3, "SL", "Geometric sequences and series", "in_progress", 2, "2026-09-15", "2026-09-21", 1, null],
  [1, 4, "SL", "Financial applications of geometric sequences", "to_see", 0, "2026-09-22", "2026-09-28", 0, null],
  [1, 12, "AHL", "Complex numbers: Cartesian form", "to_see", 0, null, null, 0, null],
  [2, 1, "SL", "Equations of straight lines", "to_see", 0, "2026-10-05", "2026-10-09", 0, null],
  [2, 6, "SL", "Quadratic functions", "to_see", 0, null, null, 0, null],
  [5, 3, "SL", "Differentiating powers and polynomials", "to_see", 0, null, null, 0, null],
]
const rows: TrackerRow[] = raw.map(([t, s, level, title, status, stars, a, b, n, notes]) => ({
  id: `00000000-0000-0000-0000-0000000${t}${String(s).padStart(4, "0")}`, course: "AA", level, topic: t, subtopic: s, code: `${t}.${s}`, title,
  progress: { status, stars, plannedStart: a, plannedEnd: b, notes }, taskCount: n,
}))

export default function Fixture() {
  return (
    <div className="dub w-full bg-surface p-8">
      <SyllabusTracker studentId="00000000-0000-0000-0000-000000000000" rows={rows} editable today="2026-09-25" />
    </div>
  )
}
