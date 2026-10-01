/** Matches assignments_exercise_count_range in 0025_exercise_count.sql. */
export const MAX_EXERCISES = 500

/**
 * The exercise count a form posted. Left out or blank means one: a task is a
 * single piece of work unless the tutor says otherwise. Null when it is not a
 * whole number in range.
 */
export function asExerciseCount(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim()
  if (raw === "") return 1
  const count = Number(raw)
  return Number.isInteger(count) && count >= 1 && count <= MAX_EXERCISES ? count : null
}

export function exercisesLabel(count: number): string {
  return count === 1 ? "1 exercise" : `${count} exercises`
}
