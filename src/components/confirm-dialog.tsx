"use client"

import * as React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

/**
 * The confirm step for a destructive action, composed from `alert-dialog`.
 * It owns the confirm button, so every destructive step looks the same: a
 * `danger` fill named for what it does ("Delete task", not "OK"), beside a
 * safe way back that takes focus first.
 *
 * Confirm runs `onConfirm`, or, with `action`, submits a form carrying `fields`
 * as hidden inputs (for server actions).
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  pendingLabel,
  pending = false,
  onConfirm,
  action,
  fields,
  cancelLabel = "Cancel",
  open,
  onOpenChange,
}: {
  trigger?: React.ReactElement
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel: string
  /** Shown on the confirm button while `pending`, e.g. "Deleting". */
  pendingLabel?: string
  pending?: boolean
  onConfirm?: () => void
  action?: (formData: FormData) => void
  fields?: Record<string, string | string[]>
  cancelLabel?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const confirm = (
    <AlertDialogAction
      type={action ? "submit" : "button"}
      loading={pending}
      onClick={action ? undefined : onConfirm}
    >
      {pending && pendingLabel ? pendingLabel : confirmLabel}
    </AlertDialogAction>
  )

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <AlertDialogTrigger render={trigger} /> : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          {action ? (
            // `contents`, so the button is the footer's flex item and stretches on phones.
            <form action={action} className="contents">
              {Object.entries(fields ?? {}).flatMap(([name, value]) =>
                (Array.isArray(value) ? value : [value]).map((v) => (
                  <input key={`${name}:${v}`} type="hidden" name={name} value={v} />
                ))
              )}
              {confirm}
            </form>
          ) : (
            confirm
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
