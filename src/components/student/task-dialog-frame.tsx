"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"

import { cn } from "cn"
import { TASK_TITLE_ID } from "@/lib/student/task-trail"

/**
 * The modal around a task, in the Dub style, framed twice: a grey shell with
 * an inset hairline around the white content with its own, shadow-xl over a
 * blurred light wash. Below `sm` it is a bottom drawer whose shell carries
 * the grab handle.
 *
 * Fully controlled, so the task page can open it from local state without a
 * navigation. `onClosed` runs once the exit transition has finished.
 */
export function TaskDialogShell({
  open,
  onOpenChange,
  onClosed,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClosed?: () => void
  children: React.ReactNode
}) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(next) => {
        if (!next) onClosed?.()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            "dub fixed inset-0 z-50 min-h-dvh bg-black/10 backdrop-blur-md",
            "transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0"
          )}
        />
        <DialogPrimitive.Popup
          aria-labelledby={TASK_TITLE_ID}
          data-drop-scope=""
          className={cn(
            // `clip`, not `hidden`: a hidden overflow can still be scrolled by focus().
            "dub fixed z-50 flex flex-col overflow-clip bg-surface-sunken p-1.5 text-on-surface ring-1 ring-outline outline-none ring-inset",
            "transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "data-ending-style:duration-150 data-ending-style:ease-in",
            // Phone: bottom drawer
            "inset-x-0 bottom-0 max-h-[calc(100dvh-1.5rem)] rounded-t-2xl pb-0",
            "data-starting-style:translate-y-full data-ending-style:translate-y-full",
            // Tablet and up: centred modal
            "sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[min(860px,calc(100dvh-4rem))] sm:w-[min(760px,calc(100vw-4rem))] sm:rounded-2xl sm:pb-1.5",
            "sm:data-starting-style:translate-y-3 sm:data-starting-style:opacity-0",
            "sm:data-ending-style:translate-y-3 sm:data-ending-style:opacity-0"
          )}
        >
          <span aria-hidden className="mx-auto mt-0.5 mb-1.5 h-1 w-12 shrink-0 rounded-full bg-outline-strong sm:hidden" />
          <div
            className={cn(
              "relative flex min-h-0 flex-1 flex-col overflow-clip rounded-t-[10px] bg-surface sm:rounded-[10px]",
              // Drawn over the content so the tray's fill can't cover it.
              "after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-[inherit] after:ring-1 after:ring-outline after:ring-inset"
            )}
          >
            <DialogPrimitive.Close
              aria-label="Close"
              className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-md text-on-surface-muted transition-colors duration-150 hover:bg-surface-sunken hover:text-on-surface max-sm:top-4"
            >
              <X aria-hidden className="size-4" />
            </DialogPrimitive.Close>
            {children}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/**
 * A task dialog that owns its own open state, for tasks reached by URL (the
 * the calendar). Closing leaves the URL: back to where the
 * student came from, or to `closeHref`, or just `onClosed`.
 */
export function TaskDialogFrame({
  children,
  closeHref,
  onClosed,
}: {
  children: React.ReactNode
  closeHref?: string
  onClosed?: () => void
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(true)

  return (
    <TaskDialogShell
      open={open}
      onOpenChange={setOpen}
      onClosed={() => {
        if (onClosed) onClosed()
        else if (closeHref) router.replace(closeHref, { scroll: false })
        else router.back()
      }}
    >
      {children}
    </TaskDialogShell>
  )
}
