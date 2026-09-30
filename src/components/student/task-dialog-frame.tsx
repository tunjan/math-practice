"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"

import { cn } from "cn"
import { TASK_TITLE_ID } from "@/lib/student/task-trail"

/** A point in the viewport the dialog grows out of, such as a card's centre. */
export type DialogOrigin = { x: number; y: number }

export function centreOf(rect: DOMRect): DialogOrigin {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

/**
 * The modal around a task, in the Dub style, framed twice: a grey shell with
 * an inset hairline around the white content with its own, shadow-xl over a
 * blurred light wash. Below `sm` it is a bottom drawer whose shell carries
 * the grab handle.
 *
 * Fully controlled, so the task page can open it from local state without a
 * navigation. `onClosed` runs once the exit transition has finished.
 *
 * From `sm` up it grows out of `origin` (the card that opened it) on a soft
 * spring, and shrinks back into it on close; without one it grows from the
 * centre. The centred box sits at the viewport's middle, so the origin in its
 * own coordinates is the point minus half the viewport plus half the box.
 */
export function TaskDialogShell({
  open,
  onOpenChange,
  onClosed,
  origin = null,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClosed?: () => void
  origin?: DialogOrigin | null
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
          style={
            origin
              ? { transformOrigin: `calc(${origin.x}px - 50vw + 50%) calc(${origin.y}px - 50dvh + 50%)` }
              : undefined
          }
          className={cn(
            // `clip`, not `hidden`: a hidden overflow can still be scrolled by focus().
            "dub fixed z-50 flex flex-col overflow-clip bg-surface-sunken p-1.5 text-on-surface ring-1 ring-outline outline-none ring-inset",
            // A soft spring in, a quick settle out.
            "transition-[translate,scale,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            "data-ending-style:duration-200 data-ending-style:ease-[cubic-bezier(0.4,0,1,1)]",
            "motion-reduce:transition-opacity motion-reduce:duration-150",
            // Phone: bottom drawer
            "inset-x-0 bottom-0 max-h-[calc(100dvh-1.5rem)] rounded-t-2xl pb-0",
            "data-starting-style:translate-y-full data-ending-style:translate-y-full",
            "motion-reduce:data-starting-style:translate-y-0 motion-reduce:data-starting-style:opacity-0",
            "motion-reduce:data-ending-style:translate-y-0 motion-reduce:data-ending-style:opacity-0",
            // Tablet and up: centred modal, grown out of the card
            "sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[min(860px,calc(100dvh-4rem))] sm:w-[min(760px,calc(100vw-4rem))] sm:rounded-2xl sm:pb-1.5",
            "sm:data-starting-style:translate-y-0 sm:data-starting-style:scale-[0.6] sm:data-starting-style:opacity-0",
            "sm:data-ending-style:translate-y-0 sm:data-ending-style:scale-[0.6] sm:data-ending-style:opacity-0",
            "sm:motion-reduce:data-starting-style:scale-100 sm:motion-reduce:data-ending-style:scale-100"
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
