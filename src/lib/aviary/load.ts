import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

import {
  ACCESSORIES,
  BIRDS,
  STARTER_BIRD,
  type AccessoryArt,
  type BirdArt,
  type Outfit,
  type Slot,
} from "./catalog"
import type { Difficulty } from "./difficulty"

type Client = SupabaseClient<Database>

type Priced = { cost: number; owned: boolean }
export type AviaryBird = BirdArt & Priced
export type AviaryAccessory = AccessoryArt & Priced

export type PointAward = {
  id: string
  title: string
  difficulty: Difficulty
  points: number
  awardedAt: string
}

export type Aviary = {
  /** Points left to spend. */
  balance: number
  /** Points ever earned. */
  earned: number
  awards: PointAward[]
  birds: AviaryBird[]
  accessories: AviaryAccessory[]
  /** The bird the student shows. */
  companion: string
  /** What each bird is wearing. */
  outfits: Record<string, Outfit>
}

/**
 * Everything the aviary shows, for one student. Prices come from the database
 * and art from the catalogue; an item in only one of them is left out.
 */
export async function loadAviary(supabase: Client, studentId: string): Promise<Aviary> {
  const [items, awards, unlocks, companion, outfits] = await Promise.all([
    supabase.from("aviary_items").select("id, kind, slot, cost").order("position"),
    supabase
      .from("point_awards")
      .select("id, title, difficulty, points, awarded_at")
      .eq("student_id", studentId)
      .order("awarded_at", { ascending: false }),
    supabase.from("aviary_unlocks").select("item_id, cost").eq("student_id", studentId),
    supabase.from("aviary_companions").select("bird_id").eq("student_id", studentId).maybeSingle(),
    supabase.from("aviary_outfits").select("bird_id, slot, item_id").eq("student_id", studentId),
  ])

  const price = new Map((items.data ?? []).map((item) => [item.id, item.cost]))
  const bought = new Set((unlocks.data ?? []).map((row) => row.item_id))
  const priced = <T extends { id: string }>(art: T): (T & Priced)[] => {
    const cost = price.get(art.id)
    return cost === undefined ? [] : [{ ...art, cost, owned: cost === 0 || bought.has(art.id) }]
  }
  const byCost = (a: Priced, b: Priced) => a.cost - b.cost

  const birds = BIRDS.flatMap(priced).sort(byCost)
  const accessories = ACCESSORIES.flatMap(priced).sort(byCost)

  const earned = (awards.data ?? []).reduce((sum, row) => sum + row.points, 0)
  const spent = (unlocks.data ?? []).reduce((sum, row) => sum + row.cost, 0)

  const byBird: Record<string, Outfit> = {}
  for (const row of outfits.data ?? []) {
    ;(byBird[row.bird_id] ??= {})[row.slot as Slot] = row.item_id
  }

  const chosen = companion.data?.bird_id
  const owned = birds.filter((b) => b.owned)

  return {
    balance: earned - spent,
    earned,
    awards: (awards.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      difficulty: row.difficulty,
      points: row.points,
      awardedAt: row.awarded_at,
    })),
    birds,
    accessories,
    companion: owned.find((b) => b.id === chosen)?.id ?? owned[0]?.id ?? STARTER_BIRD,
    outfits: byBird,
  }
}
