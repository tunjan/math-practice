"use client"

import * as React from "react"
import { useActionState } from "react"
import { BookOpen, Eye, Plus, Sigma, X } from "lucide-react"

import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Eyebrow, StatusDot } from "@/components/brand/primitives"
import { FormMessage } from "@/components/auth/form-message"
import {
  removeAssignmentFile,
  updateAssignment,
  type UpdateAssignmentState,
} from "@/lib/assignments/actions"
import type { UploadedFile } from "@/lib/assignments/files"
import type { AssignmentType, DotAccentLike } from "@/lib/assignments/model"
import type { SignedFile } from "./file-list"

import { DuePicker } from "./due-picker"
import { MaterialUploader } from "./material-uploader"
import { MathProse } from "./math-prose"

export type Topic = { id: string; name: string; accentKey: string }

const TYPES = [
  { value: "problem_set", label: "Problem set", icon: Sigma },
  { value: "reading_notes", label: "Reading notes", icon: BookOpen },
] as const

function ExistingFile({
  file,
  assignmentId,
}: {
  file: SignedFile
  assignmentId: string
}) {
  const [state, action, pending] = useActionState<
    UpdateAssignmentState,
    FormData
  >(removeAssignmentFile, {})

  if (state.notice) return null

  return (
    // Nested inside the edit form would be invalid HTML, so removal posts to
    // its own action rather than riding along with the save.
    <li className="flex items-center gap-3 rounded-lg border border-hairline bg-canvas-card px-3 py-2">
      <span className="flex-1 truncate body-sm text-ink">
        {file.fileName || "Attachment"}
      </span>
      <form action={action}>
        <input type="hidden" name="file_id" value={file.id} />
        <input type="hidden" name="assignment_id" value={assignmentId} />
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${file.fileName}`}
          disabled={pending}
        >
          <X />
        </Button>
      </form>
    </li>
  )
}

export function EditAssignmentForm({
  assignmentId,
  initial,
  existingFiles,
  topics,
}: {
  assignmentId: string
  initial: {
    title: string
    description: string
    type: AssignmentType
    dueAt: string
    categoryId: string | null
  }
  existingFiles: SignedFile[]
  topics: Topic[]
}) {
  const [state, action, pending] = useActionState<
    UpdateAssignmentState,
    FormData
  >(updateAssignment, {})

  const [files, setFiles] = React.useState<UploadedFile[]>([])
  const [type, setType] = React.useState<string>(initial.type)
  const [description, setDescription] = React.useState(initial.description)
  const [preview, setPreview] = React.useState(false)
  const [addingTopic, setAddingTopic] = React.useState(false)
  const [topicId, setTopicId] = React.useState(initial.categoryId ?? "")

  const handleFiles = React.useCallback(
    (next: UploadedFile[]) => setFiles(next),
    []
  )

  return (
    <div className="flex flex-col gap-10">
      {/* Removal posts separately, so it sits outside the save form. */}
      {existingFiles.length > 0 ? (
        <section className="flex flex-col gap-3">
          <Eyebrow>Current materials</Eyebrow>
          <ul className="flex flex-col gap-2">
            {existingFiles.map((file) => (
              <ExistingFile
                key={file.id}
                file={file}
                assignmentId={assignmentId}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <form action={action} className="flex flex-col gap-10">
        <input type="hidden" name="assignment_id" value={assignmentId} />
        <input type="hidden" name="files" value={JSON.stringify(files)} />
        <input type="hidden" name="type" value={type} />
        <input
          type="hidden"
          name="category_id"
          value={addingTopic ? "" : topicId}
        />

        <FormMessage error={state.error} notice={state.notice} />

        <section className="flex flex-col gap-6">
          <Eyebrow>The task</Eyebrow>

          <div className="flex flex-col gap-2">
            <Label htmlFor="title" className="eyebrow-sm text-body-mid">
              Title
            </Label>
            <Input
              id="title"
              name="title"
              required
              maxLength={200}
              defaultValue={initial.title}
            />
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="eyebrow-sm mb-3 text-body-mid">Type</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {TYPES.map((option) => {
                const Icon = option.icon
                const selected = type === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                      selected
                        ? "border-white/40 bg-canvas-soft"
                        : "border-hairline bg-canvas-card hover:border-white/20"
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-body-mid" />
                    <span className="body-md text-ink">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <Eyebrow>Instructions</Eyebrow>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setPreview((v) => !v)}
              aria-pressed={preview}
            >
              <Eye />
              {preview ? "Edit" : "Preview"}
            </Button>
          </div>

          {preview ? (
            <div className="min-h-32 rounded-lg border border-hairline bg-canvas-card p-6">
              {description.trim() ? (
                <MathProse>{description}</MathProse>
              ) : (
                <p className="body-sm text-body-mid">Nothing to preview yet.</p>
              )}
            </div>
          ) : (
            <Textarea
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={8}
            />
          )}
        </section>

        <section className="flex flex-col gap-4">
          <Eyebrow>Add materials</Eyebrow>
          <MaterialUploader assignmentId={assignmentId} onChange={handleFiles} />
        </section>

        <section className="flex flex-col gap-6">
          <Eyebrow>Topic and deadline</Eyebrow>

          <div className="flex flex-col gap-3">
            <Label className="eyebrow-sm text-body-mid">Topic</Label>

            {addingTopic ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  name="new_category"
                  placeholder="e.g. Sequences and series"
                  autoFocus
                  maxLength={80}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setAddingTopic(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setTopicId("")} className="contents">
                  <Badge variant={topicId === "" ? "strong" : "default"}>
                    No topic
                  </Badge>
                </button>

                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setTopicId(topic.id)}
                    className="contents"
                  >
                    <Badge variant={topicId === topic.id ? "strong" : "default"}>
                      <StatusDot accent={topic.accentKey as DotAccentLike} />
                      {topic.name}
                    </Badge>
                  </button>
                ))}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddingTopic(true)}
                >
                  <Plus />
                  New topic
                </Button>
              </div>
            )}
          </div>

          <DuePicker name="due_at" defaultValue={initial.dueAt} />
        </section>

        <div className="flex items-center gap-3 border-t border-hairline pt-6">
          <Button type="submit" variant="primary" size="lg" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
