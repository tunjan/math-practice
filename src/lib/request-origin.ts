import "server-only"

import { headers } from "next/headers"

/** The origin this request actually arrived on, so links work behind any host. */
export async function requestOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "http"
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
}
