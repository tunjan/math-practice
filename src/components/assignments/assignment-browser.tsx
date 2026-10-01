"use client"

import * as React from "react"
import { useActionState } from "react"
import Link from "next/link"
import { ClipboardList, MoreHorizontal, Pencil, Search, SquareArrowOutUpRight, Trash2, X } from "lucide-react"

import { EmptyState } from "@/components/brand/primitives"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableIdentity,
  TableRow,
} from "@/components/brand/table"
import { FormMessage } from "@/components/auth/form-message"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { deleteAssignments, type DeleteState } from "@/lib/assignments/actions"
import { formatDue, relativeToNow } from "@/lib/assignments/dates"
import {
  compareRows,
  FILTER_HINT,
  FILTER_LABEL,
  FILTERS,
  matchesFilter,
  matchesSearch,
  SORT_LABEL,
  SORTS,
  TYPE_LABEL,
  type AssignmentRow,
  type Filter,
  type Sort,
} from "@/lib/assignments/model"

import { TopicTags } from "@/components/syllabus/topic-tags"

import { StatusBadge } from "./status-badge"

export type QueuedRow = {
  id: string
  title: string
  dueAt: string
  inviteeName: string
}

function isRowOverdue(row: AssignmentRow, now: Date) {
  return (
    new Date(row.dueAt) < now && row.stage !== "submitted" && row.stage !== "reviewed"
  )
}

export function AssignmentBrowser({
  rows,
  queued,
  timeZone,
}: {
  rows: AssignmentRow[]
  queued: QueuedRow[]
  /** The tutor's zone, so server and browser render the same dates. */
  timeZone: string
}) {
  const [filter, setFilter] = React.useState<Filter>("attention")
  const [sort, setSort] = React.useState<Sort>("due-asc")
  const [query, setQuery] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [confirmIds, setConfirmIds] = React.useState<string[] | null>(null)

  const [deleteState, deleteAction, deleting] = useActionState<DeleteState, FormData>(
    deleteAssignments,
    {}
  )

  // A finished delete clears the selection and closes the confirm step.
  const [seenState, setSeenState] = React.useState(deleteState)
  if (deleteState !== seenState) {
    setSeenState(deleteState)
    setConfirmIds(null)
    if (deleteState.notice) setSelected(new Set())
  }

  const now = React.useMemo(() => new Date(), [])

  const counts = React.useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [f, rows.filter((row) => matchesFilter(row, f, now)).length])
      ) as Record<Filter, number>,
    [rows, now]
  )

  const visible = React.useMemo(
    () =>
      rows
        .filter((row) => matchesFilter(row, filter, now) && matchesSearch(row, query))
        .sort((a, b) => compareRows(a, b, sort)),
    [rows, filter, query, sort, now]
  )

  const selectedVisible = visible.filter((row) => selected.has(row.id)).length
  const allSelected = visible.length > 0 && selectedVisible === visible.length

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
      const next = new Set(prev)
      if (allSelected) visible.forEach((row) => next.delete(row.id))
      else visible.forEach((row) => next.add(row.id))
      return next
    })
  }

  const confirmCount = confirmIds?.length ?? 0

  return (
    <div className="flex flex-col gap-4">
      <FormMessage error={deleteState.error} notice={deleteState.notice} />

      <div data-slot="toolbar" className="flex flex-wrap items-center justify-between gap-2">
          <ToggleGroup
            variant="track"
            aria-label="Filter tasks"
            value={[filter]}
            onValueChange={(next) => next[0] && setFilter(next[0] as Filter)}
          >
            {FILTERS.map((option) => (
              <ToggleGroupItem key={option} value={option} title={FILTER_HINT[option]}>
                {FILTER_LABEL[option]}
                <span className="text-xs font-normal text-muted-foreground tabular-nums">{counts[option]}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <div className="relative sm:w-72">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tasks, students, topics"
                aria-label="Search tasks"
                className="rounded-lg border-border pl-9"
              />
            </div>
            <NativeSelect
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
              aria-label="Sort tasks"
              wrapperClassName="sm:w-44"
              className="rounded-lg border-border"
            >
              {SORTS.map((option) => (
                <option key={option} value={option}>
                  {SORT_LABEL[option]}
                </option>
              ))}
            </NativeSelect>
          </div>
      </div>

      <Card>
        {visible.length === 0 ? (
          <EmptyState
            icon={<ClipboardList />}
            title={
              query
                ? "No tasks match that search"
                : filter === "attention"
                  ? "Nothing needs you right now"
                  : "No tasks here"
            }
            description={
              query
                ? "Try a student's name or a different word from the title."
                : filter === "attention"
                  ? "Hand-ins, returned work and anything past due will appear here."
                  : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHead className="w-12 pr-0">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={selectedVisible > 0 && !allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all shown tasks"
                  />
                </TableHead>
                <TableHead>Task</TableHead>
                <TableHead className="hidden xl:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Due</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {visible.map((row) => {
                const overdue = isRowOverdue(row, now)
                const isSelected = selected.has(row.id)
                return (
                  <TableRow key={row.id} data-selected={isSelected} className="relative">
                    <TableCell className="w-12 pr-0">
                      <div className="relative z-[1] flex">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggle(row.id)}
                          aria-label={`Select ${row.title}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="w-full max-w-0 md:min-w-56">
                      <Link
                        href={`/tutor/assignments/${row.id}`}
                        className="rounded-md after:absolute after:inset-0"
                      >
                        <TableIdentity
                          primary={row.title}
                          secondary={
                            row.topic ? `${row.studentName} · ${row.topic}` : row.studentName
                          }
                        />
                      </Link>
                      <TopicTags tags={row.topics} max={4} className="relative z-[1] mt-1.5" />
                      <div className="mt-1.5 sm:hidden">
                        <StatusBadge stage={row.stage} verdict={row.verdict} overdue={overdue} />
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap xl:table-cell">
                      <span className="text-muted-foreground">
                        {TYPE_LABEL[row.type]}
                      </span>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap md:table-cell">
                      <div className="flex flex-col">
                        <span className="text-foreground/80 tabular-nums">
                          {formatDue(row.dueAt, timeZone)}
                        </span>
                        <span className="text-xs leading-4 text-muted-foreground">
                          {relativeToNow(row.dueAt, now)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap sm:table-cell">
                      <StatusBadge stage={row.stage} verdict={row.verdict} overdue={overdue} />
                    </TableCell>
                    <TableCell className="w-12 pl-0">
                      <div className="relative z-[1] flex justify-end">
                        <RowMenu row={row} onDelete={() => setConfirmIds([row.id])} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {queued.length > 0 ? (
        <Card>
          <CardHeader
            title="Waiting on an invite"
            description="These appear in the student's list once they accept their invite."
          />
          <ul role="list">
            {queued.map((task) => (
              <li
                key={task.id}
                className="flex min-h-14 items-center justify-between gap-4 border-t border-border px-4 py-3 first:border-t-0"
              >
                <TableIdentity
                  primary={task.title}
                  secondary={`${task.inviteeName} · due ${formatDue(task.dueAt, timeZone)}`}
                />
                <Badge variant="gray">Queued</Badge>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {selected.size > 0 ? (
        <div
          role="region"
          aria-label="Bulk actions"
          className="fixed bottom-6 left-1/2 z-40 flex h-12 -translate-x-1/2 items-center gap-1 rounded-xl bg-foreground px-2 text-background shadow-lg animate-in fade-in-0 slide-in-from-bottom-2 duration-150 lg:left-[calc(50%+130px)]"
        >
          <span className="px-2 text-sm whitespace-nowrap tabular-nums">
            {selected.size} selected
          </span>
          <span aria-hidden className="mx-1 h-5 w-px bg-background/20" />
          <Button variant="ghost" className="text-background hover:bg-background/10 hover:text-background" size="sm" onClick={() => setSelected(new Set())}>
            <X aria-hidden />
            Clear
          </Button>
          <Button variant="ghost" className="text-background hover:bg-background/10 hover:text-background" size="sm" onClick={() => setConfirmIds([...selected])}>
            <Trash2 aria-hidden />
            Delete
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmIds !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmIds(null)
        }}
        title={confirmCount === 1 ? "Delete this task?" : `Delete ${confirmCount} tasks?`}
        description="The task, its materials and any hand-ins are removed for you and the student. This can't be undone."
        confirmLabel={confirmCount === 1 ? "Delete task" : "Delete tasks"}
        pendingLabel="Deleting"
        pending={deleting}
        action={deleteAction}
        fields={{ assignment_ids: confirmIds ?? [] }}
      />
    </div>
  )
}

function RowMenu({ row, onDelete }: { row: AssignmentRow; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${row.title}`}
        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-[opacity,background-color] hover:bg-accent hover:text-foreground data-popup-open:bg-accent data-popup-open:opacity-100 md:opacity-0 md:group-hover/row:opacity-100 md:focus-visible:opacity-100"
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLinkItem render={<Link href={`/tutor/assignments/${row.id}`} />}>
          <SquareArrowOutUpRight aria-hidden />
          Open
        </DropdownMenuLinkItem>
        <DropdownMenuLinkItem render={<Link href={`/tutor/assignments/${row.id}/edit`} />}>
          <Pencil aria-hidden />
          Edit
        </DropdownMenuLinkItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 aria-hidden />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

