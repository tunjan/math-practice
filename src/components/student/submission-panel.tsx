"use client"

import * as React from "react"
import { useActionState } from "react"
import {
  CheckCircle2,
  Download,
  FileText,
  ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react"

import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eyebrow } from "@/components/brand/primitives"
import { FormMessage } from "@/components/auth/form-message"
import { createClient } from "@/lib/supabase/client"
import {
  describeFileError,
  formatBytes,
  MATERIAL_ACCEPT,
  submissionPath,
  SUBMISSIONS_BUCKET,
  type UploadedFile,
} from "@/lib/assignments/files"
import {
  submitWork,
  withdrawSubmission,
  type SubmitState,
} from "@/lib/student/actions"
import type { SignedFile } from "@/components/assignments/file-list"

type Pending = UploadedFile & { id: string; status: "uploading" | "done" | "error" }

export type SubmittedRevision = {
  revision: number
  createdAt: string
  files: (SignedFile & { submissionId: string })[]
}

function WithdrawButton({
  submissionId,
  assignmentId,
}: {
  submissionId: string
  assignmentId: string
}) {
  const [state, action, pending] = useActionState<SubmitState, FormData>(
    withdrawSubmission,
    {}
  )

  return (
    <form action={action} className="contents">
      <input type="hidden" name="submission_id" value={submissionId} />
      <input type="hidden" name="assignment_id" value={assignmentId} />
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        aria-label="Withdraw this file"
        disabled={pending}
        title={state.error ?? "Withdraw"}
      >
        <X />
      </Button>
    </form>
  )
}

export function SubmissionPanel({
  assignmentId,
  studentId,
  revisions,
  locked,
}: {
  assignmentId: string
  studentId: string
  revisions: SubmittedRevision[]
  /** True once the tutor has reviewed — withdrawal is no longer allowed. */
  locked: boolean
}) {
  const [state, action, submitting] = useActionState<SubmitState, FormData>(
    submitWork,
    {}
  )

  const [items, setItems] = React.useState<Pending[]>([])
  const [errors, setErrors] = React.useState<string[]>([])
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Clear the staging area once a submission lands, so the same files cannot be
  // sent twice by pressing the button again.
  React.useEffect(() => {
    if (state.notice) setItems([])
  }, [state.notice])

  const ready = items.filter((item) => item.status === "done")

  const upload = React.useCallback(
    async (files: FileList | File[]) => {
      const accepted: File[] = []
      const rejected: string[] = []

      for (const file of Array.from(files)) {
        const problem = describeFileError(file)
        if (problem) rejected.push(problem)
        else accepted.push(file)
      }

      setErrors(rejected)
      if (accepted.length === 0) return

      const supabase = createClient()

      await Promise.all(
        accepted.map(async (file) => {
          const id = crypto.randomUUID()
          const path = submissionPath(assignmentId, studentId, file)

          setItems((prev) => [
            ...prev,
            {
              id,
              storagePath: path,
              fileName: file.name,
              mimeType: file.type,
              sizeBytes: file.size,
              status: "uploading",
            },
          ])

          const { error } = await supabase.storage
            .from(SUBMISSIONS_BUCKET)
            .upload(path, file, { contentType: file.type, upsert: false })

          setItems((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, status: error ? "error" : "done" } : item
            )
          )
          if (error) {
            setErrors((prev) => [...prev, `${file.name} failed to upload.`])
          }
        })
      )
    },
    [assignmentId, studentId]
  )

  return (
    <div className="flex flex-col gap-6">
      {/* What has already been handed in */}
      {revisions.length > 0 ? (
        <div className="flex flex-col gap-4">
          <Eyebrow>Handed in</Eyebrow>
          {revisions.map((revision) => (
            <div
              key={revision.revision}
              className="flex flex-col gap-2 rounded-lg border border-hairline bg-canvas-card p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <Badge variant="strong">
                  <CheckCircle2 className="size-3" />
                  Revision {revision.revision}
                </Badge>
                <span className="eyebrow-sm text-body-mid">
                  {new Date(revision.createdAt).toLocaleString(undefined, {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <ul className="flex flex-col gap-2">
                {revision.files.map((file) => {
                  const Icon =
                    file.mimeType === "application/pdf" ? FileText : ImageIcon
                  return (
                    <li
                      key={file.id}
                      className="flex items-center gap-3 rounded-lg border border-hairline px-3 py-2"
                    >
                      <Icon className="size-4 shrink-0 text-body-mid" />
                      <span className="flex-1 truncate body-sm text-ink">
                        {file.fileName || "Attachment"}
                      </span>
                      {file.url ? (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-body-mid transition-colors hover:text-ink"
                          aria-label={`Download ${file.fileName}`}
                        >
                          <Download className="size-4" />
                        </a>
                      ) : null}
                      {!locked ? (
                        <WithdrawButton
                          submissionId={file.submissionId}
                          assignmentId={assignmentId}
                        />
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {/* New submission */}
      <form action={action} className="flex flex-col gap-4">
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

        <Eyebrow>
          {revisions.length > 0 ? "Hand in a revision" : "Hand in your work"}
        </Eyebrow>

        <FormMessage error={state.error} notice={state.notice} />

        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            void upload(event.dataTransfer.files)
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center transition-colors",
            dragging
              ? "border-white/40 bg-canvas-soft"
              : "border-hairline bg-canvas-soft/50"
          )}
        >
          <Upload className="size-5 text-body-mid" />
          <div className="flex flex-col gap-1">
            <p className="body-md text-ink">Drop your solutions here</p>
            <p className="body-sm text-body-mid">
              PDF or photos · up to 20MB each
            </p>
          </div>
          <Button type="button" size="sm" onClick={() => inputRef.current?.click()}>
            Choose files
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={MATERIAL_ACCEPT}
            className="sr-only"
            onChange={(event) => {
              if (event.target.files) void upload(event.target.files)
              event.target.value = ""
            }}
          />
        </div>

        {errors.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {errors.map((message) => (
              <li key={message} className="body-sm text-destructive">
                {message}
              </li>
            ))}
          </ul>
        ) : null}

        {items.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-hairline bg-canvas-card px-3 py-2"
              >
                {item.status === "uploading" ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-body-mid" />
                ) : (
                  <FileText className="size-4 shrink-0 text-body-mid" />
                )}
                <span className="flex-1 truncate body-sm text-ink">
                  {item.fileName}
                </span>
                <span className="eyebrow-sm shrink-0 text-body-mid">
                  {item.status === "error" ? "Failed" : formatBytes(item.sizeBytes)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${item.fileName}`}
                  onClick={() =>
                    setItems((prev) => prev.filter((i) => i.id !== item.id))
                  }
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={submitting || ready.length === 0}
          className="self-start"
        >
          {submitting
            ? "Handing in…"
            : revisions.length > 0
              ? "Hand in revision"
              : "Hand in"}
        </Button>
      </form>
    </div>
  )
}
