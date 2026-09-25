"use client"

import * as React from "react"
import { CalendarDays, CircleAlert, CircleCheck, ClipboardList, Info, LayoutGrid, Search, TriangleAlert, Users } from "lucide-react"

import { CommandPalette } from "@/components/shell/command-palette"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DateField } from "@/components/ui/date-field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button"
import type { CommandEntry } from "@/lib/search/actions"

const PAGES = [
  { href: "/tutor", label: "Overview", Icon: LayoutGrid },
  { href: "/tutor/assignments", label: "Assignments", Icon: ClipboardList },
  { href: "/tutor/students", label: "Students", Icon: Users },
  { href: "/tutor/calendar", label: "Calendar", Icon: CalendarDays },
]

const SAMPLE: CommandEntry[] = [
  { id: "s1", group: "Students", label: "Ana García", hint: "ana@example.com", href: "#" },
  { id: "s2", group: "Students", label: "Tom Okafor", hint: "tom@example.com", href: "#" },
  { id: "t1", group: "Tasks", label: "Sequences and series: problem set 2", hint: "Ana García", href: "#" },
  { id: "t2", group: "Tasks", label: "Differentiation from first principles", hint: "Tom Okafor", href: "#" },
  { id: "t3", group: "Tasks", label: "Vectors: lines and planes", hint: "Ana García", href: "#" },
]
const loadSample = async () => SAMPLE

/** The registry components added in Phases 10 and 11, with sample data. */
export default function Page() {
  const [day, setDay] = React.useState("2026-09-25")
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("2026-10-09")
  const [chip, setChip] = React.useState("all")
  const [track, setTrack] = React.useState("attention")
  const [searching, setSearching] = React.useState(false)

  return (
    <div className="dub min-h-screen bg-surface p-10">
      <div className="flex max-w-3xl flex-col gap-10">
        <section className="flex flex-col gap-3" data-section="date">
          <h2 className="label-caps text-on-surface-muted">Calendar · DateField</h2>
          <div className="flex flex-wrap items-start gap-6">
            <Calendar mode="single" selected={new Date(2026, 8, 25)} defaultMonth={new Date(2026, 8, 1)} className="rounded-xl border border-outline" />
            <div className="flex w-64 flex-col gap-3">
              <DateField value={day} onChange={setDay} aria-label="Date" />
              <DateField value={from} onChange={setFrom} clearable placeholder="Any" aria-label="Start" />
              <DateField value={to} onChange={setTo} min={from || undefined} clearable variant="filled" mono aria-label="End" />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3" data-section="toggle">
          <h2 className="label-caps text-on-surface-muted">ToggleGroup</h2>
          <ToggleGroup aria-label="Show" value={[chip]} onValueChange={(next) => next[0] && setChip(next[0])}>
            {["all", "to_see", "in_progress", "seen"].map((value) => (
              <ToggleGroupItem key={value} value={value}>
                {value.replace("_", " ")}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ToggleGroup variant="track" aria-label="Filter" value={[track]} onValueChange={(next) => next[0] && setTrack(next[0])}>
            {[["attention", 3], ["active", 12], ["approved", 40], ["all", 55]].map(([value, count]) => (
              <ToggleGroupItem key={value} value={String(value)}>
                {value}
                <span className="mono-data-sm text-on-surface-muted">{count}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </section>

        <section className="flex flex-col gap-3" data-section="collapsible">
          <h2 className="label-caps text-on-surface-muted">Collapsible</h2>
          <Collapsible className="group/more w-72">
            <CollapsibleTrigger className="flex h-8 w-full items-center justify-center rounded-lg text-sm font-medium text-on-surface-muted hover:bg-surface-hover hover:text-on-surface">
              <span className="group-data-open/more:hidden">Show 3 older</span>
              <span className="hidden group-data-open/more:inline">Show fewer</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 flex flex-col gap-2">
              {["Vectors 3.12", "Integration 5.10", "Probability 4.5"].map((title) => (
                <div key={title} className="rounded-lg border border-outline px-3 py-2 text-sm">
                  {title}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </section>

        <section className="flex flex-col gap-3" data-section="command">
          <h2 className="label-caps text-on-surface-muted">Command (⌘K)</h2>
          <Button className="w-fit" onClick={() => setSearching(true)}>
            <Search aria-hidden /> Search
          </Button>
          <CommandPalette open={searching} onOpenChange={setSearching} pages={PAGES} scope="dub" load={loadSample} />
        </section>

        <section className="flex flex-col gap-3" data-section="alert">
          <h2 className="label-caps text-on-surface-muted">Alert</h2>
          <Alert>
            <CircleAlert aria-hidden />
            <AlertTitle>2 problems: fix the file and check it again.</AlertTitle>
            <AlertDescription>
              <ul className="flex flex-col gap-1">
                <li>Row 4: unknown code 9.9</li>
                <li>Row 7: stars must be 0–5</li>
              </ul>
            </AlertDescription>
          </Alert>
          <Alert variant="success" role="status">
            <CircleCheck aria-hidden />
            <AlertDescription>Saved.</AlertDescription>
          </Alert>
          <Alert variant="warning" role="status">
            <TriangleAlert aria-hidden />
            <AlertDescription>This task is past its deadline.</AlertDescription>
          </Alert>
          <Alert variant="info" role="status">
            <Info aria-hidden />
            <AlertDescription>Planned dates show on the calendar.</AlertDescription>
          </Alert>
        </section>
      </div>
    </div>
  )
}
