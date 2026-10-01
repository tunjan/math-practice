"use server"

import { revalidatePath } from "next/cache"

import { requireProfile } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
import { validTimeZone } from "@/lib/timezone"

export type TimeZoneState = { error?: string; saved?: string }

/**
 * Sets the signed-in person's own time zone. Every date they see, and every
 * deadline their tutor sets for them, reads by it, so the whole app is
 * revalidated rather than one page.
 */
export async function updateTimeZone(
  _prev: TimeZoneState,
  formData: FormData
): Promise<TimeZoneState> {
  const timezone = validTimeZone(formData.get("timezone"))
  if (!timezone) return { error: "Choose a time zone from the list." }

  const profile = await requireProfile()
  const supabase = await createClient()
  const { error } = await supabase.from("profiles").update({ timezone }).eq("id", profile.id)
  if (error) return { error: "Couldn't save your time zone. Please try again." }

  revalidatePath("/", "layout")
  return { saved: timezone }
}
