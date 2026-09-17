"use client"

import * as React from "react"
import { useActionState } from "react"
import { BookOpen, Eye, Plus, Sigma } from "lucide-react"

import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Eyebrow, StatusDot, type DotAccent } from "@/components/brand/primitives"
import { FormMessage } from "@/components/auth/form-message"
import {
  createAssignment,
  type CreateAssignmentState,
} from "@/lib/assignments/actions"
import type { UploadedFile } from "@/lib/assignments/files"

import { DuePicker } from "./due-picker"
import { MaterialUploader } from "./material-uploader"
import { MathProse } from "./math-prose"

export type Recipient = {
  /** `student:<id>` or `invite:<id>`. */
  value: string
  label: string
  pending: boolean
}

export type Topic = { id: string; name: string; accentKey: string }

const TYPES = [
  {
    value: "problem_set",
    label: "Problem set",
    hint: "Questions to work through",
    icon: Sigma,
  },
  {
    value: "reading_notes",
    label: "Reading notes",
    hint: "Read and take notes",
    icon: BookOpen,
  },
] as const

export function CreateAssignmentForm({
  recipients,
  topics,
}: {
  recipients: Recipient[]
  topics: Topic[]
}) {
  const [state, action, pending] = useActionState<
    CreateAssignmentState,
    FormData
  >(createAssignment, {})

  // Reserved up front so uploaded materials can be written to their final
  // storage path before the row exists.
  const [assignmentId] = React.useState(() => crypto.randomUUID())

  const [files, setFiles] = React.useState<UploadedFile[]>([])
  const [type, setType] = React.useState<string>("problem_set")
  const [description, setDescription] = React.useState("")
  const [preview, setPreview] = React.useState(false)
  const [addingTopic, setAddingTopic] = React.useState(false)
  const [topicId, setTopicId] = React.useState("")

  const handleFiles = React.useCallback(
    (next: UploadedFile[]) => setFiles(next),
    []
  )

  return (
    <form action={action} className="flex flex-col gap-10">
      <input type="hidden" name="assignment_id" value={assignmentId} />
      <input type="hidden" name="files" value={JSON.stringify(files)} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="category_id" value={addingTopic ? "" : topicId} />

      <FormMessage error={state.error} />

      {/* ── Who and what ── */}
      <section className="flex flex-col gap-6">
        <Eyebrow>01 — The task</Eyebrow>

        <div className="flex flex-col gap-2">
          <Label htmlFor="title" className="eyebrow-sm text-body-mid">
            Title
          </Label>
          <Input
            id="title"
            name="title"
            required
            maxLength={200}
            autoFocus
            placeholder="Integration by parts — exercises 1–8"
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
                    "flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                    selected
                      ? "border-white/40 bg-canvas-soft"
                      : "border-hairline bg-canvas-card hover:border-white/20"
                  )}
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-body-mid" />
                  <span className="flex flex-col gap-0.5">
                    <span className="body-md text-ink">{option.label}</span>
                    <span className="body-sm text-body-mid">{option.hint}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label htmlFor="target" className="eyebrow-sm text-body-mid">
            For
          </Label>
          <select
            id="target"
            name="target"
            required
            defaultValue=""
            className="w-full rounded-lg border border-hairline bg-canvas-soft px-4 py-3 body-md text-ink outline-none transition-colors hover:border-white/20 focus-visible:border-white/40 focus-visible:ring-2 focus-visible:ring-white/20"
          >
            <option value="" disabled>
              Choose a student…
            </option>
            {recipients.map((recipient) => (
              <option key={recipient.value} value={recipient.value}>
                {recipient.label}
                {recipient.pending ? " (invited — not signed up yet)" : ""}
              </option>
            ))}
          </select>
          {recipients.some((r) => r.pending) ? (
            <p className="body-sm text-body-mid">
              Work set for an invited student is held until they redeem their
              link, then appears in their list automatically.
            </p>
          ) : null}
        </div>
      </section>

      {/* ── Instructions ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Eyebrow>02 — Instructions</Eyebrow>
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
            id="description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={8}
            placeholder={"Work through questions 1–8.\n\nRemember $\\int u\\,dv = uv - \\int v\\,du$."}
          />
        )}

        <p className="body-sm text-body-mid">
          Markdown supported. Wrap maths in <code className="font-mono">$…$</code>{" "}
          for inline or <code className="font-mono">$$…$$</code> for display.
        </p>
      </section>

      {/* ── Materials ── */}
      <section className="flex flex-col gap-4">
        <Eyebrow>03 — Materials</Eyebrow>
        <MaterialUploader assignmentId={assignmentId} onChange={handleFiles} />
      </section>

      {/* ── Topic and deadline ── */}
      <section className="flex flex-col gap-6">
        <Eyebrow>04 — Topic and deadline</Eyebrow>

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
              <Button type="button" size="sm" onClick={() => setAddingTopic(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTopicId("")}
                className="contents"
              >
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
                    <StatusDot accent={topic.accentKey as DotAccent} />
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

        <DuePicker name="due_at" />
      </section>

      <div className="flex items-center gap-3 border-t border-hairline pt-6">
        <Button type="submit" variant="primary" size="lg" disabled={pending}>
          {pending ? "Creating…" : "Create task"}
        </Button>
        <span className="body-sm text-body-mid">
          {files.length > 0
            ? `${files.length} file${files.length === 1 ? "" : "s"} attached`
            : "No files attached"}
        </span>
      </div>
    </form>
  )
}
