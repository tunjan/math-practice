"use client"

import * as React from "react"

import type { PlanActionState } from "@/lib/plans/actions"

/**
 * Runs `onDone` once per successful submit of a `useActionState` form. Each
 * action returns a fresh state object, so a repeat success still fires.
 */
export function useActionDone(state: PlanActionState, onDone: (notice: string) => void) {
  const done = React.useRef(onDone)
  React.useEffect(() => {
    done.current = onDone
  })
  React.useEffect(() => {
    if (state.notice) done.current(state.notice)
  }, [state])
}
