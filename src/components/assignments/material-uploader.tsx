"use client"

import * as React from "react"
import { FileText, ImageIcon, Loader2, Upload, X } from "lucide-react"

import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Eyebrow } from "@/components/brand/primitives"
import { createClient } from "@/lib/supabase/client"
import {
  describeFileError,
  formatBytes,
  MATERIAL_ACCEPT,
  MATERIALS_BUCKET,
  materialPath,
  type UploadedFile,
} from "@/lib/assignments/files"

type Item = UploadedFile & { id: string; status: "uploading" | "done" | "error" }

/**
 * Uploads straight from the browser to Storage, under the assignment id the
 * form has already reserved. Going through a server action instead would mean
 * pushing every 20MB file through the Next server for no benefit.
 *
 * A file that is uploaded but never submitted leaves an orphaned object in a
 * private bucket with no row pointing at it — invisible, and cheap to sweep
 * later. That is the right trade against making the tutor wait on upload after
 * they press Create.
 */
export function MaterialUploader({
  assignmentId,
  onChange,
}: {
  assignmentId: string
  onChange: (files: UploadedFile[]) => void
}) {
  const [items, setItems] = React.useState<Item[]>([])
  const [errors, setErrors] = React.useState<string[]>([])
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Report only what actually landed.
  React.useEffect(() => {
    onChange(
      items
        .filter((item) => item.status === "done")
        .map(({ storagePath, fileName, mimeType, sizeBytes }) => ({
          storagePath,
          fileName,
          mimeType,
          sizeBytes,
        }))
    )
  }, [items, onChange])

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
              item.id === id
                ? { ...item, status: error ? "error" : "done" }
                : item
            )
          )

          if (error) {
            setErrors((prev) => [...prev, `${file.name} failed to upload.`])
          }
        })
      )
    },
    [assignmentId]
  )

  const remove = React.useCallback(async (item: Item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    if (item.status === "done") {
      const supabase = createClient()
      await supabase.storage.from(MATERIALS_BUCKET).remove([item.storagePath])
    }
  }, [])

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
          "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-white/40 bg-canvas-soft"
            : "border-hairline bg-canvas-soft/50"
        )}
      >
        <Upload className="size-5 text-body-mid" />
        <div className="flex flex-col gap-1">
          <p className="body-md text-ink">Drop problem sheets here</p>
          <p className="body-sm text-body-mid">
            PDF, PNG or JPEG · up to 20MB each
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
        <div className="flex flex-col gap-2">
          <Eyebrow size="sm">Attached</Eyebrow>
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-hairline bg-canvas-card px-3 py-2"
              >
                {item.status === "uploading" ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-body-mid" />
                ) : item.mimeType === "application/pdf" ? (
                  <FileText className="size-4 shrink-0 text-body-mid" />
                ) : (
                  <ImageIcon className="size-4 shrink-0 text-body-mid" />
                )}

                <span className="flex-1 truncate body-sm text-ink">
                  {item.fileName}
                </span>
                <span className="eyebrow-sm shrink-0 text-body-mid">
                  {item.status === "error"
                    ? "Failed"
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
        </div>
      ) : null}
    </div>
  )
}
