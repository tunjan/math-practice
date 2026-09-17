"use client"

import * as React from "react"
import { useActionState } from "react"
import Link from "next/link"
import { ChevronRight, Search, Trash2 } from "lucide-react"

import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { EmptyState, StatusDot } from "@/components/brand/primitives"
import { FormMessage } from "@/components/auth/form-message"
import { deleteAssignments, type DeleteState } from "@/lib/assignments/actions"
import { formatDue, isOverdue, relativeToNow } from "@/lib/assignments/dates"
import {
  compareRows,
  FILTER_HINT,
  FILTER_LABEL,
  FILTERS,
  matchesFilter,
  matchesSearch,
  needsAttention,
  SORT_LABEL,
  SORTS,
  statusAccent,
  statusLabel,
  TYPE_LABEL,
  type AssignmentRow,
  type Filter,
  type Sort,
} from "@/lib/assignments/model"

export type QueuedRow = {
  id: string
  title: string
  dueAt: string
  inviteeName: string
}

/**
 * Filtering, search and sort all run client-side over the full list.
 *
 * This is a single tutor with tens of students: the whole set is a few hundred
 * rows at most, so a round trip per keystroke would add latency for nothing.
 * If the list ever outgrows that, this is the seam to push into the query.
 */
export function AssignmentBrowser({
  rows,
  queued,
}: {
  rows: AssignmentRow[]
  queued: QueuedRow[]
}) {
  const [filter, setFilter] = React.useState<Filter>("attention")
  const [sort, setSort] = React.useState<Sort>("due-asc")
  const [query, setQuery] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const [deleteState, deleteAction, deleting] = useActionState<
    DeleteState,
    FormData
  >(deleteAssignments, {})

  // Clearing the selection once a delete reports back stops the toolbar
  // lingering over rows that are already gone.
  React.useEffect(() => {
    if (deleteState.notice) setSelected(new Set())
  }, [deleteState.notice])

  const counts = React.useMemo(() => {
    const now = new Date()
    return {
      attention: rows.filter((row) => needsAttention(row, now)).length,
      active: rows.filter((row) => row.verdict !== "approved").length,
      approved: rows.filter((row) => row.verdict === "approved").length,
      all: rows.length,
    } satisfies Record<Filter, number>
  }, [rows])

  const visible = React.useMemo(() => {
    const now = new Date()
    return rows
      .filter((row) => matchesFilter(row, filter, now) && matchesSearch(row, query))
      .sort((a, b) => compareRows(a, b, sort))
  }, [rows, filter, query, sort])

  const allVisibleSelected =
    visible.length > 0 && visible.every((row) => selected.has(row.id))

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev)
        for (const row of visible) next.delete(row.id)
        return next
      }
      return new Set([...prev, ...visible.map((row) => row.id)])
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((option) => {
          const active = filter === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              aria-pressed={active}
              title={FILTER_HINT[option]}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 body-sm transition-colors",
                active
                  ? "border-white/40 bg-white/8 text-ink"
                  : "border-hairline text-body-mid hover:border-white/20 hover:text-ink"
              )}
            >
              {FILTER_LABEL[option]}
              <span className="numeric text-xs text-body-mid">
                {counts[option]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search and sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-body-mid" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by task, student or topic"
            className="pl-11"
            aria-label="Search assignments"
          />
        </div>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as Sort)}
          aria-label="Sort assignments"
          className="rounded-lg border border-hairline bg-canvas-soft px-4 py-3 body-sm text-ink outline-none transition-colors hover:border-white/20 focus-visible:border-white/40"
        >
          {SORTS.map((option) => (
            <option key={option} value={option}>
              {SORT_LABEL[option]}
            </option>
          ))}
        </select>
      </div>

      <FormMessage error={deleteState.error} notice={deleteState.notice} />

      {/* Bulk toolbar. Appears only when something is selected, so the resting
          state of the page stays quiet. */}
      {selected.size > 0 ? (
        <form
          action={deleteAction}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/25 bg-canvas-soft px-4 py-3"
        >
          {[...selected].map((id) => (
            <input key={id} type="hidden" name="assignment_ids" value={id} />
          ))}
          <span className="body-sm text-ink">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={deleting}
            >
              <Trash2 />
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </form>
      ) : null}

      {/* Rows */}
      {visible.length === 0 ? (
        <EmptyState
          title={
            query
              ? "Nothing matches that search"
              : filter === "attention"
                ? "Nothing needs you right now"
                : "No tasks here"
          }
          description={
            filter === "attention" && !query
              ? "Work that's been handed in, returned, or gone past due will appear here."
              : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 px-4">
            <Checkbox
              checked={allVisibleSelected}
              onCheckedChange={toggleAll}
              aria-label="Select all visible"
            />
            <span className="eyebrow-sm text-body-mid">
              {visible.length} task{visible.length === 1 ? "" : "s"}
            </span>
          </div>

          <ul className="flex flex-col gap-2">
            {visible.map((row) => {
              const overdue =
                isOverdue(row.dueAt) &&
                row.stage !== "submitted" &&
                row.stage !== "reviewed"
              const isSelected = selected.has(row.id)

              return (
                <li
                  key={row.id}
                  className={cn(
                    "flex items-center gap-4 rounded-lg border bg-canvas-card px-4 py-3 transition-colors",
                    isSelected
                      ? "border-white/40"
                      : "border-hairline hover:border-white/20"
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggle(row.id)}
                    aria-label={`Select ${row.title}`}
                  />

                  <Link
                    href={`/tutor/assignments/${row.id}`}
                    className="flex min-w-0 flex-1 flex-col gap-1.5 outline-none focus-visible:underline"
                  >
                    <span className="truncate body-md text-ink">{row.title}</span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 body-sm text-body-mid">
                      <span>{row.studentName}</span>
                      <span aria-hidden>·</span>
                      <span>{TYPE_LABEL[row.type]}</span>
                      {row.topic ? (
                        <>
                          <span aria-hidden>·</span>
                          <span className="inline-flex items-center gap-1.5">
                            <StatusDot
                              accent={
                                row.topicAccent as Parameters<
                                  typeof StatusDot
                                >[0]["accent"]
                              }
                            />
                            {row.topic}
                          </span>
                        </>
                      ) : null}
                    </span>
                  </Link>

                  <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                    <span
                      className={cn(
                        "numeric text-xs",
                        overdue ? "text-destructive" : "text-body-mid"
                      )}
                    >
                      {formatDue(row.dueAt)}
                    </span>
                    <span className="text-xs text-body-mid">
                      {relativeToNow(row.dueAt)}
                    </span>
                  </div>

                  <Badge variant="strong" className="shrink-0">
                    <StatusDot
                      accent={statusAccent(row.stage, row.verdict, overdue)}
                    />
                    {overdue && row.verdict === null
                      ? "Overdue"
                      : statusLabel(row.stage, row.verdict)}
                  </Badge>

                  <ChevronRight className="size-4 shrink-0 text-body-mid" />
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Work set for students who have not signed up yet. Kept visually
          separate — it cannot be reviewed or deleted from here because there is
          no assignment row yet. */}
      {queued.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-hairline pt-6">
          <p className="eyebrow-sm text-body-mid">Waiting on an invite</p>
          <ul className="flex flex-col gap-2">
            {queued.map((task) => (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-hairline px-4 py-3"
              >
                <div className="flex flex-col gap-1">
                  <span className="body-md text-ink">{task.title}</span>
                  <span className="body-sm text-body-mid">
                    {task.inviteeName} · due {formatDue(task.dueAt)}
                  </span>
                </div>
                <Badge>Queued until they join</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
