import { Download, FileText, ImageIcon } from "lucide-react"

import { formatBytes } from "@/lib/assignments/files"

export type SignedFile = {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number | null
  /** Short-lived signed URL. Null when signing failed. */
  url: string | null
}

/**
 * Attachments open in a new tab rather than inline: browsers already render
 * PDFs and images well, and an embedded viewer would be a worse version of
 * something the reader already has.
 */
export function FileList({
  files,
  emptyLabel = "No files attached.",
}: {
  files: SignedFile[]
  emptyLabel?: string
}) {
  if (files.length === 0) {
    return <p className="body-sm text-body-mid">{emptyLabel}</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {files.map((file) => {
        const Icon = file.mimeType === "application/pdf" ? FileText : ImageIcon
        const content = (
          <>
            <Icon className="size-4 shrink-0 text-body-mid" />
            <span className="flex-1 truncate body-sm text-ink">
              {file.fileName || "Attachment"}
            </span>
            {file.sizeBytes ? (
              <span className="eyebrow-sm shrink-0 text-body-mid">
                {formatBytes(file.sizeBytes)}
              </span>
            ) : null}
            <Download className="size-4 shrink-0 text-body-mid" />
          </>
        )

        return (
          <li key={file.id}>
            {file.url ? (
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-lg border border-hairline bg-canvas-card px-3 py-2 transition-colors hover:border-white/25"
              >
                {content}
              </a>
            ) : (
              <span className="flex items-center gap-3 rounded-lg border border-hairline bg-canvas-card px-3 py-2 opacity-50">
                {content}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
