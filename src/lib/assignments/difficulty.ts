import type { Database } from "@/lib/supabase/database.types"

export type Difficulty = Database["public"]["Enums"]["task_difficulty"]

export const DIFFICULTIES = ["easy", "medium", "hard", "ultra"] as const satisfies readonly Difficulty[]

export const DEFAULT_DIFFICULTY: Difficulty = "medium"

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  ultra: "Ultra",
}

/** 1–4, for the bar meter. */
export function difficultyLevel(difficulty: Difficulty): number {
  return DIFFICULTIES.indexOf(difficulty) + 1
}

export function asDifficulty(value: unknown): Difficulty | null {
  return DIFFICULTIES.includes(value as Difficulty) ? (value as Difficulty) : null
}
