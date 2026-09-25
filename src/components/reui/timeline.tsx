"use client"

/**
 * ReUI Timeline (base), from keenthemes/reui (MIT, © 2025 Keenthemes Inc).
 * Restyled to DESIGN.md tokens: a hairline rail, ink for completed steps.
 * Items at or before `value` are marked completed.
 */

import { createContext, useCallback, useContext, useState } from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cn } from "cn"

type TimelineContextValue = {
  activeStep: number
  setActiveStep: (step: number) => void
}

const TimelineContext = createContext<TimelineContextValue | undefined>(undefined)

function useTimeline() {
  const context = useContext(TimelineContext)
  if (!context) throw new Error("useTimeline must be used within a Timeline")
  return context
}

interface TimelineProps extends useRender.ComponentProps<"div"> {
  defaultValue?: number
  value?: number
  onValueChange?: (value: number) => void
  orientation?: "horizontal" | "vertical"
}

function Timeline({
  defaultValue = 1,
  value,
  onValueChange,
  orientation = "vertical",
  className,
  render,
  children,
  ...props
}: TimelineProps) {
  const [activeStep, setInternalStep] = useState(defaultValue)

  const setActiveStep = useCallback(
    (step: number) => {
      if (value === undefined) setInternalStep(step)
      onValueChange?.(step)
    },
    [value, onValueChange]
  )

  const element = useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        className: cn(
          "group/timeline flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col",
          className
        ),
        "data-orientation": orientation,
        "data-slot": "timeline",
        children,
      } as React.ComponentProps<"div">,
      props
    ),
  })

  return (
    <TimelineContext.Provider value={{ activeStep: value ?? activeStep, setActiveStep }}>
      {element}
    </TimelineContext.Provider>
  )
}

function TimelineContent({ className, render, children, ...props }: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      { className: cn("body-sm text-on-surface-muted", className), "data-slot": "timeline-content", children } as React.ComponentProps<"div">,
      props
    ),
  })
}

function TimelineDate({ className, render, children, ...props }: useRender.ComponentProps<"time">) {
  return useRender({
    defaultTagName: "time",
    render,
    props: mergeProps<"time">(
      {
        className: cn(
          "mb-1 block text-xs font-medium text-on-surface-muted group-data-[orientation=vertical]/timeline:max-sm:h-4",
          className
        ),
        "data-slot": "timeline-date",
        children,
      } as React.ComponentProps<"time">,
      props
    ),
  })
}

function TimelineHeader({ className, render, children, ...props }: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      { className: cn(className), "data-slot": "timeline-header", children } as React.ComponentProps<"div">,
      props
    ),
  })
}

function TimelineIndicator({ className, children, render, ...props }: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        "aria-hidden": true,
        className: cn(
          "absolute size-4 rounded-full border-2 border-outline-strong bg-surface group-data-[orientation=horizontal]/timeline:-top-6 group-data-[orientation=horizontal]/timeline:left-0 group-data-[orientation=horizontal]/timeline:-translate-y-1/2 group-data-[orientation=vertical]/timeline:top-0 group-data-[orientation=vertical]/timeline:-left-6 group-data-[orientation=vertical]/timeline:-translate-x-1/2 group-data-completed/timeline-item:border-on-surface",
          className
        ),
        "data-slot": "timeline-indicator",
        children,
      } as React.ComponentProps<"div">,
      props
    ),
  })
}

interface TimelineItemProps extends useRender.ComponentProps<"div"> {
  step: number
}

function TimelineItem({ step, className, render, children, ...props }: TimelineItemProps) {
  const { activeStep } = useTimeline()
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        className: cn(
          "group/timeline-item relative flex flex-1 flex-col gap-0.5 group-data-[orientation=horizontal]/timeline:mt-8 group-data-[orientation=horizontal]/timeline:not-last:pe-8 group-data-[orientation=vertical]/timeline:ms-8 group-data-[orientation=vertical]/timeline:not-last:pb-6",
          className
        ),
        "data-completed": step <= activeStep || undefined,
        "data-slot": "timeline-item",
        children,
      } as React.ComponentProps<"div">,
      props
    ),
  })
}

function TimelineSeparator({ className, render, children, ...props }: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        "aria-hidden": true,
        className: cn(
          "absolute self-start bg-outline group-last/timeline-item:hidden group-data-[orientation=horizontal]/timeline:-top-6 group-data-[orientation=horizontal]/timeline:h-0.5 group-data-[orientation=horizontal]/timeline:w-[calc(100%-1rem-0.25rem)] group-data-[orientation=horizontal]/timeline:translate-x-4.5 group-data-[orientation=horizontal]/timeline:-translate-y-1/2 group-data-[orientation=vertical]/timeline:-left-6 group-data-[orientation=vertical]/timeline:h-[calc(100%-1rem-0.25rem)] group-data-[orientation=vertical]/timeline:w-0.5 group-data-[orientation=vertical]/timeline:-translate-x-1/2 group-data-[orientation=vertical]/timeline:translate-y-4.5",
          className
        ),
        "data-slot": "timeline-separator",
        children,
      } as React.ComponentProps<"div">,
      props
    ),
  })
}

function TimelineTitle({ className, render, children, ...props }: useRender.ComponentProps<"h3">) {
  return useRender({
    defaultTagName: "h3",
    render,
    props: mergeProps<"h3">(
      { className: cn("text-sm font-medium text-on-surface", className), "data-slot": "timeline-title", children } as React.ComponentProps<"h3">,
      props
    ),
  })
}

export {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
}
