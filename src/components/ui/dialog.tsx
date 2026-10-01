"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { cn } from "cn"

import { buttonVariants } from "./button"

/**
 * DESIGN.md › Modal: white, 16px radius, a hairline border and the overlay
 * shadow (dialogs are transient, so they are one of the few surfaces allowed
 * it). `alert-dialog.tsx` follows the same spec.
 */
const backdropClass =
  "fixed inset-0 z-50 min-h-dvh bg-muted/50 backdrop-blur-md transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0"

/**
 * Base UI renders no backdrop for a dialog opened from inside another, so the
 * parent steps back itself: an ink wash and a slight recession put the confirm
 * clearly on top.
 */
const nestedOpenClass = [
  "after:pointer-events-none after:absolute after:inset-0 after:bg-foreground/8 after:opacity-0",
  "after:transition-opacity after:duration-200 data-nested-dialog-open:after:opacity-100",
  "sm:data-nested-dialog-open:scale-[0.98]",
].join(" ")

// ── Dialog ──────────────────────────────────────────────────────────────────

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close

/**
 * The working dialog: header, a scrolling body, and a footer that never
 * scrolls away from its actions.
 *
 * Below `sm` it docks to the bottom edge as a sheet, which keeps the actions in
 * thumb reach and lets the on-screen keyboard push it up rather than cover it.
 * From `sm` up it is the 720px centred surface. Centring uses inset + auto
 * margins instead of a translate, so the entrance transform stays free.
 */
function DialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop data-slot="dialog-backdrop" className={backdropClass} />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          // `clip`, not `hidden`: a hidden overflow can still be scrolled by focus().
          "fixed z-50 flex flex-col overflow-clip bg-background text-foreground outline-none",
          "transition-[translate,scale,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "data-ending-style:duration-150 data-ending-style:ease-in",
          // Phone: bottom sheet
          "inset-x-0 bottom-0 max-h-[calc(100dvh-1.5rem)] rounded-t-2xl",
          "data-starting-style:translate-y-full data-ending-style:translate-y-full",
          // Tablet and up: centred surface
          "sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[min(880px,calc(100dvh-4rem))] sm:w-[min(720px,calc(100vw-4rem))] sm:rounded-2xl",
          "sm:border sm:border-border sm:shadow-xl",
          nestedOpenClass,
          "sm:data-starting-style:translate-y-2 sm:data-starting-style:scale-[0.98] sm:data-starting-style:opacity-0",
          "sm:data-ending-style:translate-y-0 sm:data-ending-style:scale-[0.98] sm:data-ending-style:opacity-0",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

/**
 * Title and close control. Without a description it is a quiet label, for
 * composer dialogs whose content carries the weight (New task). With one, it
 * is a full heading separated by a hairline.
 */
function DialogHeader({
  title,
  description,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  className?: string
}) {
  if (description) {
    return (
      <div
        data-slot="dialog-header"
        className={cn(
          "flex shrink-0 items-start gap-4 border-b border-border px-6 pt-5 pb-4",
          className
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <DialogPrimitive.Title data-slot="dialog-title" className="headline-md text-foreground">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="body-md text-muted-foreground">
            {description}
          </DialogPrimitive.Description>
        </div>
        <DialogPrimitive.Close
        data-slot="dialog-close"
          aria-label="Close"
          className={cn(buttonVariants({ size: "icon" }), "-mt-0.5 -mr-1.5")}
        >
          <X aria-hidden />
        </DialogPrimitive.Close>
      </div>
    )
  }

  return (
    <div
      data-slot="dialog-header"
      className={cn("flex shrink-0 items-center justify-between gap-4 pt-3 pr-3 pl-6", className)}
    >
      <DialogPrimitive.Title data-slot="dialog-title" className="label-md text-muted-foreground">{title}</DialogPrimitive.Title>
      {/* Also the escape hatch for touch screen readers, which have no Esc key. */}
      <DialogPrimitive.Close
        data-slot="dialog-close"
        aria-label="Close"
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
      >
        <X aria-hidden />
      </DialogPrimitive.Close>
    </div>
  )
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      // `relative` so visually hidden controls (sr-only radios, file inputs)
      // are positioned inside the scroller, not against the popup.
      className={cn("relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex shrink-0 items-center gap-3 border-t border-border bg-background px-6 pt-4",
        "pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
}
