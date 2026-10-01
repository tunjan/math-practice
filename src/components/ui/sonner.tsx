"use client"

import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * Toasts are transient overlays, so they get a drop shadow: a white
 * 8px card with an `outline` hairline. The app is light-only, so the theme is
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
        error: <CircleAlert className="size-4 text-destructive" aria-hidden />,
        loading: <LoaderCircle className="size-4 animate-spin text-muted-foreground" aria-hidden />,
      }}
      style={
        {
          "--normal-bg": "var(--background)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "8px",
          "--width": "380px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "gap-3! px-4! py-3! font-sans! shadow-lg!",
          title: "label-md! text-foreground!",
          description: "body-md! mt-0.5! text-muted-foreground!",
          actionButton:
            "h-8! rounded-lg! bg-primary! px-3! label-sm! text-primary-foreground! hover:bg-primary/90!",
          icon: "mt-0.5! self-start!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
