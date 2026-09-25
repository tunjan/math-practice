"use client"

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { STATUS_LABEL, TOPIC_NAME, type TrackerRow } from "@/lib/syllabus/model"

/**
 * One green, light to dark, because the states are ordered: nothing yet,
 * started, done. "To see" is the grey track the other two fill, not a colour
 * of its own. Validated with the dataviz palette script (light surface).
 */
const config = {
  seen: { label: STATUS_LABEL.seen, color: "#15803d" },
  in_progress: { label: STATUS_LABEL.in_progress, color: "#5bc27f" },
  to_see: { label: STATUS_LABEL.to_see, color: "#e5e5e5" },
} satisfies ChartConfig

type Datum = { topic: string; seen: number; in_progress: number; to_see: number; total: number }

function byTopic(rows: TrackerRow[]): Datum[] {
  const topics = [...new Set(rows.map((row) => row.topic))].sort((a, b) => a - b)
  return topics.map((topic) => {
    const inTopic = rows.filter((row) => row.topic === topic)
    const count = (status: TrackerRow["progress"]["status"]) =>
      inTopic.filter((row) => row.progress.status === status).length
    return {
      topic: `${topic} ${TOPIC_NAME[topic] ?? ""}`.trim(),
      seen: count("seen"),
      in_progress: count("in_progress"),
      to_see: count("to_see"),
      total: inTopic.length,
    }
  })
}

/**
 * shadcn Chart (Recharts): each IB topic as a 100% stacked bar of its
 * subtopics by status, with "seen/total" at the end of the bar. The tracker
 * below is the table view of the same numbers.
 */
export function TopicProgressChart({ rows }: { rows: TrackerRow[] }) {
  const data = byTopic(rows)
  // On a phone the topic names would squeeze the bars; the number is enough
  // there, and the tooltip still names the topic.
  const narrow = useIsMobile()
  if (data.length === 0) return null

  return (
    <figure aria-label="Subtopics by status, per topic" className="flex flex-col gap-2 rounded-lg border border-outline bg-surface px-4 pt-3 pb-2">
      <figcaption className="text-sm font-medium text-on-surface">By topic</figcaption>
      <ChartContainer config={config} className="aspect-auto w-full" style={{ height: data.length * 36 + 48 }}>
        <BarChart
          accessibilityLayer
          data={data}
          layout="vertical"
          stackOffset="expand"
          barSize={20}
          margin={{ top: 0, right: 48, bottom: 0, left: 0 }}
        >
          <XAxis type="number" hide domain={[0, 1]} />
          <YAxis
            type="category"
            dataKey="topic"
            width={narrow ? 24 : 176}
            tickFormatter={(topic: string) => (narrow ? topic.split(" ")[0]! : topic)}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 12 }}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value, name, item) => (
                  <div className="flex w-full items-center gap-2">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-[2px]"
                      style={{ background: item.color }}
                    />
                    <span className="text-on-surface-muted">{config[name as keyof typeof config]?.label}</span>
                    <span className="ml-auto font-mono font-medium tabular-nums text-on-surface">
                      {value}/{(item.payload as Datum).total}
                    </span>
                  </div>
                )}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} itemSorter={null} />
          <Bar dataKey="seen" stackId="status" fill="var(--color-seen)" stroke="var(--color-surface)" strokeWidth={2} radius={[4, 0, 0, 4]} />
          <Bar dataKey="in_progress" stackId="status" fill="var(--color-in_progress)" stroke="var(--color-surface)" strokeWidth={2} />
          <Bar dataKey="to_see" stackId="status" fill="var(--color-to_see)" stroke="var(--color-surface)" strokeWidth={2} radius={[0, 4, 4, 0]}>
            <LabelList
              position="right"
              offset={8}
              className="fill-on-surface-secondary font-mono text-xs tabular-nums"
              valueAccessor={(entry: { payload: Datum }) => `${entry.payload.seen}/${entry.payload.total}`}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </figure>
  )
}
