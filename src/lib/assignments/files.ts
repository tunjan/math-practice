/**
 * Shared rules for uploaded material, used by both the browser uploader and the
 * server action that records it. The database enforces the same constraints —
 * these exist so a mistake is caught before a 20MB upload, not after.
 */

export const MATERIALS_BUCKET = "assignment-materials"
export const SUBMISSIONS_BUCKET = "submissions"
export const LIBRARY_BUCKET = "library"

export const MAX_FILE_BYTES = 20 * 1024 * 1024

export const MATERIAL_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const

export type MaterialMime = (typeof MATERIAL_MIME_TYPES)[number]

export const MATERIAL_ACCEPT = MATERIAL_MIME_TYPES.join(",")

export type UploadedFile = {
  storagePath: string
  fileName: string
  mimeType: string
  sizeBytes: number
}

export function isAllowedMaterial(type: string): type is MaterialMime {
  return (MATERIAL_MIME_TYPES as readonly string[]).includes(type)
}

export function describeFileError(file: File): string | null {
  if (!isAllowedMaterial(file.type)) {
    return `${file.name} isn't a PDF, PNG or JPEG.`
  }
  if (file.size > MAX_FILE_BYTES) {
    return `${file.name} is larger than 20MB.`
  }
  return null
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Objects live under the assignment's own id, which is what the storage
 * policies key on — `can_access_assignment(first path segment)`. The filename
 * itself is randomised, so an object path never leaks what a student called
 * their file.
 */
export function materialPath(assignmentId: string, file: File): string {
  const extension = extensionFor(file.type)
  return `${assignmentId}/${crypto.randomUUID()}${extension}`
}

export function submissionPath(
  assignmentId: string,
  studentId: string,
  file: File
): string {
  const extension = extensionFor(file.type)
  return `${assignmentId}/${studentId}/${crypto.randomUUID()}${extension}`
}

function extensionFor(mimeType: string): string {
  switch (mimeType) {
    case "application/pdf":
      return ".pdf"
    case "image/png":
      return ".png"
    case "image/jpeg":
      return ".jpg"
    default:
      return ""
  }
}
