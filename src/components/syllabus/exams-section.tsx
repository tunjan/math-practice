"use client"

import * as React from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { FormMessage } from "@/components/auth/form-message"
import { TopicPicker } from "@/components/syllabus/topic-picker"
import { TopicTags } from "@/components/syllabus/topic-tags"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { DayKey } from "@/lib/calendar/dates"
import { deleteExam, saveExam } from "@/lib/syllabus/actions"
import { formatPercent, IB_GRADES, type Exam, type SyllabusTopic } from "@/lib/syllabus/model"

const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })

function formatDate(day: string): string {
  return DAY.format(new Date(`${day}T00:00:00Z`))
}

/** 7 and 6 read as green, 4 and 5 as yellow, lower as red: the usual IB bands. */
function gradeColor(grade: number) {
  return grade >= 6 ? "green" : grade >= 4 ? "yellow" : "red"
}

/** The draft the dialog is editing: a new exam, or one of the list. */
type Draft = { mode: "create" } | { mode: "edit"; exam: Exam }

/**
 * A student's class exams under their tracker, for both the tutor and the
 * student: a table of past and upcoming exams, each opening in a dialog to
 * edit its date, result and the subtopics it covered.
 */
export function ExamsSection({
  studentId,
  exams,
  topics,
  today,
}: {
  studentId: string
  exams: Exam[]
  /** The student's subtopics, for tagging an exam. */
  topics: SyllabusTopic[]
  today: DayKey
}) {
  const [draft, setDraft] = React.useState<Draft | null>(null)
  // Keeps the last draft on screen while the dialog animates out.
  const [shown, setShown] = React.useState(draft)
  if (draft && draft !== shown) setShown(draft)

  return (
    <section aria-labelledby="exams-title" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="exams-title" className="text-base font-semibold text-on-surface">
          Exams
        </h2>
        <Button variant="secondary" size="sm" onClick={() => setDraft({ mode: "create" })}>
          <Plus aria-hidden /> Add exam
        </Button>
      </div>

      {exams.length === 0 ? (
        <p className="rounded-lg border border-dashed border-outline px-4 py-8 text-center text-sm text-on-surface-muted">
          No exams yet. Add class tests and mocks to keep their results next to the syllabus.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-outline bg-surface">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <thead>
              <tr className="h-9 border-b border-outline bg-surface-sunken/70 text-xs font-medium text-on-surface-muted">
                <th scope="col" className="w-32 border-r border-outline px-3 font-medium">Date</th>
                <th scope="col" className="border-r border-outline px-3 font-medium">Exam</th>
                <th scope="col" className="w-56 border-r border-outline px-3 font-medium">Topics</th>
                <th scope="col" className="w-20 border-r border-outline px-3 text-right font-medium">Score</th>
                <th scope="col" className="w-20 border-r border-outline px-3 font-medium">Grade</th>
                <th scope="col" className="w-56 px-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => {
                const upcoming = exam.date >= today
                return (
                  <tr key={exam.id} className="h-10 border-b border-outline last:border-b-0 hover:bg-surface-muted/60">
                    <td className="border-r border-outline px-3 whitespace-nowrap tabular-nums text-on-surface-secondary">
                      {formatDate(exam.date)}
                    </td>
                    <td className="max-w-0 border-r border-outline px-3">
                      <button
                        type="button"
                        onClick={() => setDraft({ mode: "edit", exam })}
                        className="-mx-1 flex max-w-full items-center gap-2 rounded-md px-1 text-left outline-none hover:underline focus-visible:ring-2 focus-visible:ring-on-surface/20"
                      >
                        <span className="sr-only">Edit </span>
                        <span className="truncate font-medium text-on-surface">{exam.title}</span>
                        {upcoming ? <Badge variant="blue">Upcoming</Badge> : null}
                      </button>
                    </td>
                    <td className="border-r border-outline px-3 py-1.5">
                      {exam.topics.length ? (
                        <TopicTags tags={exam.topics} max={4} />
                      ) : (
                        <span className="text-on-surface-muted">–</span>
                      )}
                    </td>
                    <td className="border-r border-outline px-3 text-right font-mono tabular-nums text-on-surface">
                      {exam.percent === null ? <span className="text-on-surface-muted">–</span> : formatPercent(exam.percent)}
                    </td>
                    <td className="border-r border-outline px-3">
                      {exam.ibGrade === null ? (
                        <span className="text-on-surface-muted">–</span>
                      ) : (
                        <Badge variant={gradeColor(exam.ibGrade)} className="font-mono">
                          {exam.ibGrade}
                        </Badge>
                      )}
                    </td>
                    <td className="max-w-0 px-3">
                      <span className="block truncate text-on-surface-secondary" title={exam.notes ?? undefined}>
                        {exam.notes ?? ""}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent scope="dub" className="sm:w-[min(560px,calc(100vw-4rem))]">
          <DialogHeader title={shown?.mode === "edit" ? "Edit exam" : "New exam"} />
          {shown ? (
            <ExamForm
              key={shown.mode === "edit" ? shown.exam.id : "new"}
              studentId={studentId}
              exam={shown.mode === "edit" ? shown.exam : null}
              topics={topics}
              today={today}
              onDone={() => setDraft(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}

function ExamForm({
  studentId,
  exam,
  topics,
  today,
  onDone,
}: {
  studentId: string
  exam: Exam | null
  topics: SyllabusTopic[]
  today: DayKey
  onDone: () => void
}) {
  const [title, setTitle] = React.useState(exam?.title ?? "")
  const [date, setDate] = React.useState(exam?.date ?? today)
  const [percent, setPercent] = React.useState(exam?.percent === null || !exam ? "" : String(exam.percent))
  const [grade, setGrade] = React.useState(exam?.ibGrade ? String(exam.ibGrade) : "")
  const [topicIds, setTopicIds] = React.useState(exam?.topicIds ?? [])
  const [notes, setNotes] = React.useState(exam?.notes ?? "")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()
  const [deleting, startDelete] = React.useTransition()
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)

  const percentValue = percent.trim() === "" ? null : Number(percent)
  const percentInvalid = percentValue !== null && !(percentValue >= 0 && percentValue <= 100)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!title.trim()) return setError("Give the exam a name.")
    if (!date) return setError("Pick the date of the exam.")
    if (percentInvalid) return setError("The score is a percentage, 0 to 100.")
    setError(null)
    startTransition(async () => {
      const result = await saveExam(studentId, {
        id: exam?.id,
        date,
        title,
        percent: percentValue,
        ibGrade: grade ? Number(grade) : null,
        notes: notes || null,
        topicIds,
      })
      if (result.error) return setError(result.error)
      toast.success(exam ? "Exam saved" : "Exam added")
      onDone()
    })
  }

  function remove() {
    if (!exam) return
    startDelete(async () => {
      const result = await deleteExam(studentId, exam.id)
      setConfirmingDelete(false)
      if (result.error) return setError(result.error)
      toast.success("Exam deleted")
      onDone()
    })
  }

  return (
    <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <DialogBody className="flex flex-col gap-4 pt-2">
        {error ? <FormMessage error={error} /> : null}
        <Field label="Exam" htmlFor="exam-title">
          <Input
            id="exam-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            autoComplete="off"
            placeholder="Unit 2 test: functions"
            aria-required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date" htmlFor="exam-date">
            <Input id="exam-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-required />
          </Field>
          <Field label="Score (%)" htmlFor="exam-percent" error={percentInvalid ? "0 to 100" : undefined}>
            <Input
              id="exam-percent"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="0.1"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              placeholder="Not marked"
              aria-invalid={percentInvalid || undefined}
            />
          </Field>
          <Field label="IB grade" htmlFor="exam-grade">
            <NativeSelect id="exam-grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="">Not marked</option>
              {IB_GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        {topics.length ? (
          <Field label="Topics it covered" htmlFor="exam-topics">
            <TopicPicker id="exam-topics" topics={topics} value={topicIds} onValueChange={setTopicIds} name="exam_topic" />
          </Field>
        ) : null}
        <Field label="Notes" htmlFor="exam-notes">
          <Textarea
            id="exam-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="What went well, what to revisit"
          />
        </Field>
      </DialogBody>
      <DialogFooter className="py-3">
        {exam ? (
          <ConfirmDialog
            scope="dub"
            open={confirmingDelete}
            onOpenChange={setConfirmingDelete}
            trigger={
              <Button type="button" variant="destructive" className="-ml-2 px-2 sm:px-3">
                <Trash2 aria-hidden />
                <span className="sr-only sm:not-sr-only">Delete</span>
              </Button>
            }
            title="Delete exam?"
            description="Its result and notes go with it. This can't be undone."
            confirm={
              <Button variant="danger" onClick={remove} disabled={deleting}>
                {deleting ? "Deleting" : "Delete"}
              </Button>
            }
          />
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          <DialogClose render={<Button variant="secondary" className="border-outline" />}>Cancel</DialogClose>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Saving" : exam ? "Save" : "Add exam"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  )
}
