"use server"

import { revalidatePath } from "next/cache"

import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

export type AviaryActionState = { error?: string; notice?: string }

const ITEM_ID = /^[a-z][a-z-]{0,39}$/

/** The functions raise stable words; turn them into something a student can act on. */
function explain(message: string): string {
  if (message.includes("not_enough_points")) return "You don't have enough points for that yet."
  if (message.includes("already_owned")) return "You already have that."
  if (message.includes("not_owned")) return "Unlock that first."
  return "Something went wrong. Please try again."
}

function refresh() {
  revalidatePath("/student/aviary")
  revalidatePath("/student")
}

export async function unlockItem(itemId: string, name: string): Promise<AviaryActionState> {
  await requireRole("student")
  if (!ITEM_ID.test(itemId)) return { error: "Unknown item." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("aviary_unlock", { p_item: itemId })
  if (error) return { error: explain(error.message) }

  refresh()
  return { notice: `${name} unlocked.` }
}

export async function chooseBird(birdId: string): Promise<AviaryActionState> {
  await requireRole("student")
  if (!ITEM_ID.test(birdId)) return { error: "Unknown bird." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("aviary_choose_bird", { p_bird: birdId })
  if (error) return { error: explain(error.message) }

  refresh()
  return {}
}

/** Puts an accessory on a bird, or takes it off. */
export async function setWorn(birdId: string, itemId: string, worn: boolean): Promise<AviaryActionState> {
  await requireRole("student")
  if (!ITEM_ID.test(birdId) || !ITEM_ID.test(itemId)) return { error: "Unknown item." }

  const supabase = await createClient()
  const { error } = worn
    ? await supabase.rpc("aviary_equip", { p_bird: birdId, p_item: itemId })
    : await supabase.rpc("aviary_unequip", { p_bird: birdId, p_item: itemId })
  if (error) return { error: explain(error.message) }

  refresh()
  return {}
}
