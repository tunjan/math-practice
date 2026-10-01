"use client"

import * as React from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, getDefaultClassNames, type DayButton } from "react-day-picker"
import { enGB } from "react-day-picker/locale"
import { cn } from "cn"

import { buttonVariants } from "@/components/ui/button"

/**
 * shadcn/ui Calendar (react-day-picker v9), restyled to DESIGN.md.
 *
 * 32px day cells, 8px radius. The selected day is the near-black `primary`
 * fill; today is only bold with a hairline, so it never reads as selected.
 * Weeks start on Monday (en-GB), like the month grid on the calendar page.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames()

  return (
    <DayPicker
      locale={enGB}
      weekStartsOn={1}
      showOutsideDays={showOutsideDays}
      className={cn("group/calendar p-1 [--cell-size:--spacing(8)]", className)}
      classNames={{
        root: cn("w-fit", defaults.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", defaults.months),
        month: cn("flex w-full flex-col gap-3", defaults.month),
        nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1", defaults.nav),
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-(--cell-size) aria-disabled:opacity-40",
          defaults.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-(--cell-size) aria-disabled:opacity-40",
          defaults.button_next
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaults.month_caption
        ),
        caption_label: cn("label-md text-foreground select-none", defaults.caption_label),
        month_grid: cn("w-full border-collapse", defaults.month_grid),
        weekdays: cn("flex", defaults.weekdays),
        weekday: cn(
          "flex-1 label-sm font-normal text-muted-foreground select-none",
          defaults.weekday
        ),
        week: cn("mt-1 flex w-full", defaults.week),
        day: cn("relative aspect-square h-full w-full p-0 text-center select-none", defaults.day),
        range_start: cn("rounded-l-lg bg-muted", defaults.range_start),
        range_middle: cn("rounded-none bg-muted", defaults.range_middle),
        range_end: cn("rounded-r-lg bg-muted", defaults.range_end),
        today: defaults.today,
        outside: cn("text-muted-foreground", defaults.outside),
        disabled: cn("text-muted-foreground opacity-40", defaults.disabled),
        hidden: cn("invisible", defaults.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...rest }) => {
          const Icon =
            orientation === "left" ? ChevronLeft : orientation === "right" ? ChevronRight : ChevronDown
          return <Icon className={cn("size-4", className)} {...rest} />
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const selected = modifiers.selected && !modifiers.range_middle

  return (
    <button
      ref={ref}
      type="button"
      data-selected={selected || undefined}
      data-today={modifiers.today || undefined}
      className={cn(
        "flex size-(--cell-size) w-full min-w-(--cell-size) items-center justify-center rounded-lg",
        "font-mono text-[13px] leading-none tabular-nums text-foreground outline-none",
        "transition-colors duration-100 hover:bg-accent",
        "focus-visible:ring-2 focus-visible:ring-foreground/25",
        "data-today:font-semibold data-today:ring-1 data-today:ring-input data-today:ring-inset",
        "data-selected:bg-primary data-selected:text-primary-foreground data-selected:hover:bg-primary/90 data-selected:ring-0",
        modifiers.outside && !selected && "text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
