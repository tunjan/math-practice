import { cn } from "cn"

import { difficultyLevel, DIFFICULTIES, type Difficulty } from "@/lib/aviary/difficulty"

/**
 * Four rising bars, filled up to the task's difficulty. Monochrome on purpose:
 * DESIGN.md keeps colour for state, and difficulty is a property, not a state.
 */
export function DifficultyMeter({
  difficulty,
  className,
}: {
  difficulty: Difficulty
  className?: string
}) {
  const level = difficultyLevel(difficulty)
  return (
    <span aria-hidden className={cn("inline-flex h-3 items-end gap-[2px]", className)}>
      {DIFFICULTIES.map((_, i) => (
        <span
          key={i}
          className={cn("w-[3px] rounded-[1px]", i < level ? "bg-current" : "bg-current opacity-20")}
          style={{ height: `${40 + i * 20}%` }}
        />
      ))}
    </span>
  )
}
