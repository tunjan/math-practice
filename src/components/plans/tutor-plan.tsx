import { ListChecks, Pencil, Plus } from "lucide-react"

import { MathProse } from "@/components/assignments/math-prose"
import { EmptyState } from "@/components/brand/primitives"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardSection, StatStrip } from "@/components/ui/card"
import type { Topic } from "@/lib/assignments/task-options"
import { formatDayShort, type DayKey } from "@/lib/calendar/dates"
import {
  nextUnitDates,
  planProgress,
  type Plan,
} from "@/lib/plans/model"
import { streakWeeks, weekStatus } from "@/lib/plans/streak"

import { PlanDialog } from "./plan-dialog"
import { UnitDialog } from "./unit-dialog"
import { UnitRow } from "./unit-row"
import { WeekDots } from "./week-dots"

/** The tutor's view of one student's plan: progress at a glance, then every unit. */
export function TutorPlan({
  plan,
  studyDays,
  topics,
  today,
}: {
  plan: Plan
  studyDays: Set<DayKey>
  topics: Topic[]
  today: DayKey
}) {
  const progress = planProgress(plan.units)
  const week = weekStatus(studyDays, plan.weeklyGoalDays, today)
  const streak = streakWeeks(studyDays, plan.weeklyGoalDays, today)
  const nextDates = nextUnitDates(plan.units, plan.startsOn, today)

  const addUnit = (
    <UnitDialog
      planId={plan.id}
      topics={topics}
      unit={{ id: null, title: "", topicId: null, description: null, ...nextDates, objectives: [] }}
      trigger={
        <Button variant="primary">
          <Plus aria-hidden />
          Add unit
        </Button>
      }
    />
  )

  return (
    <>
      <StatStrip
        stats={[
          {
            label: "Units secure",
            value: (
              <span className="mono-data">
                {progress.secure}/{progress.total}
              </span>
            ),
            note: progress.developing > 0 ? `${progress.developing} developing` : "Your rating",
          },
          {
            label: "Self-check",
            value: <span className="mono-data">{progress.selfPct === null ? "–" : `${progress.selfPct}%`}</span>,
            note: "Student's confidence",
          },
          {
            label: "Streak",
            value: (
              <span className="mono-data">
                {streak} {streak === 1 ? "wk" : "wks"}
              </span>
            ),
            note: `Goal: ${plan.weeklyGoalDays} days a week`,
          },
          {
            label: "This week",
            value: (
              <span className="mono-data">
                {week.active}/{week.goal}
              </span>
            ),
            note: <WeekDots week={week} className="pt-1" />,
          },
        ]}
      />

      <Card>
        <CardHeader
          title={plan.title}
          description={
            <span className="mono-data-sm">
              {formatDayShort(plan.startsOn)} → {formatDayShort(plan.endsOn)}
            </span>
          }
          action={
            <PlanDialog
              studentId={plan.studentId}
              plan={plan}
              trigger={
                <Button size="sm">
                  <Pencil aria-hidden />
                  Edit plan
                </Button>
              }
            />
          }
        />
        {plan.goal ? (
          <CardSection>
            <MathProse>{plan.goal}</MathProse>
          </CardSection>
        ) : null}
      </Card>

      <Card>
        <CardHeader
          title="Units"
          action={plan.units.length > 0 ? addUnit : undefined}
        />
        {plan.units.length === 0 ? (
          <EmptyState
            icon={<ListChecks />}
            title="No units yet"
            description="Break the plan into units, each with dates and a few objectives."
            action={addUnit}
          />
        ) : (
          <ol>
            {plan.units.map((unit, index) => (
              <UnitRow
                key={unit.id}
                unit={unit}
                planId={plan.id}
                topics={topics}
                today={today}
                isFirst={index === 0}
                isLast={index === plan.units.length - 1}
              />
            ))}
          </ol>
        )}
      </Card>
    </>
  )
}

