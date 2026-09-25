"use client"

import * as React from "react"
import { CircleAlert, FileText, ImageIcon, LoaderCircle, Upload, X } from "lucide-react"
import { cn } from "cn"

import { IconTile } from "@/components/brand/primitives"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  describeFileError,
  formatBytes,
  MATERIAL_ACCEPT,
  MATERIALS_BUCKET,
  materialPath,
  type UploadedFile,
} from "@/lib/assignments/files"

export type UploadItem = UploadedFile & {
  id: string
  status: "uploading" | "done" | "error"
}

/**
 * Uploads straight from the browser to Storage, under the assignment id the
 * form has already reserved. Going through a server action instead would mean
 * pushing every 20MB file through the Next server for no benefit.
 *
 * A file that is uploaded but never submitted leaves an orphaned object in a
 * private bucket with no row pointing at it: invisible, and cheap to sweep
 * later. That is the right trade against making the tutor wait on upload after
 * they press Create.
 */
export function useMaterialUploads(assignmentId: string) {
  const [items, setItems] = React.useState<UploadItem[]>([])
  const [errors, setErrors] = React.useState<string[]>([])

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
          const path = materialPath(assignmentId, file)

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
            .from(MATERIALS_BUCKET)
            .upload(path, file, { contentType: file.type, upsert: false })

          setItems((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, status: error ? "error" : "done" } : item
            )
          )

          if (error) setErrors((prev) => [...prev, `${file.name} failed to upload.`])
        })
      )
    },
    [assignmentId]
  )

  const remove = React.useCallback(async (item: UploadItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    if (item.status === "done") {
      const supabase = createClient()
      await supabase.storage.from(MATERIALS_BUCKET).remove([item.storagePath])
    }
  }, [])

  // Only what actually landed.
  const uploaded = React.useMemo<UploadedFile[]>(
    () =>
      items
        .filter((item) => item.status === "done")
        .map(({ storagePath, fileName, mimeType, sizeBytes }) => ({
          storagePath,
          fileName,
          mimeType,
          sizeBytes,
        })),
    [items]
  )

  const uploading = items.filter((item) => item.status === "uploading").length

  /** For a discarded draft. Best effort: nothing waits on it. */
  const discardAll = React.useCallback(() => {
    const paths = uploaded.map((file) => file.storagePath)
    if (paths.length > 0) {
      void createClient().storage.from(MATERIALS_BUCKET).remove(paths)
    }
  }, [uploaded])

  return { items, errors, upload, remove, uploaded, uploading, discardAll }
}

export function MaterialUploader({
  assignmentId,
  onChange,
}: {
  assignmentId: string
  onChange: (files: UploadedFile[]) => void
}) {
  const { items, errors, upload, remove, uploaded } = useMaterialUploads(assignmentId)
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    onChange(uploaded)
  }, [uploaded, onChange])

  return (
    <div className="flex flex-col gap-3">
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
          "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed px-6 py-8 text-center transition-colors",
          dragging ? "border-on-surface bg-surface-sunken" : "border-outline-strong bg-surface"
        )}
      >
        <IconTile>
          <Upload />
        </IconTile>
        <div className="flex flex-col gap-0.5">
          <p className="body-md text-on-surface">Drop worksheets here</p>
          <p className="body-sm text-on-surface-muted">PDF, PNG or JPEG, up to 20 MB each</p>
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
          tabIndex={-1}
          onChange={(event) => {
            if (event.target.files) void upload(event.target.files)
            event.target.value = ""
          }}
        />
      </div>

      {errors.length > 0 ? (
        <Alert>
          <CircleAlert aria-hidden />
          <AlertDescription>
            <ul className="flex flex-col gap-1">
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {items.length > 0 ? (
        <ul role="list" className="flex flex-col overflow-hidden rounded-md border border-outline">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex min-h-14 items-center gap-3 border-t border-outline px-3 py-2 first:border-t-0"
            >
              <IconTile className="size-8 [&_svg]:size-4">
                {item.status === "uploading" ? (
                  <LoaderCircle className="animate-spin" />
                ) : item.mimeType === "application/pdf" ? (
                  <FileText />
                ) : (
                  <ImageIcon />
                )}
              </IconTile>
              <span className="min-w-0 flex-1 truncate body-md text-on-surface">
                {item.fileName}
              </span>
              <span
                className={cn(
                  "shrink-0 mono-data-sm",
                  item.status === "error" ? "text-error" : "text-on-surface-muted"
                )}
              >
                {item.status === "error"
                  ? "Failed"
                  : item.status === "uploading"
                    ? "Uploading"
                    : formatBytes(item.sizeBytes)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${item.fileName}`}
                onClick={() => void remove(item)}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
