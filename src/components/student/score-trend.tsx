"use client"

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"

import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardSection } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { formatDayShort } from "@/lib/calendar/dates"
import type { ScorePoint } from "@/lib/student/dashboard"
import { formatPercent } from "@/lib/syllabus/model"

const config = { percent: { label: "Score", color: "#171717" } } satisfies ChartConfig

/** Exam dates as ticks, dropping any within a fortnight of the last one kept so labels don't collide. */
function thin(times: number[]): number[] {
  const kept: number[] = []
  for (const time of times) {
    if (kept.length === 0 || time - kept.at(-1)! >= 14 * 86_400_000) kept.push(time)
  }
  // Always end on the latest exam.
  if (kept.at(-1) !== times.at(-1)) kept[kept.length - 1] = times.at(-1)!
  return kept
}

/** 7 and 6 read as green, 4 and 5 as yellow, lower as red: the exams table's bands. */
function gradeVariant(grade: number) {
  return grade >= 6 ? "green" : grade >= 4 ? "yellow" : "red"
}

/**
 * shadcn Chart (Recharts): each marked exam's score in date order, with the
 * average as a dashed rule. IB grade boundaries change from paper to paper,
 * so the grade is shown per exam in the tooltip rather than drawn as bands.
 */
export function ScoreTrend({ scores }: { scores: ScorePoint[] }) {
  const average = scores.reduce((sum, score) => sum + score.percent, 0) / scores.length
  const latest = scores.at(-1)!
  const change = latest.percent - scores.at(-2)!.percent
  // A time axis, so a gap between exams reads as one.
  const data = scores.map((score) => ({ ...score, time: Date.parse(`${score.date}T00:00:00Z`) }))
  const ticks = thin(data.map((point) => point.time))

  return (
    <Card>
      <CardHeader
        title="Exam scores"
        description={`${scores.length} marked exams · average ${formatPercent(Math.round(average * 10) / 10)}`}
        action={
          <span className="flex items-center gap-2 text-sm text-on-surface-muted">
            Latest
            <span className="font-mono font-medium text-on-surface tabular-nums">{formatPercent(latest.percent)}</span>
            <span className={change >= 0 ? "text-success" : "text-error"}>
              {change >= 0 ? "▲" : "▼"} {formatPercent(Math.abs(Math.round(change * 10) / 10))}
            </span>
          </span>
        }
      />
      <CardSection className="px-2 pt-4 pb-2 sm:px-4">
        <ChartContainer config={config} className="aspect-auto h-56 w-full">
          <LineChart accessibilityLayer data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={ticks}
              tickFormatter={(time: number) => formatDayShort(new Date(time).toISOString().slice(0, 10))}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              padding={{ left: 12, right: 12 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              width={40}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => `${value}%`}
              tick={{ fontSize: 12 }}
            />
            <ReferenceLine
              y={average}
              stroke="var(--on-surface-muted)"
              strokeDasharray="4 4"
              label={{ value: "Average", position: "insideTopRight", fontSize: 11, fill: "var(--on-surface-muted)" }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideIndicator
                  labelFormatter={(_, payload) => {
                    const point = payload[0]?.payload as ScorePoint | undefined
                    return point ? point.title : null
                  }}
                  formatter={(value, _name, item) => {
                    const point = item.payload as ScorePoint
                    return (
                      <span className="flex w-full items-center gap-2">
                        <span className="text-on-surface-muted">{formatDayShort(point.date)}</span>
                        <span className="ml-auto font-mono font-medium text-on-surface tabular-nums">
                          {formatPercent(Number(value))}
                        </span>
                        {point.ibGrade !== null ? (
                          <Badge variant={gradeVariant(point.ibGrade)} className="font-mono">
                            {point.ibGrade}
                          </Badge>
                        ) : null}
                      </span>
                    )
                  }}
                />
              }
            />
            <Line
              dataKey="percent"
              type="monotone"
              stroke="var(--color-percent)"
              strokeWidth={2}
              dot={{ r: 3.5, fill: "var(--color-surface)", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </CardSection>
    </Card>
  )
}
