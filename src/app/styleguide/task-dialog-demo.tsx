"use client"

import * as React from "react"

import { TaskDialogFrame } from "@/components/student/task-dialog-frame"
import { Button } from "@/components/ui/button"

/** Opens a fixture in the real dialog, without touching the URL. */
export function TaskDialogDemo({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      {open ? <TaskDialogFrame onClosed={() => setOpen(false)}>{children}</TaskDialogFrame> : null}
    </>
  )
}
