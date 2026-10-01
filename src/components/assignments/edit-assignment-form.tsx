"use client"

import * as React from "react"
import { useActionState } from "react"
import { FileText, ImageIcon, Trash2 } from "lucide-react"

import { IconTile } from "@/components/brand/primitives"
import { FormMessage } from "@/components/auth/form-message"
import { Button, ButtonLink } from "@/components/ui/button"
import { Card, CardFooter } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/ui/label"
import {
  removeAssignmentFile,
  updateAssignment,
  type UpdateAssignmentState,
} from "@/lib/assignments/actions"
import { formatBytes, type UploadedFile } from "@/lib/assignments/files"
import type { AssignmentType } from "@/lib/assignments/model"
import type { Difficulty } from "@/lib/assignments/difficulty"
import { MAX_EXERCISES } from "@/lib/assignments/exercises"

import {
  DifficultyChoice,
  FormSection,
  InstructionsField,
  TopicField,
  TypeChoice,
  type Topic,
} from "./assignment-fields"
import { TopicPicker } from "@/components/syllabus/topic-picker"
import type { SyllabusTopic } from "@/lib/syllabus/model"

import { DuePicker } from "./due-picker"
import type { SignedFile } from "./file-list"
import { MaterialUploader } from "./material-uploader"

export type { Topic }

function ExistingFile({ file, assignmentId }: { file: SignedFile; assignmentId: string }) {
  const [state, action, pending] = useActionState<UpdateAssignmentState, FormData>(
    removeAssignmentFile,
    {}
  )
  const [open, setOpen] = React.useState(false)

  const [seen, setSeen] = React.useState(state)
  if (state !== seen) {
    setSeen(state)
    setOpen(false)
  }

  if (state.notice) return null
  const Icon = file.mimeType === "application/pdf" ? FileText : ImageIcon

  return (
    <li className="flex min-h-14 items-center gap-3 border-t border-border px-3 py-2 first:border-t-0">
      <IconTile className="size-8 [&_svg]:size-4">
        <Icon />
      </IconTile>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate body-md text-foreground">{file.fileName || "Attachment"}</span>
        {state.error ? <span className="body-md text-destructive">{state.error}</span> : null}
      </span>
      {file.sizeBytes ? (
        <span className="shrink-0 caption tabular-nums text-muted-foreground">
          {formatBytes(file.sizeBytes)}
        </span>
      ) : null}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        trigger={
          <Button type="button" variant="destructive" size="sm">
            <Trash2 aria-hidden />
            Remove
          </Button>
        }
        title="Remove this file?"
        description={`${file.fileName || "The file"} is deleted from the task straight away, for you and the student.`}
        confirmLabel="Remove file"
        pendingLabel="Removing"
        pending={pending}
        action={action}
        fields={{ file_id: file.id, assignment_id: assignmentId }}
      />
    </li>
  )
}

export function EditAssignmentForm({
  assignmentId,
  initial,
  existingFiles,
  topics,
  syllabus,
  student,
}: {
  assignmentId: string
  initial: {
    title: string
    description: string
    type: AssignmentType
    difficulty: Difficulty
    exerciseCount: number
    dueAt: string
    categoryId: string | null
    syllabusTopicIds: string[]
  }
  existingFiles: SignedFile[]
  topics: Topic[]
  /** The student's subtopics; empty when they have no course. */
  syllabus: SyllabusTopic[]
  /** Whose clock the deadline is on; null if the student has left. */
  student: { name: string; timeZone: string } | null
}) {
  const [state, action, pending] = useActionState<UpdateAssignmentState, FormData>(
    updateAssignment,
    {}
  )
  const [files, setFiles] = React.useState<UploadedFile[]>([])
  const handleFiles = React.useCallback((next: UploadedFile[]) => setFiles(next), [])
  const [syllabusTopics, setSyllabusTopics] = React.useState(initial.syllabusTopicIds)

  // Each file's removal form lives in its confirm dialog, which is portaled
  // to <body>, so it never nests inside this form.
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="assignment_id" value={assignmentId} />
      <input type="hidden" name="files" value={JSON.stringify(files)} />

      <FormMessage error={state.error} notice={state.notice} />

      <Card>
        <FormSection title="Task">
          <Field label="Title" htmlFor="title">
            <Input id="title" name="title" required maxLength={200} defaultValue={initial.title} />
          </Field>
          <TypeChoice defaultValue={initial.type} />
          <DifficultyChoice defaultValue={initial.difficulty} />
          <Field
            label="Exercises"
            htmlFor="exercise_count"
            hint="How many the student ticks off as they go. Leave at 1 for a single piece of work."
            messageId="exercise_count-hint"
          >
            <Input
              id="exercise_count"
              name="exercise_count"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_EXERCISES}
              step={1}
              required
              defaultValue={initial.exerciseCount}
              aria-describedby="exercise_count-hint"
              className="w-28 tabular-nums"
            />
          </Field>
        </FormSection>

        <FormSection title="Instructions">
          <InstructionsField defaultValue={initial.description} />
        </FormSection>

        <FormSection title="Materials" description="Removing a file takes effect straight away.">
          {existingFiles.length > 0 ? (
            <ul role="list" className="overflow-hidden rounded-lg border border-border">
              {existingFiles.map((file) => (
                <ExistingFile key={file.id} file={file} assignmentId={assignmentId} />
              ))}
            </ul>
          ) : null}
          <MaterialUploader assignmentId={assignmentId} onChange={handleFiles} />
        </FormSection>

        <FormSection title="Schedule">
          <TopicField topics={topics} defaultValue={initial.categoryId ?? ""} />
          {syllabus.length > 0 ? (
            <Field label="Syllabus topics" htmlFor="syllabus_topics">
              <input type="hidden" name="syllabus_topics_offered" value="1" />
              <TopicPicker
                id="syllabus_topics"
                topics={syllabus}
                value={syllabusTopics}
                onValueChange={setSyllabusTopics}
              />
            </Field>
          ) : null}
          <DuePicker name="due_at" defaultValue={initial.dueAt} student={student} />
        </FormSection>

        <CardFooter className="justify-end">
          <ButtonLink href={`/tutor/assignments/${assignmentId}`} variant="ghost">
            Cancel
          </ButtonLink>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Saving" : "Save changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
