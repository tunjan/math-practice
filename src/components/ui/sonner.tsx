"use client"

import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * Toasts are transient overlays, so they get the overlay shadow: a white
 * 12px card with an `outline` hairline. The app is light-only, so the theme is
 * pinned rather than following the OS. Bottom right keeps them clear of the
 * floating bulk-action bar, which docks bottom centre.
 */
const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      gap={8}
      icons={{
        success: <CircleCheck className="size-4 text-success" aria-hidden />,
        info: <Info className="size-4 text-info" aria-hidden />,
        warning: <TriangleAlert className="size-4 text-on-warning-container" aria-hidden />,
        error: <CircleAlert className="size-4 text-error" aria-hidden />,
        loading: <LoaderCircle className="size-4 animate-spin text-on-surface-muted" aria-hidden />,
      }}
      style={
        {
          "--normal-bg": "var(--surface)",
          "--normal-text": "var(--on-surface)",
          "--normal-border": "var(--outline)",
          "--border-radius": "12px",
          "--width": "380px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "gap-3! p-4! font-sans! shadow-overlay!",
          title: "label-md! text-on-surface!",
          description: "body-sm! mt-0.5! text-on-surface-muted!",
          actionButton:
            "h-8! rounded-md! bg-primary! px-3! label-sm! text-on-primary! hover:bg-primary-hover!",
          icon: "mt-0.5! self-start!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
