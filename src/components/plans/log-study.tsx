"use client"

import * as React from "react"
import { Check, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { logStudySession } from "@/lib/plans/actions"

/**
 * Counts today as a study day. Once today already counts (a self-check or a
 * hand-in does that too), there is nothing to log, so it says so instead.
 */
export function LogStudy({ todayCounted }: { todayCounted: boolean }) {
  const [pending, startTransition] = React.useTransition()

  if (todayCounted) {
    return (
      <span className="flex h-8 items-center gap-1.5 text-sm text-on-surface-secondary">
        <Check className="size-4 text-on-surface" aria-hidden />
        Today counts
      </span>
    )
  }

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
