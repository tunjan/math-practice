"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "cn"

import { fieldBase } from "./input"

/**
 * A styled native <select>. Native keeps keyboard, screen-reader and mobile
 * picker behaviour for free; the chrome matches `input-field`.
 */
function NativeSelect({
  className,
  wrapperClassName,
  ...props
}: React.ComponentProps<"select"> & { wrapperClassName?: string }) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select
        data-slot="select"
        className={cn(
          fieldBase,
          "body-md h-10 cursor-pointer appearance-none border-outline-strong bg-surface pr-9 pl-3",
          className
        )}
        {...props}
      />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-on-surface-muted"
      />
    </div>
  )
}

// ── Select (Base UI) ────────────────────────────────────────────────────────
// For compact pickers. The popup is DESIGN.md's menu-surface and its rows are
// menu-items; the trigger is left to the caller.

const Select = SelectPrimitive.Root
const SelectTrigger = SelectPrimitive.Trigger
const SelectGroup = SelectPrimitive.Group

function SelectContent({
  className,
  align = "start",
  sideOffset = 6,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<SelectPrimitive.Positioner.Props, "align" | "sideOffset">) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        alignItemWithTrigger={false}
        side="bottom"
        align={align}
        sideOffset={sideOffset}
        className="isolate z-50 outline-none"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "flex max-h-(--available-height) min-w-(--anchor-width) origin-(--transform-origin) flex-col overflow-y-auto rounded-xl border border-outline bg-surface p-2 text-on-surface shadow-overlay outline-none",
            "transition-[opacity,scale] duration-150 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0",
            className
          )}
          {...props}
        />
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "flex h-10 w-full cursor-default items-center gap-3 rounded-md px-3 body-md text-on-surface outline-none select-none",
        "data-highlighted:bg-surface-sunken data-disabled:opacity-45",
        "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-on-surface-secondary",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex min-w-0 flex-1 items-center gap-3 truncate">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="ml-auto">
        <Check aria-hidden />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectGroupLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      className={cn("px-3 pt-2 pb-1.5 label-caps text-on-surface-muted", className)}
      {...props}
    />
  )
}

function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      className={cn("-mx-2 my-2 h-px bg-outline", className)}
      {...props}
    />
  )
}

export {
  NativeSelect,
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
}
