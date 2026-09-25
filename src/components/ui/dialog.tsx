"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { cn } from "cn"

import { buttonVariants } from "./button"

/**
 * DESIGN.md › dialog-surface
 *
 * White, 16px radius, 24px padding. Dialogs are transient, so they are one of
 * the few surfaces allowed the overlay shadow. The backdrop is a flat ink wash:
 * depth in this system is tonal, never blurred.
 */
const backdropClass =
  "fixed inset-0 z-50 min-h-dvh bg-on-surface/18 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0"

const popupClass = [
  "fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-6",
  "rounded-xl bg-surface p-6 text-on-surface outline-none",
  "transition-[scale,opacity] duration-150 ease-out",
  "data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0",
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
  scope,
  children,
  ...props
}: DialogPrimitive.Popup.Props & {
  /** A theme scope such as `dub`. The dialog is portalled, so it can't inherit one. */
  scope?: string
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop data-slot="dialog-backdrop" className={cn(backdropClass, scope)} />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          // `clip`, not `hidden`: a hidden overflow can still be scrolled by focus().
          "fixed z-50 flex flex-col overflow-clip bg-surface text-on-surface outline-none",
          "transition-[translate,scale,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "data-ending-style:duration-150 data-ending-style:ease-in",
          // Phone: bottom sheet
          "inset-x-0 bottom-0 max-h-[calc(100dvh-1.5rem)] rounded-t-xl",
          "data-starting-style:translate-y-full data-ending-style:translate-y-full",
          // Tablet and up: centred surface
          "sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[min(880px,calc(100dvh-4rem))] sm:w-[min(720px,calc(100vw-4rem))] sm:rounded-xl",
          "sm:data-starting-style:translate-y-2 sm:data-starting-style:scale-[0.98] sm:data-starting-style:opacity-0",
          "sm:data-ending-style:translate-y-0 sm:data-ending-style:scale-[0.98] sm:data-ending-style:opacity-0",
          scope,
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
          "flex shrink-0 items-start gap-4 border-b border-outline px-6 pt-5 pb-4",
          className
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <DialogPrimitive.Title className="headline-md text-on-surface">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="body-sm text-on-surface-muted">
            {description}
          </DialogPrimitive.Description>
        </div>
        <DialogPrimitive.Close
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
      <DialogPrimitive.Title className="label-md text-on-surface-muted">{title}</DialogPrimitive.Title>
      {/* Also the escape hatch for touch screen readers, which have no Esc key. */}
      <DialogPrimitive.Close
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
        "flex shrink-0 items-center gap-3 border-t border-outline bg-surface px-6 pt-4",
        "pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4",
        className
      )}
      {...props}
    />
  )
}

// ── Confirm ─────────────────────────────────────────────────────────────────

/**
 * A confirm step for a destructive action. `trigger` opens it; `confirm` is the
 * control that actually does the work (usually a submit button in a form).
 */
function ConfirmDialog({
  trigger,
  title,
  description,
  confirm,
  cancelLabel = "Cancel",
  open,
  onOpenChange,
  scope,
}: {
  trigger?: React.ReactElement
  title: React.ReactNode
  description?: React.ReactNode
  confirm: React.ReactNode
  cancelLabel?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** A theme scope such as `dub`, as on `DialogContent`. */
  scope?: string
}) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <AlertDialogPrimitive.Trigger render={trigger} /> : null}
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Backdrop data-slot="dialog-backdrop" className={cn(backdropClass, scope)} />
        <AlertDialogPrimitive.Popup className={cn(popupClass, scope)}>
          <div className="flex flex-col gap-2">
            <AlertDialogPrimitive.Title className="headline-md text-on-surface">
              {title}
            </AlertDialogPrimitive.Title>
            {description ? (
              <AlertDialogPrimitive.Description className="body-md text-on-surface-secondary">
                {description}
              </AlertDialogPrimitive.Description>
            ) : null}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogPrimitive.Close
              data-slot="button"
              data-variant="secondary"
              className={cn(buttonVariants({ variant: "secondary" }), scope === "dub" && "border-outline")}
            >
              {cancelLabel}
            </AlertDialogPrimitive.Close>
            {confirm}
          </div>
        </AlertDialogPrimitive.Popup>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

export {
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
}
