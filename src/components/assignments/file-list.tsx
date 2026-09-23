import { ArrowUpRight, FileText, ImageIcon } from "lucide-react"

import { IconTile } from "@/components/brand/primitives"
import { formatBytes } from "@/lib/assignments/files"

export type SignedFile = {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number | null
  /** Short-lived signed URL. Null when signing failed. */
  url: string | null
}

function formatLabel(mimeType: string) {
  if (mimeType === "application/pdf") return "PDF"
  if (mimeType === "image/png") return "PNG"
  if (mimeType === "image/jpeg") return "JPEG"
  return "FILE"
}

/**
 * Attachments as rows inside a card: a bordered icon tile, the name, then the
 * format and size in mono. Rows are divided by hairlines, not boxed.
 */
export function FileList({
  files,
  emptyLabel = "No files attached.",
}: {
  files: SignedFile[]
  emptyLabel?: string
}) {
  if (files.length === 0) {
    return <p className="px-6 py-5 body-sm text-on-surface-muted">{emptyLabel}</p>
  }

  return (
    <ul className="flex flex-col" role="list">
      {files.map((file) => {
        const Icon = file.mimeType === "application/pdf" ? FileText : ImageIcon
        const meta = (
          <span className="mono-data-sm text-on-surface-muted">
            {formatLabel(file.mimeType)}
            {file.sizeBytes ? ` · ${formatBytes(file.sizeBytes)}` : ""}
          </span>
        )

        return (
          <li key={file.id} className="border-t border-outline first:border-t-0">
            {file.url ? (
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="group flex min-h-16 items-center gap-3 px-6 py-3 transition-colors hover:bg-surface-sunken"
              >
                <IconTile>
                  <Icon />
                </IconTile>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate body-md text-on-surface">
                    {file.fileName || "Attachment"}
                  </span>
                  {meta}
                </span>
                <ArrowUpRight
                  className="size-4 shrink-0 text-on-surface-muted transition-colors group-hover:text-on-surface"
                  aria-hidden
                />
                <span className="sr-only">Opens in a new tab</span>
              </a>
            ) : (
              <div className="flex min-h-16 items-center gap-3 px-6 py-3">
                <IconTile>
                  <Icon />
                </IconTile>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate body-md text-on-surface-muted">
                    {file.fileName || "Attachment"}
                  </span>
                  <span className="body-sm text-on-surface-muted">
                    Unavailable right now
                  </span>
                </span>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
