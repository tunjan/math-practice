import { FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Reveal } from "./reveal"

function FileChip({ name }: { name: string }) {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-outline bg-surface px-2 py-1 text-xs text-on-surface-secondary">
      <FileText className="size-3.5 text-on-surface-muted" aria-hidden />
      {name}
    </span>
  )
}

const STEPS = [
  {
    verb: "Set",
    line: "A worksheet and a due date.",
    proof: (
      <>
        <FileChip name="worksheet.pdf" />
        <Badge variant="orange">Due Fri</Badge>
      </>
    ),
  },
  {
    verb: "Hand in",
    line: "A photo or PDF of the working.",
    proof: (
      <>
        <FileChip name="working.pdf" />
        <Badge variant="info">Handed in</Badge>
      </>
    ),
  },
  {
    verb: "Feedback",
    line: "A mark and a note per question.",
    proof: (
      <>
        <span className="font-mono text-xl text-on-surface">
          2<span className="text-on-surface-muted">/3</span>
        </span>
        <Badge variant="success">Marked</Badge>
      </>
    ),
  },
]

/** The whole product as one sentence, read left to right. */
export function Loop() {
  return (
    <ol aria-label="How it works" className="grid gap-14 pb-24 md:grid-cols-3 md:gap-0 lg:pb-32">
      {STEPS.map(({ verb, line, proof }, i) => (
        <li key={verb} className="border-t border-outline-strong pt-8 md:pr-10">
          <Reveal delay={i * 90} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-3xl leading-[1.15] font-medium text-on-surface">{verb}</h2>
              <p className="text-sm text-on-surface-muted">{line}</p>
            </div>
            <div className="flex h-16 items-center justify-between gap-3 rounded-lg bg-surface-muted px-4">
              {proof}
            </div>
          </Reveal>
        </li>
      ))}
    </ol>
  )
}
