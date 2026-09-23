import * as React from "react"
import { ArrowUpRight, FileText, ImageIcon, LoaderCircle } from "lucide-react"

import { cn } from "cn"
import type { SignedFile } from "@/components/assignments/file-list"
import { formatBytes } from "@/lib/assignments/files"

/**
 * A file as a chip. The tutor's attachments and the student's own work use the
 * same shape, so the dialog reads as two sides of one exchange: theirs above,
 * yours in the tray below.
 */
export const chipClass =
  "flex h-10 min-w-0 max-w-full items-center gap-2 rounded-md border border-outline-strong bg-surface pl-2.5 text-on-surface"

/**
 * Middle-ellipsis that always keeps the extension: the part a human checks
 * first when telling two files apart. End-truncation hides it entirely.
 */
export function truncateFileName(name: string, max = 28): string {
  if (name.length <= max) return name
  const dot = name.lastIndexOf(".")
  const ext = dot > 0 && name.length - dot <= 8 ? name.slice(dot) : ""
  const head = Math.max(max - ext.length - 1, 8)
  return `${name.slice(0, head)}…${ext}`
}

const UUID_STEM = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Camera and scanner exports arrive as bare UUIDs, so a stored name can be
 * pure noise. When it is, fall back to what a human would call the file; the
 * thumbnail, where there is one, tells two "Photo"s apart.
 */
export function displayName(name: string, mimeType: string): string {
  const dot = name.lastIndexOf(".")
  const stem = dot > 0 ? name.slice(0, dot) : name
  if (!UUID_STEM.test(stem)) return name
  if (mimeType.startsWith("image/")) return "Photo"
  if (mimeType === "application/pdf") return "PDF document"
  return "Attachment"
}

export function ChipContent({
  name,
  mimeType,
  sizeBytes,
  busy = false,
  failed = false,
  preview = null,
}: {
  name: string
  mimeType: string
  sizeBytes: number | null
  busy?: boolean
  failed?: boolean
  /** A thumbnail for image files: own staged work, or a signed URL. */
  preview?: string | null
}) {
  const shown = displayName(name, mimeType)
  const Icon = busy ? LoaderCircle : mimeType === "application/pdf" ? FileText : ImageIcon
  return (
    <>
      {preview && !busy ? (
        // blob: and signed storage URLs can't go through next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="size-6 shrink-0 rounded-sm object-cover" />
      ) : (
        <Icon
          aria-hidden
          className={cn("size-4 shrink-0 text-on-surface-secondary", busy && "motion-safe:animate-spin")}
        />
      )}
      <span
        title={shown}
        className={cn(
          "min-w-0 max-w-56 truncate mono-data-sm decoration-outline-strong underline-offset-4 group-hover:underline",
          failed && "text-on-surface-muted line-through"
        )}
      >
        {truncateFileName(shown)}
      </span>
      {failed ? (
        <span className="shrink-0 mono-data-sm text-error">Failed</span>
      ) : sizeBytes ? (
        <span className="shrink-0 mono-data-sm text-on-surface-muted">{formatBytes(sizeBytes)}</span>
      ) : null}
    </>
  )
}

/** A chip that opens the file in a new tab, or a dashed one when it can't. */
export function FileLink({ file }: { file: SignedFile }) {
  const name = file.fileName || "Attachment"
  const content = (
    <ChipContent
      name={name}
      mimeType={file.mimeType}
      sizeBytes={file.sizeBytes}
      preview={file.mimeType.startsWith("image/") ? file.url : null}
    />
  )

  if (!file.url) {
    // Solid but muted: dashed outlines are reserved for the add/drop affordance,
    // so a chip never looks like a button waiting for a file.
    return (
      <span title="Unavailable right now" className={cn(chipClass, "border-outline pr-2.5 text-on-surface-muted")}>
        {content}
        <span className="sr-only">, unavailable right now</span>
      </span>
    )
  }

  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      className={cn(chipClass, "group pr-2 transition-colors hover:border-on-surface-muted")}
    >
      {content}
      <ArrowUpRight
        aria-hidden
        className="size-3.5 shrink-0 text-on-surface-secondary transition-transform group-hover:translate-x-px group-hover:-translate-y-px group-hover:text-on-surface"
      />
      <span className="sr-only">, opens in a new tab</span>
    </a>
  )
}

export function FileLinks({ files, label }: { files: SignedFile[]; label: string }) {
  return (
    <ul role="list" aria-label={label} className="flex min-w-0 flex-wrap gap-2">
      {files.map((file) => (
        <li key={file.id} className="min-w-0 max-w-full">
          <FileLink file={file} />
        </li>
      ))}
    </ul>
  )
}
