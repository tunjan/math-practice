import Link from "next/link"
import { cn } from "cn"

import { TopicTags } from "@/components/syllabus/topic-tags"
import { badgeVariants, TAG_COLORS } from "@/components/ui/badge"
import type { WeekPlan } from "@/lib/calendar/model"
import { topicColor } from "@/lib/syllabus/model"

/** Past this many bars a week shows a count; the day panel lists them all. */
const WEEK_BARS = 3

function planLabel(plan: WeekPlan): string {
  return plan.topics.map((t) => t.code).join(" ")
}

/**
 * The week's planned subtopics as bars across the whole week row, one per
 * strand (and per student on the tutor's calendar), in the strand's tag
 * colour. Decorative: the day panel says the same in words.
 */
export function WeekBars({
  plans,
  showPerson,
  className,
}: {
  plans: WeekPlan[]
  showPerson: boolean
  className?: string
}) {
  if (plans.length === 0) return null
  const overflow = plans.length > WEEK_BARS
  const visible = overflow ? plans.slice(0, WEEK_BARS - 1) : plans
  const hidden = plans.length - visible.length

  return (
    <div
      aria-hidden
      className={cn("flex flex-col gap-0.5 border-t border-dashed border-border px-1 py-1 md:px-1.5", className)}
    >
      {visible.map((plan) => (
        <span
          key={plan.id}
          title={`${plan.strand}: ${plan.topics.map((t) => `${t.code} ${t.title}`).join(", ")}`}
          className={cn(
            badgeVariants({ variant: topicColor(plan.topic) }),
            "w-full justify-start rounded-md"
          )}
        >
          <span className="truncate">
            {showPerson && plan.person ? `${plan.person} · ` : null}
            <span className="hidden sm:inline">{plan.strand} · </span>
            <span className="font-mono tabular-nums">{planLabel(plan)}</span>
          </span>
        </span>
      ))}
      {hidden > 0 ? <span className="px-1.5 text-xs leading-5 text-muted-foreground">{hidden} more planned</span> : null}
    </div>
  )
}

/** One week bar as a row in the day panel, linking to the tracker it came from. */
export function PlanRow({
  plan,
  href,
  showPerson,
  className,
}: {
  plan: WeekPlan
  href: string
  showPerson: boolean
  className?: string
}) {
  return (
    <Link href={href} data-slot="day-panel-row" className={className}>
      <span className="flex w-14 shrink-0 items-start gap-2">
        <span aria-hidden className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", TAG_COLORS[topicColor(plan.topic)])} />
        <span className="text-xs leading-5 text-muted-foreground">Week</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm leading-5 font-medium">{plan.strand}</span>
        <span className="truncate text-xs text-muted-foreground">
          {["Planned this week", showPerson ? plan.person : null].filter(Boolean).join(" · ")}
        </span>
        <TopicTags tags={plan.topics} max={6} inline />
      </span>
    </Link>
  )
}
