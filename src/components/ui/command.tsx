"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"
import { cn } from "cn"

/**
 * shadcn/ui Command (cmdk), restyled to DESIGN.md › menu-surface: white,
 * 12px radius, hairline dividers, 36px items with a `surface-hover` highlight.
 */
function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn("flex size-full flex-col overflow-hidden bg-surface text-on-surface", className)}
      {...props}
    />
  )
}

/**
 * The palette as a dialog: pinned a fifth of the way down so the list grows
 * downward without the input jumping, on the same flat backdrop as dialogs.
 */
function CommandDialog({
  title = "Command palette",
  description = "Search for a page or record to open.",
  scope,
  children,
  className,
  ...props
}: DialogPrimitive.Root.Props & {
  title?: string
  description?: string
  /** A theme scope such as `dub`. The dialog is portalled, so it can't inherit one. */
  scope?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <DialogPrimitive.Root {...props}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          data-slot="dialog-backdrop"
          className={cn(
            "fixed inset-0 z-50 min-h-dvh bg-on-surface/18 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0",
            scope
          )}
        />
        <DialogPrimitive.Popup
          data-slot="command-dialog"
          className={cn(
            "fixed top-[12dvh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-outline bg-surface shadow-overlay outline-none sm:top-[20dvh]",
            "transition-[scale,opacity] duration-150 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0",
            scope,
            className
          )}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="flex h-12 items-center gap-2.5 border-b border-outline px-4">
      <Search aria-hidden className="size-4 shrink-0 text-on-surface-muted" />
      <CommandPrimitive.Input
        data-slot="command-input"
        data-composer
        className={cn(
          "h-full w-full min-w-0 bg-transparent body-md text-on-surface outline-hidden placeholder:text-on-surface-muted disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn("max-h-[min(24rem,60dvh)] scroll-py-2 overflow-x-hidden overflow-y-auto p-2", className)}
      {...props}
    />
  )
}

function CommandEmpty({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-8 text-center body-sm text-on-surface-muted", className)}
      {...props}
    />
  )
}

function CommandLoading({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Loading>) {
  return (
    <CommandPrimitive.Loading
      data-slot="command-loading"
      className={cn("px-2 py-3 body-sm text-on-surface-muted", className)}
      {...props}
    />
  )
}

function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:label-caps [&_[cmdk-group-heading]]:text-on-surface-muted",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-2 my-2 h-px bg-outline", className)}
      {...props}
    />
  )
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2 body-md text-on-surface outline-hidden select-none",
        "data-[selected=true]:bg-surface-hover",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-on-surface-muted",
        className
      )}
      {...props}
    />
  )
}

function CommandShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn("ml-auto shrink-0 body-sm text-on-surface-muted", className)}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
  CommandShortcut,
}
