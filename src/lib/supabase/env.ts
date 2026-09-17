/**
 * Fail loudly and early when a required variable is missing. A Supabase client
 * built from `undefined` fails later, deep inside a request, with an error that
 * says nothing about the real cause.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`
    )
  }
  return value
}

export const SUPABASE_URL = () =>
  required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL)

export const SUPABASE_PUBLISHABLE_KEY = () =>
  required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )

export const SUPABASE_SERVICE_ROLE_KEY = () =>
  required(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

export const SITE_URL = () =>
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
