"use client"

import { useEffect, useRef } from "react"

import { recordOpen } from "@/lib/student/actions"

/**
 * Records the first view, quietly. Renders nothing.
 *
 * The receipt is deliberately silent — a banner saying "your tutor can see you
 * opened this" would make students hesitate before looking, which is the
 * opposite of what the feature is for. The tutor gets the signal; the student
 * gets an unobstructed task.
 */
export function OpenReceipt({
  assignmentId,
  alreadyOpened,
}: {
  assignmentId: string
  alreadyOpened: boolean
}) {
  const fired = useRef(false)

  useEffect(() => {
    if (alreadyOpened || fired.current) return
    fired.current = true
    void recordOpen(assignmentId)
  }, [assignmentId, alreadyOpened])

  return null
}
