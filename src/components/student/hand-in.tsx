"use client"

import * as React from "react"
import { startTransition, useActionState } from "react"
import { LoaderCircle, Plus, Undo2, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "cn"
import { FormMessage } from "@/components/auth/form-message"
import { ChipContent, chipClass } from "@/components/student/file-chip"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  describeFileError,
  MATERIAL_ACCEPT,
  submissionPath,
  SUBMISSIONS_BUCKET,
  type UploadedFile,
} from "@/lib/assignments/files"
import {
  removeDraftFile,
  submitWork,
  unsubmitWork,
  type SubmitState,
} from "@/lib/student/actions"
import type { WorkFile } from "@/lib/student/task-trail"

type Action<S> = (state: S, formData: FormData) => Promise<S>

/**
 * The server actions behind the student's controls. Injectable so the public
 * styleguide can render the real components without writing anything.
 */
export type TaskActions = {
  submit?: Action<SubmitState>
  unsubmit?: Action<SubmitState>
  removeDraft?: Action<SubmitState>
}

type Staged = UploadedFile & {
  id: string
  status: "uploading" | "done" | "error"
  previewUrl: string | null
}

/* ── Hand-in tray ──────────────────────────────────────────────────────────── */

function RemoveDraft({
  submissionId,
  assignmentId,
  fileName,
  action,
}: {
  submissionId: string
  assignmentId: string
  fileName: string
  action: Action<SubmitState>
}) {
  const [state, dispatch, pending] = useActionState(action, {})

  React.useEffect(() => {
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <ChipRemove
      label={`Remove ${fileName}`}
      pending={pending}
      onClick={() => {
        const formData = new FormData()
        formData.set("submission_id", submissionId)
        formData.set("assignment_id", assignmentId)
        startTransition(() => dispatch(formData))
      }}
    />
  )
}

function ChipRemove({
  label,
  pending = false,
  onClick,
}: {
  label: string
  pending?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={pending}
      onClick={onClick}
      className="-ml-0.5 flex size-9 shrink-0 items-center justify-center rounded-sm text-on-surface-muted transition-colors hover:bg-surface-sunken hover:text-on-surface disabled:pointer-events-none"
    >
      {pending ? <LoaderCircle className="size-3.5 motion-safe:animate-spin" /> : <X className="size-3.5" />}
    </button>
  )
}

/**
 * Everything that goes into the next hand-in, laid out as chips: files saved
 * as a draft, files being added now, then a dashed chip to add more. Files
 * can also be dropped anywhere on the dialog. The button is always there, so
 * the next step is visible before it is possible.
 */
export function WorkTray({
  assignmentId,
  studentId,
  draft,
  actions,
}: {
  assignmentId: string
  studentId: string
  /** Files saved but not handed in, e.g. after an unsubmit. */
  draft: WorkFile[]
  actions?: TaskActions
}) {
  const [state, action, submitting] = useActionState(actions?.submit ?? submitWork, {})
  const [staged, setStaged] = React.useState<Staged[]>([])
  const [rejected, setRejected] = React.useState<string[]>([])
  const [dragging, setDragging] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const addRef = React.useRef<HTMLButtonElement>(null)
  const previewsRef = React.useRef<string[]>([])
  const [nudge, setNudge] = React.useState(false)

  // Thumbnail blobs outlive the component otherwise.
  const releasePreviews = React.useCallback((urls: string[]) => {
    if (urls.length === 0) return
    for (const url of urls) URL.revokeObjectURL(url)
    previewsRef.current = previewsRef.current.filter((kept) => !urls.includes(kept))
  }, [])
  React.useEffect(() => () => releasePreviews(previewsRef.current), [releasePreviews])

  React.useEffect(() => {
    if (!nudge) return
    const id = setTimeout(() => setNudge(false), 1600)
    return () => clearTimeout(id)
  }, [nudge])

  const [seen, setSeen] = React.useState(state)
  if (state !== seen) {
    setSeen(state)
    if (state.notice) setStaged([])
  }

  React.useEffect(() => {
    if (!state.notice) return
    toast.success(state.notice)
    // The render-phase clear above already dropped the chips; whatever
    // previews are still unreleased belong to them.
    releasePreviews([...previewsRef.current])
  }, [state, releasePreviews])

  const ready = staged.filter((file) => file.status === "done")
  const uploading = staged.some((file) => file.status === "uploading")
  const count = draft.length + ready.length

  // The primary stays enabled: a dead grey button reads as broken, not as
  // "not yet". An empty attempt nudges the add control instead.
  const hint = !submitting && uploading ? "Waiting for your files to finish uploading." : null
  const hintId = React.useId()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (count > 0 || uploading || submitting) return
    event.preventDefault()
    setNudge(true)
    addRef.current?.focus()
  }

  const upload = React.useCallback(
    async (files: FileList | File[]) => {
      const accepted: File[] = []
      const problems: string[] = []
      for (const file of Array.from(files)) {
        const problem = describeFileError(file)
        if (problem) problems.push(problem)
        else accepted.push(file)
      }
      setRejected(problems)
      if (accepted.length === 0) return

      const supabase = createClient()
      await Promise.all(
        accepted.map(async (file) => {
          const id = crypto.randomUUID()
          const path = submissionPath(assignmentId, studentId, file)
          const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null
          if (previewUrl) previewsRef.current.push(previewUrl)
          setStaged((prev) => [
            ...prev,
            {
              id,
              storagePath: path,
              fileName: file.name,
              mimeType: file.type,
              sizeBytes: file.size,
              status: "uploading",
              previewUrl,
            },
          ])

          const { error } = await supabase.storage
            .from(SUBMISSIONS_BUCKET)
            .upload(path, file, { contentType: file.type, upsert: false })

          setStaged((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, status: error ? "error" : "done" } : item
            )
          )
          if (error) setRejected((prev) => [...prev, `${file.name} didn't upload. Try again.`])
        })
      )
    },
    [assignmentId, studentId]
  )

  // The whole dialog is the drop target, not just the tray. Only drags that
  // carry files count, so text selections dragged about are left alone.
  React.useEffect(() => {
    const scope = rootRef.current?.closest<HTMLElement>("[data-drop-scope]") ?? rootRef.current
    if (!scope) return
    let depth = 0
    const carriesFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") ?? false

    const enter = (event: DragEvent) => {
      if (!carriesFiles(event)) return
      depth += 1
      setDragging(true)
    }
    const over = (event: DragEvent) => {
      if (carriesFiles(event)) event.preventDefault()
    }
    const leave = (event: DragEvent) => {
      if (!carriesFiles(event)) return
      depth = Math.max(0, depth - 1)
      if (depth === 0) setDragging(false)
    }
    const drop = (event: DragEvent) => {
      if (!carriesFiles(event)) return
      event.preventDefault()
      depth = 0
      setDragging(false)
      if (event.dataTransfer?.files.length) void upload(event.dataTransfer.files)
    }

    scope.addEventListener("dragenter", enter)
    scope.addEventListener("dragover", over)
    scope.addEventListener("dragleave", leave)
    scope.addEventListener("drop", drop)
    return () => {
      scope.removeEventListener("dragenter", enter)
      scope.removeEventListener("dragover", over)
      scope.removeEventListener("dragleave", leave)
      scope.removeEventListener("drop", drop)
    }
  }, [upload])

  return (
    <div ref={rootRef} className="flex flex-col gap-3">
      <form
        action={action}
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-start"
      >
        <input type="hidden" name="assignment_id" value={assignmentId} />
        <input
          type="hidden"
          name="files"
          value={JSON.stringify(
            ready.map(({ storagePath, fileName, mimeType, sizeBytes }) => ({
              storagePath,
              fileName,
              mimeType,
              sizeBytes,
            }))
          )}
        />

        <ul role="list" aria-label="Files to hand in" className="flex min-w-0 flex-1 flex-wrap gap-2">
          {draft.map((file) => (
            <li key={file.id} className="min-w-0 max-w-full">
              <span className={cn(chipClass, "pr-0.5")}>
                <ChipContent
                  name={file.fileName || "Attachment"}
                  mimeType={file.mimeType}
                  sizeBytes={file.sizeBytes}
                />
                <RemoveDraft
                  submissionId={file.submissionId}
                  assignmentId={assignmentId}
                  fileName={file.fileName}
                  action={actions?.removeDraft ?? removeDraftFile}
                />
              </span>
            </li>
          ))}
          {staged.map((file) => (
            <li key={file.id} className="min-w-0 max-w-full motion-safe:animate-in motion-safe:fade-in">
              <span className={cn(chipClass, "pr-0.5")}>
                <ChipContent
                  name={file.fileName}
                  mimeType={file.mimeType}
                  sizeBytes={file.sizeBytes}
                  busy={file.status === "uploading"}
                  failed={file.status === "error"}
                  preview={file.previewUrl}
                />
                <ChipRemove
                  label={`Remove ${file.fileName}`}
                  onClick={() => {
                    const gone = staged.find((item) => item.id === file.id)
                    if (gone?.previewUrl) releasePreviews([gone.previewUrl])
                    setStaged((prev) => prev.filter((item) => item.id !== file.id))
                  }}
                />
              </span>
            </li>
          ))}
          <li>
            <button
              ref={addRef}
              type="button"
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex h-10 items-center gap-2 rounded-md border border-dashed px-3 label-md transition-colors",
                dragging
                  ? "border-on-surface bg-surface text-on-surface"
                  : nudge
                    ? "border-on-surface bg-surface-sunken text-on-surface"
                    : "border-outline-strong text-on-surface-secondary hover:border-on-surface-muted hover:bg-surface hover:text-on-surface"
              )}
            >
              <Plus aria-hidden className="size-4" />
              {dragging ? "Drop to add" : count + staged.length > 0 ? "Add more" : "Add photos or PDFs"}
            </button>
          </li>
        </ul>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={MATERIAL_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            if (event.target.files) void upload(event.target.files)
            event.target.value = ""
          }}
        />

        <div className="flex flex-col gap-1.5 max-sm:w-full sm:items-end">
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || uploading}
            aria-describedby={hint ? hintId : undefined}
            className="max-sm:w-full"
          >
            {submitting ? <LoaderCircle className="motion-safe:animate-spin" aria-hidden /> : null}
            {submitting ? "Handing in" : "Hand in"}
          </Button>
          {hint ? (
            <p
              id={hintId}
              role="status"
              className="caption text-on-surface-secondary sm:max-w-52 sm:text-right"
            >
              {hint}
            </p>
          ) : null}
        </div>
      </form>

      <div aria-live="polite" className="sr-only">
        {uploading
          ? "Uploading"
          : count > 0
            ? `${count} ${count === 1 ? "file" : "files"} ready to hand in.`
            : ""}
      </div>

      {rejected.length > 0 ? (
        <ul role="alert" className="flex flex-col gap-1 rounded-md bg-error-container px-3 py-2.5">
          {rejected.map((message) => (
            <li key={message} className="body-sm text-on-error-container">
              {message}
            </li>
          ))}
        </ul>
      ) : null}

      <FormMessage error={state.error} />
    </div>
  )
}

/**
 * Takes the latest hand-in back while the tutor has not reviewed it, so the
 * tutor never reviews a moving target. Not destructive (the files return as a
 * draft), so no confirmation.
 */
export function UnsubmitControl({
  assignmentId,
  action,
}: {
  assignmentId: string
  action?: Action<SubmitState>
}) {
  const [state, dispatch, pending] = useActionState(action ?? unsubmitWork, {})

  React.useEffect(() => {
    if (state.notice) toast.success(state.notice)
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <form action={dispatch} className="shrink-0 max-sm:w-full">
      <input type="hidden" name="assignment_id" value={assignmentId} />
      <Button type="submit" disabled={pending} className="max-sm:w-full">
        {pending ? (
          <LoaderCircle className="motion-safe:animate-spin" aria-hidden />
        ) : (
          <Undo2 aria-hidden />
        )}
        {pending ? "Unsubmitting" : "Unsubmit"}
      </Button>
    </form>
  )
}
