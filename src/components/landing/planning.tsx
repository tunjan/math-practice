import { Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Reveal } from "./reveal"

const TOPICS = [
  { code: "1.3", title: "Geometric sequences", status: "Seen", tone: "success", stars: 5 },
  { code: "2.6", title: "Quadratic functions", status: "Seen", tone: "success", stars: 4 },
  { code: "3.6", title: "Circular functions", status: "In progress", tone: "yellow", stars: 2 },
  { code: "5.3", title: "Differentiation", status: "To see", tone: "gray", stars: 0 },
] as const

function Stars({ n }: { n: number }) {
  return (
    <span role="img" aria-label={`${n} of 5 stars`} className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden
          className={i < n ? "size-3.5 fill-info text-info" : "size-3.5 text-outline-strong"}
        />
      ))}
    </span>
  )
}

// October 2026 starts on a Thursday; weeks run Monday to Sunday.
const LEAD = 3
const DAYS = 31
const DUE = new Set([2, 9, 16, 23, 30])
const EXAM = 21

function Syllabus() {
  return (
    <section className="flex flex-col gap-8 rounded-xl border border-outline bg-surface p-6 sm:p-8 lg:col-span-7">
      <header className="flex items-center justify-between gap-4">
        <h3 className="title-md text-on-surface">Syllabus</h3>
        <Badge variant="outline">AA HL</Badge>
      </header>
      <ul className="flex flex-col gap-5">
        {TOPICS.map((t) => (
          <li key={t.code} className="flex items-center gap-4">
            <span className="w-8 font-mono text-[13px] text-on-surface-muted">{t.code}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-on-surface">{t.title}</span>
            <Badge variant={t.tone} className="hidden sm:inline-flex">
              {t.status}
            </Badge>
            <Stars n={t.stars} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function Calendar() {
  const cells = [...Array(LEAD).fill(null), ...Array.from({ length: DAYS }, (_, i) => i + 1)]
  return (
    <section className="flex flex-col gap-6 rounded-xl border border-outline bg-surface-muted p-6 sm:p-8 lg:col-span-5">
      <header className="flex items-center justify-between gap-4">
        <h3 className="title-md text-on-surface">Calendar</h3>
        <span className="text-sm text-on-surface-muted">October</span>
      </header>
      <div className="grid grid-cols-7 gap-y-1.5 text-center font-mono text-xs">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="pb-1 text-on-surface-muted">
            {d}
          </span>
        ))}
        {cells.map((d, i) =>
          d === null ? (
            <span key={`b${i}`} />
          ) : (
            <span
              key={d}
              className={
                d === EXAM
                  ? "mx-auto flex size-8 items-center justify-center rounded-md border border-on-surface bg-surface text-on-surface"
                  : DUE.has(d)
                    ? "mx-auto flex size-8 items-center justify-center rounded-md bg-info-container text-on-info-container"
                    : "mx-auto flex size-8 items-center justify-center text-on-surface-muted"
              }
            >
              {d}
            </span>
          )
        )}
      </div>
    </section>
  )
}

/** Where the course stands, and when things are due. */
export function Planning() {
  return (
    <div className="pb-24 lg:pb-32">
      <Reveal className="flex flex-col gap-12">
        <h2 className="font-display text-3xl leading-[1.15] font-medium text-balance text-on-surface md:text-[40px]">
          The whole course, at a glance
        </h2>
        <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
          <Syllabus />
          <Calendar />
        </div>
      </Reveal>
    </div>
  )
}
