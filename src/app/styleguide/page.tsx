import type { Metadata } from "next"
import { ClipboardList, Plus, UserPlus } from "lucide-react"

import { Avatar, EmptyState, Page, PageHeader } from "@/components/brand/primitives"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableIdentity,
  TableRow,
} from "@/components/brand/table"
import { AssignmentBrowser } from "@/components/assignments/assignment-browser"
import { CalendarView } from "@/components/calendar/calendar-view"
import {
  FormSection,
  InstructionsField,
  TopicField,
  TypeChoice,
} from "@/components/assignments/assignment-fields"
import { DuePicker } from "@/components/assignments/due-picker"
import { NewTaskDialog } from "@/components/assignments/new-task-dialog"
import { LifecycleTracker } from "@/components/assignments/lifecycle-tracker"
import { FormMessage } from "@/components/auth/form-message"
import { WorkspaceShell } from "@/components/shell/workspace-nav"
import { TaskList, type BoardTask } from "@/components/student/task-board"
import { TaskDialogDemo } from "@/app/styleguide/task-dialog-demo"
import { TaskDialogBody, type TaskData } from "@/components/student/task-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, ButtonLink } from "@/components/ui/button"
import { Card, CardFooter, CardHeader, CardSection, DetailList, StatStrip } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/ui/label"
import { TickProgress } from "@/components/ui/progress"
import { NativeSelect } from "@/components/ui/select"
import type { CreateAssignmentState } from "@/lib/assignments/actions"
import type { AssignmentRow, StatusTone } from "@/lib/assignments/model"
import type { DeleteEventState, EventFormState, ResetLinkState } from "@/lib/calendar/actions"
import type { SubmitState } from "@/lib/student/actions"
import { addDays, dayKeyOf, utcMidnight, zonedToInstant } from "@/lib/calendar/dates"
import { parseCalendarQuery } from "@/lib/calendar/load"
import type { CalendarItem, EventItem } from "@/lib/calendar/model"

export const metadata: Metadata = { title: "Styleguide · Maths Tasks" }
export const dynamic = "force-dynamic"

const NEUTRALS = [
  ["canvas-neutral", "bg-canvas-neutral"],
  ["canvas-cool", "bg-canvas-cool"],
  ["surface", "bg-surface"],
  ["surface-muted", "bg-surface-muted"],
  ["surface-sunken", "bg-surface-sunken"],
  ["outline", "bg-outline"],
  ["outline-strong", "bg-outline-strong"],
  ["primary", "bg-primary"],
  ["accent-orange", "bg-accent-orange"],
] as const

const TONES = [
  ["violet", "Assigned", "New work, not opened yet"],
  ["accent", "Opened", "Early stage: seen, not handed in"],
  ["info", "Submitted", "In flight: waiting on the tutor"],
  ["warning", "Changes requested", "Pending on the student"],
  ["success", "Approved", "Closed"],
  ["error", "Overdue", "Blocked: past due, not handed in"],
] as const

/** The styleguide is public: its New task dialog must never write. */
async function previewCreateTask(): Promise<CreateAssignmentState> {
  "use server"
  return { error: "This is the styleguide, so nothing was saved." }
}

async function previewSaveEvent(): Promise<EventFormState> {
  "use server"
  return { error: "This is the styleguide, so nothing was saved." }
}

async function previewDeleteEvent(): Promise<DeleteEventState> {
  "use server"
  return { error: "This is the styleguide, so nothing was deleted." }
}

async function previewResetLink(): Promise<ResetLinkState> {
  "use server"
  return { error: "This is the styleguide, so the link was not reset." }
}

async function previewSubmit(): Promise<SubmitState> {
  "use server"
  return { error: "This is the styleguide, so nothing was handed in." }
}

const TASK_ACTIONS = {
  submit: previewSubmit,
  unsubmit: previewSubmit,
  removeDraft: previewSubmit,
}

/** One task in each phase the student can find it in. */
function taskFixtures(): { label: string; task: TaskData }[] {
  const now = Date.now()
  const at = (days: number, hours = 18, minutes = 0) => {
    const d = new Date(now + days * 86_400_000)
    d.setUTCHours(hours, minutes, 0, 0)
    return d.toISOString()
  }
  const file = (id: string, fileName: string, mimeType: string, sizeBytes: number) => ({
    id,
    submissionId: id,
    fileName,
    mimeType,
    sizeBytes,
    url: "#",
  })

  const base: TaskData = {
    id: "00000000-0000-4000-8000-000000000001",
    studentId: "s1",
    title: "Integration by parts, exercises 1 to 8",
    type: "problem_set",
    topic: "Calculus",
    description: [
      "Work through exercises 1 to 8 on the attached sheet. Show every step.",
      "",
      "Use $\\int u\\,dv = uv - \\int v\\,du$ and say which factor you chose as $u$ each time.",
      "",
      "1. $\\int x e^{x}\\,dx$",
      "2. $\\int x \\sin x\\,dx$",
      "3. $\\int \\ln x\\,dx$",
      "",
      "Question 8 is a stretch. Try it, but don't lose sleep over it.",
    ].join("\n"),
    dueAt: at(2),
    assignedAt: at(-3, 9),
    stage: "opened",
    verdict: null,
    completionPct: 60,
    materials: [
      { id: "m1", fileName: "Exercises 7B.pdf", mimeType: "application/pdf", sizeBytes: 482_000, url: "#" },
      { id: "m2", fileName: "Worked example.png", mimeType: "image/png", sizeBytes: 1_240_000, url: "#" },
    ],
    handIns: [],
    draft: [],
    reviews: [],
  }

  const first = file("f1", "IMG_2041.jpg", "image/jpeg", 2_310_000)
  const second = file("f2", "IMG_2042.jpg", "image/jpeg", 2_080_000)

  return [
    { label: "Working", task: base },
    {
      label: "Working, past due",
      task: {
        ...base,
        id: "00000000-0000-4000-8000-000000000005",
        dueAt: at(-1, 17),
      },
    },
    {
      label: "Waiting for review",
      task: {
        ...base,
        id: "00000000-0000-4000-8000-000000000002",
        stage: "submitted",
        dueAt: at(-1),
        handIns: [{ revision: 1, at: at(-1, 15, 42), files: [first, second] }],
      },
    },
    {
      label: "Changes requested, draft saved",
      task: {
        ...base,
        id: "00000000-0000-4000-8000-000000000003",
        title: "Proof by induction warm-up",
        topic: null,
        description: "Prove each statement for all integers $n \\ge 1$.",
        materials: [{ id: "m3", fileName: "Induction.pdf", mimeType: "application/pdf", sizeBytes: 211_000, url: "#" }],
        stage: "reviewed",
        verdict: "changes_requested",
        dueAt: at(4),
        handIns: [{ revision: 1, at: at(-2, 16, 5), files: [first] }],
        reviews: [{ verdict: "changes_requested", feedback: "Question 3 skips the inductive step: show $P(k) \\Rightarrow P(k+1)$ explicitly.", at: at(-1, 10), handedInAt: at(-2, 16, 5) }],
        draft: [file("f3", "induction-v2.pdf", "application/pdf", 640_000)],
      },
    },
    {
      label: "Approved",
      task: {
        ...base,
        id: "00000000-0000-4000-8000-000000000004",
        title: "Binomial expansion practice",
        topic: "Algebra",
        description: null,
        stage: "reviewed",
        verdict: "approved",
        dueAt: at(-6),
        handIns: [
          { revision: 1, at: at(-8, 17), files: [first] },
          { revision: 2, at: at(-6, 12), files: [first, second] },
        ],
        reviews: [
          { verdict: "approved", feedback: null, at: at(-5, 9), handedInAt: at(-6, 12) },
          { verdict: "changes_requested", feedback: null, at: at(-7, 9), handedInAt: at(-8, 17) },
        ],
      },
    },
  ]
}

/** A month of deadlines in every state, plus events of each shape. */
function calendarFixtures(timeZone: string): CalendarItem[] {
  const today = dayKeyOf(new Date(), timeZone)
  const at = (days: number, time: string) =>
    zonedToInstant(addDays(today, days), time, timeZone).toISOString()
  const deadline = (
    id: string,
    title: string,
    days: number,
    time: string,
    status: { label: string; tone: StatusTone },
    person: string
  ): CalendarItem => ({
    type: "deadline",
    id,
    title,
    dueAt: at(days, time),
    href: "/styleguide#calendar",
    taskType: "problem_set",
    status,
    person,
  })
  const event = (
    id: string,
    title: string,
    kind: "lesson" | "exam" | "study" | "other",
    startsAt: string,
    endsAt: string,
    extra: Partial<EventItem> = {}
  ): CalendarItem => ({
    type: "event",
    id,
    title,
    kind,
    notes: null,
    allDay: false,
    startsAt,
    endsAt,
    mine: true,
    sharedWith: null,
    from: null,
    ...extra,
  })

  return [
    deadline("d1", "Integration by parts, exercises 1 to 8", 0, "18:00", { label: "Submitted", tone: "info" }, "Maya Okafor"),
    deadline("d2", "Geometric series and convergence", -2, "18:00", { label: "Overdue", tone: "error" }, "Tomás Reyes"),
    deadline("d3", "Chapter 4 notes: vectors in 3D", 2, "20:00", { label: "Assigned", tone: "violet" }, "Maya Okafor"),
    deadline("d4", "Proof by induction warm-up", 5, "18:00", { label: "Changes requested", tone: "warning" }, "Ilse Brandt"),
    deadline("d5", "Binomial expansion practice", -6, "18:00", { label: "Approved", tone: "success" }, "Tomás Reyes"),
    deadline("d6", "Complex numbers on the Argand diagram", 9, "18:00", { label: "Opened", tone: "accent" }, "Ilse Brandt"),
    deadline("d7", "Differentiating trig functions", 0, "20:00", { label: "Assigned", tone: "violet" }, "Tomás Reyes"),
    event("e1", "Lesson: circle theorems", "lesson", at(0, "16:00"), at(0, "17:00"), {
      sharedWith: { id: "s1", name: "Maya Okafor" },
      notes: "Bring last week's past paper.",
    }),
    event("e2", "School mock: paper 2", "exam", utcMidnight(addDays(today, 4)), utcMidnight(addDays(today, 5)), {
      allDay: true,
      mine: false,
      from: "Maya Okafor",
      notes: "Calculator paper, 90 minutes.",
    }),
    event("e3", "Mark mock papers", "other", at(1, "18:30"), at(1, "20:00")),
    event("e4", "Lesson: vectors", "lesson", at(0, "19:00"), at(0, "20:00"), {
      sharedWith: { id: "s2", name: "Tomás Reyes" },
    }),
    event("e5", "Exam board training", "other", utcMidnight(addDays(today, 11)), utcMidnight(addDays(today, 13)), {
      allDay: true,
    }),
  ]
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="headline-md text-on-surface">{title}</h2>
        {description ? (
          <p className="body-md max-w-[70ch] text-on-surface-secondary">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function fixtures() {
  const now = Date.now()
  const at = (days: number, hours = 18) => {
    const d = new Date(now + days * 86_400_000)
    d.setUTCHours(hours, 0, 0, 0)
    return d.toISOString()
  }

  const rows: AssignmentRow[] = [
    { id: "a1", title: "Integration by parts, exercises 1 to 8", type: "problem_set", dueAt: at(-1), stage: "submitted", verdict: null, studentName: "Maya Okafor", studentId: "s1", topic: "Calculus", submittedAt: at(-1, 15), openedAt: at(-3) },
    { id: "a2", title: "Geometric series and convergence", type: "problem_set", dueAt: at(-2), stage: "opened", verdict: null, studentName: "Tomás Reyes", studentId: "s2", topic: "Sequences", submittedAt: null, openedAt: at(-4) },
    { id: "a3", title: "Chapter 4 notes: vectors in 3D", type: "reading_notes", dueAt: at(2), stage: "assigned", verdict: null, studentName: "Maya Okafor", studentId: "s1", topic: "Vectors", submittedAt: null, openedAt: null },
    { id: "a4", title: "Proof by induction warm-up", type: "problem_set", dueAt: at(4), stage: "reviewed", verdict: "changes_requested", studentName: "Ilse Brandt", studentId: "s3", topic: null, submittedAt: at(-2), openedAt: at(-5) },
    { id: "a5", title: "Binomial expansion practice", type: "problem_set", dueAt: at(-6), stage: "reviewed", verdict: "approved", studentName: "Tomás Reyes", studentId: "s2", topic: "Algebra", submittedAt: at(-7), openedAt: at(-9) },
  ]

  const tasks: BoardTask[] = [
    { id: "t1", title: "Proof by induction warm-up", type: "problem_set", dueAt: at(4), column: "revise", completionPct: 100, openedAt: at(-5), submittedAt: at(-2), reviewedAt: at(-1), topic: null, materialCount: 1 },
    { id: "t2", title: "Geometric series and convergence", type: "problem_set", dueAt: at(-1), column: "in_progress", completionPct: 60, openedAt: at(-4), submittedAt: null, reviewedAt: null, topic: "Sequences", materialCount: 2 },
    { id: "t3", title: "Chapter 4 notes: vectors in 3D", type: "reading_notes", dueAt: at(3), column: "assigned", completionPct: 0, openedAt: null, submittedAt: null, reviewedAt: null, topic: "Vectors", materialCount: 0 },
    { id: "t4", title: "Integration by parts, exercises 1 to 8", type: "problem_set", dueAt: at(1), column: "submitted", completionPct: 100, openedAt: at(-3), submittedAt: at(-1, 15), reviewedAt: null, topic: "Calculus", materialCount: 3 },
    { id: "t5", title: "Binomial expansion practice", type: "problem_set", dueAt: at(-6), column: "finished", completionPct: 100, openedAt: at(-9), submittedAt: at(-7), reviewedAt: at(-5), topic: "Algebra", materialCount: 1 },
    { id: "t6", title: "Differentiating trigonometric functions", type: "problem_set", dueAt: at(-2), column: "assigned", completionPct: 0, openedAt: at(-3), submittedAt: null, reviewedAt: null, topic: "Calculus", materialCount: 1 },
    { id: "t7", title: "Complex numbers on the Argand diagram", type: "problem_set", dueAt: at(6), column: "in_progress", completionPct: 25, openedAt: at(-1), submittedAt: null, reviewedAt: null, topic: "Complex numbers", materialCount: 0 },
  ]

  return { rows, tasks, stamps: { assigned: at(-4, 9), opened: at(-3, 8), submitted: at(-1, 15) } }
}

export default async function StyleguidePage({ searchParams }: PageProps<"/styleguide">) {
  const { rows, tasks, stamps } = fixtures()
  const tz = "Europe/London"
  const calendar = parseCalendarQuery(await searchParams, tz)

  return (
    <WorkspaceShell
      home="/styleguide"
      items={[{ href: "/styleguide", label: "Styleguide", icon: "overview" }]}
      person={{ name: "Ada Lovelace", email: "ada@example.com", role: "Tutor" }}
    >
      <Page>
        <PageHeader
          title="Quiet Console"
          description="Every primitive in the app, rendered against the real tokens with sample data. Source of truth: DESIGN.md."
          actions={
            <>
              <Button>
                <UserPlus aria-hidden />
                Secondary
              </Button>
              <Button variant="primary">
                <Plus aria-hidden />
                Primary
              </Button>
            </>
          }
        />

        <Section id="colour" title="Colour" description="Near-black is the only strong colour. Orange marks the brand, progress and selection, and is never text.">
          <Card className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9">
            {NEUTRALS.map(([name, bg]) => (
              <div key={name} className="flex flex-col gap-2 border-outline p-4 [&:not(:first-child)]:border-l">
                <span className={`h-12 rounded-md border border-outline ${bg}`} />
                <span className="mono-data-sm text-on-surface-secondary">{name}</span>
              </div>
            ))}
          </Card>
          <Card>
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Pill</TableHead>
                  <TableHead>Means</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {TONES.map(([tone, label, meaning]) => (
                  <TableRow key={tone}>
                    <TableCell className="w-48">
                      <Badge variant={tone}>{label}</Badge>
                    </TableCell>
                    <TableCell className="text-on-surface-secondary">{meaning}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Section>

        <Section id="type" title="Type" description="Inter for anything a person wrote. JetBrains Mono for anything a database produced.">
          <Card>
            <CardSection className="flex flex-col gap-4">
              <span className="display-num">1,284</span>
              <span className="headline-lg">Headline large, page titles</span>
              <span className="headline-md">Headline medium, dialogs and sections</span>
              <span className="title-md">Title, card headings</span>
              <span className="body-lg max-w-[65ch]">Body large for instructions a student reads at length.</span>
              <span className="body-md">Body medium is the table default.</span>
              <span className="body-sm text-on-surface-muted">Body small for the second line of a cell.</span>
              <span className="label-caps text-on-surface-muted">Label caps</span>
              <span className="mono-data">Fri 20 Sep, 18:00 · 2.4 MB</span>
            </CardSection>
          </Card>
        </Section>

        <Section id="actions" title="Actions and status">
          <Card>
            <CardSection className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Hand in work</Button>
              <Button>Request changes</Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="destructive">Remove</Button>
              <Button size="icon" aria-label="Add">
                <Plus />
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </CardSection>
            <CardSection className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Queued</Badge>
              <Badge variant="neutral">Problem set</Badge>
              <Badge variant="solid">Tutor</Badge>
              <Badge variant="count">12</Badge>
            </CardSection>
            <CardSection className="flex flex-col gap-3">
              <FormMessage notice="Task created. It's in Maya's list now." />
              <FormMessage error="That file is larger than 20 MB." />
            </CardSection>
          </Card>
        </Section>

        <Section id="kpi" title="KPI strip">
          <StatStrip
            stats={[
              { label: "To review", value: 3 },
              { label: "Overdue", value: 1 },
              { label: "Active tasks", value: 14 },
              { label: "Students", value: 6 },
            ]}
          />
        </Section>

        <Section id="table" title="Assignments table" description="Filter, search, select rows for the floating bulk bar, and open the row menu on hover.">
          <AssignmentBrowser
            rows={rows}
            queued={[{ id: "q1", title: "Trigonometric identities", dueAt: rows[2]!.dueAt, inviteeName: "Noor Haddad" }]}
            timeZone={tz}
          />
        </Section>

        <Section id="roster" title="Roster">
          <Card>
            <CardHeader title="Roster" action={<ButtonLink href="/styleguide" size="sm">View all</ButtonLink>} />
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {["Maya Okafor", "Tomás Reyes", "Ilse Brandt"].map((name, i) => (
                  <TableRow key={name}>
                    <TableCell>
                      <TableIdentity
                        leading={<Avatar name={name} />}
                        primary={name}
                        secondary={`${["maya", "tomas", "ilse"][i]}@example.com`}
                      />
                    </TableCell>
                    <TableCell className="text-right mono-data">{[3, 2, 1][i]}</TableCell>
                    <TableCell className="text-right mono-data-sm text-on-surface-muted">
                      {["2 Sep 2026", "9 Sep 2026", "12 Sep 2026"][i]}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Section>

        <Section id="student" title="Student task board">
          <div className="dub w-full">
            <TaskList tasks={tasks} timeZone={tz} />
          </div>
        </Section>

        <Section id="student-task" title="Student task" description="Opens as a dialog over the list. Title, then the rail from set to reviewed, then the tutor's brief, then the tray with the student's own files. One per phase; nothing is saved.">
          <div className="dub grid gap-8 xl:grid-cols-2">
            {taskFixtures().map(({ label, task }) => (
              <div key={label} className="flex min-w-0 flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="label-caps text-on-surface-secondary">{label}</h3>
                  <TaskDialogDemo label="Open as dialog">
                    <TaskDialogBody task={task} timeZone={tz} actions={TASK_ACTIONS} />
                  </TaskDialogDemo>
                </div>
                <div
                  data-drop-scope=""
                  className="flex max-h-[680px] flex-col overflow-clip rounded-xl border border-outline bg-surface"
                >
                  <TaskDialogBody
                    task={task}
                    timeZone={tz}
                    actions={TASK_ACTIONS}
                    titleId={`task-preview-${task.id}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="calendar" title="Calendar" description="Deadlines are filled dots in their status colour; events are hollow rings. Arrow keys move between days. Saving, deleting and resetting show their error states here; nothing is written.">
          <div className="-mx-4 flex flex-col border-y border-outline md:-mx-8">
            <CalendarView
              key={calendar.month}
              role="tutor"
              basePath="/styleguide"
              month={calendar.month}
              selected={calendar.selected}
              today={calendar.today}
              timeZone={tz}
              items={calendarFixtures(tz)}
              students={[
                { id: "s1", name: "Maya Okafor" },
                { id: "s2", name: "Tomás Reyes" },
                { id: "s3", name: "Ilse Brandt" },
              ]}
              feedUrl="https://maths-tasks.example/api/calendar/00000000-0000-4000-8000-000000000000.ics"
              saveAction={previewSaveEvent}
              deleteAction={previewDeleteEvent}
              resetAction={previewResetLink}
            />
          </div>
        </Section>

        <Section id="progress" title="Progress">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card>
              <CardSection>
                <LifecycleTracker stage="submitted" timestamps={stamps} timeZone={tz} />
              </CardSection>
            </Card>
            <Card>
              <CardHeader title="Details" />
              <DetailList
                items={[
                  { label: "Student", value: "Maya Okafor" },
                  { label: "Type", value: "Problem set" },
                  { label: "Due", value: <span className="mono-data-sm">Fri 20 Sep, 18:00</span> },
                ]}
              />
              <div className="flex flex-col gap-2 border-t border-outline px-6 py-4">
                <div className="flex items-baseline justify-between">
                  <span className="body-sm text-on-surface-muted">Student&apos;s estimate</span>
                  <span className="mono-data-sm">65%</span>
                </div>
                <TickProgress value={65} />
              </div>
            </Card>
          </div>
        </Section>

        <Section id="forms" title="Forms" description="Labels above controls, helper text below. One card, sections divided by hairlines.">
          <Card>
            <FormSection title="Task" description="What the student sees at the top of their list.">
              <Field label="Title" htmlFor="sg-title" hint="Up to 200 characters.">
                <Input id="sg-title" defaultValue="Integration by parts, exercises 1 to 8" />
              </Field>
              <TypeChoice />
              <Field label="Student" htmlFor="sg-student">
                <NativeSelect id="sg-student" defaultValue="maya">
                  <option value="maya">Maya Okafor</option>
                  <option value="tomas">Tomás Reyes</option>
                </NativeSelect>
              </Field>
            </FormSection>
            <FormSection title="Instructions">
              <InstructionsField defaultValue={"Work through questions 1 to 8.\n\nRemember $\\int u\\,dv = uv - \\int v\\,du$."} />
            </FormSection>
            <FormSection title="Schedule">
              <TopicField topics={[{ id: "calc", name: "Calculus" }, { id: "vec", name: "Vectors" }]} defaultValue="calc" />
              <DuePicker name="sg_due" />
              <label className="flex items-center gap-2.5 body-md text-on-surface-secondary">
                <Checkbox defaultChecked /> Keep me signed in
              </label>
            </FormSection>
            <CardFooter className="justify-end">
              <Button variant="ghost">Cancel</Button>
              <Button variant="primary">Create task</Button>
            </CardFooter>
          </Card>
        </Section>

        <Section id="new-task" title="New task dialog" description="Opens over the list the tutor is on. Submitting here shows the error state; nothing is saved.">
          <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
            <p className="body-md text-on-surface-secondary">
              Title, student, type and due first; instructions, materials and topic below.
            </p>
            <NewTaskDialog
              action={previewCreateTask}
              recipients={[
                { value: "student:maya", label: "Maya Okafor", pending: false },
                { value: "student:tomas", label: "Tomás Reyes", pending: false },
                { value: "invite:ines", label: "Inês Carvalho", pending: true },
              ]}
              topics={[
                { id: "calc", name: "Calculus" },
                { id: "vec", name: "Vectors" },
                { id: "seq", name: "Sequences and series" },
              ]}
            />
          </Card>
        </Section>

        <Section id="empty" title="Empty state">
          <Card>
            <EmptyState
              icon={<ClipboardList />}
              title="No tasks yet"
              description="Set a problem set or some reading, pick a deadline, and it lands in the student's list."
              action={<Button variant="primary">New task</Button>}
            />
          </Card>
        </Section>
      </Page>
    </WorkspaceShell>
  )
}
