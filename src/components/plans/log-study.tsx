"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { logStudySession } from "@/lib/plans/actions"

/**
 * Counts today as a study day. Once today counts (a self-check or a hand-in
 * does that too), today's day is already filled, so there is nothing to show.
 */
export function LogStudy({ todayCounted }: { todayCounted: boolean }) {
  const [pending, startTransition] = React.useTransition()

  if (todayCounted) return null

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await logStudySession()
          if (result.error) toast.error(result.error)
        })
      }
    >
      <Plus aria-hidden />
      {pending ? "Logging" : "I studied today"}
    </Button>
  )
}
