import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"
import type { SignedFile } from "@/components/assignments/file-list"

/** Long enough to open and read a PDF, short enough that a leaked URL rots. */
const SIGNED_URL_TTL_SECONDS = 60 * 60

type StoredFile = {
  id: string
  file_name: string
  mime_type: string
  size_bytes: number | null
  storage_path: string
}

/**
 * Buckets are private, so nothing is reachable by URL alone. Signing happens on
 * the server with the caller's own session, which means the storage policies
 * still decide what may be signed — this is not a way around them.
 */
export async function signFiles(
  supabase: SupabaseClient<Database>,
  bucket: string,
  files: StoredFile[]
): Promise<SignedFile[]> {
  if (files.length === 0) return []

  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrls(
      files.map((file) => file.storage_path),
      SIGNED_URL_TTL_SECONDS
    )

  const urlByPath = new Map(
    (data ?? []).map((entry) => [entry.path, entry.signedUrl])
  )

  return files.map((file) => ({
    id: file.id,
    fileName: file.file_name,
    mimeType: file.mime_type,
    sizeBytes: file.size_bytes,
    url: urlByPath.get(file.storage_path) ?? null,
  }))
}
