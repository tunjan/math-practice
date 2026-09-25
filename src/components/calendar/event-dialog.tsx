"use client"

import * as React from "react"
import {
  AlignLeft,
  BookOpen,
  ChevronsUpDown,
  CircleEllipsis,
  Clock,
  GraduationCap,
  Lock,
  PencilLine,
  Trash2,
  Users,
} from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { FormMessage } from "@/components/auth/form-message"
import { Button } from "@/components/ui/button"
import {
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog"
import { DateField } from "@/components/ui/date-field"
import { Input } from "@/components/ui/input"
import { SegmentedControl } from "@/components/ui/segmented-control"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { DeleteEventState, EventFormState } from "@/lib/calendar/actions"
import {
  addDays,
  dayKeyOf,
  formatDayShort,
  timeOf,
  utcDayKey,
  type DayKey,
} from "@/lib/calendar/dates"
import { EVENT_KIND_LABEL, type EventItem, type EventKind, type Person } from "@/lib/calendar/model"

export type SaveEventAction = (state: EventFormState, formData: FormData) => Promise<EventFormState>
export type DeleteEventAction = (
  state: DeleteEventState,
  formData: FormData
) => Promise<DeleteEventState>

/** What the dialog is doing: adding to a day, or editing one of yours. */
export type EventDraft =
  | { mode: "create"; day: DayKey; share: string }
  | { mode: "edit"; event: EventItem }

const KIND_OPTIONS = [
  { value: "lesson", label: EVENT_KIND_LABEL.lesson, icon: GraduationCap },
  { value: "exam", label: EVENT_KIND_LABEL.exam, icon: PencilLine },
  { value: "study", label: EVENT_KIND_LABEL.study, icon: BookOpen },
  { value: "other", label: EVENT_KIND_LABEL.other, icon: CircleEllipsis },
] as const satisfies readonly { value: EventKind; label: string; icon: unknown }[]

const ONLY_YOU = "only-you"

type OpenChangeDetails = Parameters<
  NonNullable<React.ComponentProps<typeof Dialog>["onOpenChange"]>
>[1]

/**
 * Add or edit one of your own calendar events.
 *
 * A composer, like New task: the title is the heading, the type sits under
 * it, and the details are one hairline card of icon-led rows (when, who sees
 * it, notes). Labels are for screen readers; the icons and values carry the
 * meaning on screen.
 *
 * Times are wall-clock values in the person's profile timezone, the clock the
 * grid is drawn in. The zone is only named when it differs from the device's,
 * which is the one case where it could be misread. The server converts them
 * to moments.
 */
export function EventDialog({
  draft,
  onClose,
  role,
  timeZone,
  today,
  students,
  saveAction,
  deleteAction,
}: {
  /** Null while closed. */
  draft: EventDraft | null
  onClose: () => void
  role: "tutor" | "student"
  timeZone: string
  today: DayKey
  students: Person[]
  saveAction: SaveEventAction
  deleteAction: DeleteEventAction
}) {
  const formRef = React.useRef<EventFormHandle>(null)
  const titleRef = React.useRef<HTMLInputElement>(null)
  const [confirmingDiscard, setConfirmingDiscard] = React.useState(false)
  // Keeps the last draft on screen while the dialog animates out.
  const [shown, setShown] = React.useState(draft)
  if (draft && draft !== shown) setShown(draft)

  function handleOpenChange(open: boolean, details: OpenChangeDetails) {
    if (open) return
    if (formRef.current?.isDirty()) {
      details.cancel()
      setConfirmingDiscard(true)
      return
    }
    onClose()
  }

  const editing = shown?.mode === "edit"

  return (
    <Dialog open={draft !== null} onOpenChange={handleOpenChange}>
      <DialogContent
        scope="dub"
        className="sm:w-[min(540px,calc(100vw-4rem))] sm:rounded-2xl"
        // Straight into the title by keyboard or mouse; on touch, don't throw
        // the on-screen keyboard over the sheet before it has arrived.
        initialFocus={(openType) => (openType === "touch" ? true : (titleRef.current ?? true))}
      >
        <DialogHeader title={editing ? "Edit event" : "New event"} />
        {shown ? (
          <EventForm
            key={shown.mode === "edit" ? shown.event.id : `new-${shown.day}`}
            ref={formRef}
            titleRef={titleRef}
            draft={shown}
            role={role}
            timeZone={timeZone}
            today={today}
            students={students}
            saveAction={saveAction}
            deleteAction={deleteAction}
            onDone={onClose}
          />
        ) : null}

        <ConfirmDialog
          scope="dub"
          open={confirmingDiscard}
          onOpenChange={setConfirmingDiscard}
          title={editing ? "Discard changes?" : "Discard event?"}
          description={editing ? "The event stays as it was." : undefined}
          cancelLabel="Keep editing"
          confirm={
            <Button
              variant="danger"
              onClick={() => {
                setConfirmingDiscard(false)
                onClose()
              }}
            >
              Discard
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  )
}

// ── Form ────────────────────────────────────────────────────────────────────

type EventFormHandle = { isDirty: () => boolean }

type Values = {
  title: string
  kind: EventKind
  date: DayKey
  endDate: DayKey
  allDay: boolean
  start: string
  end: string
  share: string
  notes: string
}

function initialValues(draft: EventDraft, role: "tutor" | "student", timeZone: string, today: DayKey): Values {
  if (draft.mode === "edit") {
    const event = draft.event
    const date = event.allDay ? utcDayKey(event.startsAt) : dayKeyOf(event.startsAt, timeZone)
    return {
      title: event.title,
      kind: event.kind,
      date,
      endDate: event.allDay ? addDays(utcDayKey(event.endsAt), -1) : date,
      allDay: event.allDay,
      start: event.allDay ? "16:00" : timeOf(event.startsAt, timeZone),
      end: event.allDay ? "17:00" : timeOf(event.endsAt, timeZone),
      share: event.sharedWith ? (role === "tutor" ? event.sharedWith.id : "tutor") : "",
      notes: event.notes ?? "",
    }
  }

  // Adding to today: start at the next whole hour. Any other day: 16:00, when
  // most lessons and study sessions happen after school.
  let startHour = 16
  if (draft.day === today) {
    const now = Number(timeOf(new Date(), timeZone).slice(0, 2))
    startHour = Math.min(now + 1, 22)
  }
  return {
    title: "",
    kind: role === "tutor" ? "lesson" : "study",
    date: draft.day,
    endDate: draft.day,
    allDay: false,
    start: `${pad(startHour)}:00`,
    end: `${pad(startHour + 1)}:00`,
    share: draft.share,
    notes: "",
  }
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

function plusHour(time: string): string {
  const [h, m] = time.split(":").map(Number)
  return h! >= 23 ? "23:59" : `${pad(h! + 1)}:${pad(m!)}`
}

function useIsMac() {
  return React.useSyncExternalStore(
    () => () => {},
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => true
  )
}

/** The device's zone, or null on the server. */
function useDeviceTimeZone() {
  return React.useSyncExternalStore(
    () => () => {},
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => null
  )
}

type FieldErrors = Partial<Record<"title" | "end", string>>

/** Borderless: the dialog is the field. The caret marks focus. */
const composerField =
  "w-full bg-transparent text-on-surface outline-none placeholder:text-on-surface-muted"

/** Compact recessed inputs for the date and time values inside a row. */
const valueField = "h-9 w-auto rounded-lg px-2.5"

function EventForm({
  ref,
  titleRef,
  draft,
  role,
  timeZone,
  today,
  students,
  saveAction,
  deleteAction,
  onDone,
}: {
  ref: React.Ref<EventFormHandle>
  titleRef: React.Ref<HTMLInputElement>
  draft: EventDraft
  role: "tutor" | "student"
  timeZone: string
  today: DayKey
  students: Person[]
  saveAction: SaveEventAction
  deleteAction: DeleteEventAction
  onDone: () => void
}) {
  const formRef = React.useRef<HTMLFormElement>(null)
  const [initial] = React.useState(() => initialValues(draft, role, timeZone, today))
  const [values, setValues] = React.useState(initial)
  const [errors, setErrors] = React.useState<FieldErrors>({})
  // Keyed by attempt, so the same message twice is announced twice.
  const [serverError, setServerError] = React.useState<{ message: string; attempt: number }>()
  const [pending, startTransition] = React.useTransition()
  const [deleting, startDelete] = React.useTransition()
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)
  const isMac = useIsMac()
  const deviceZone = useDeviceTimeZone()

  const ids = {
    title: React.useId(),
    titleMessage: React.useId(),
    when: React.useId(),
    end: React.useId(),
    endMessage: React.useId(),
    share: React.useId(),
  }

  React.useImperativeHandle(
    ref,
    () => ({
      isDirty: () =>
        (Object.keys(values) as (keyof Values)[]).some((key) => values[key] !== initial[key]),
    }),
    [values, initial]
  )

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => {
      const next = { ...prev, [key]: value }
      // Moving the start past the end drags the end along, an hour later.
      if (key === "start" && next.end <= next.start) next.end = plusHour(next.start)
      if (key === "date" && next.endDate < next.date) next.endDate = next.date
      return next
    })
    if (key === "title" || key === "start" || key === "end" || key === "allDay") {
      setErrors((prev) => ({ ...prev, [key === "title" ? "title" : "end"]: undefined }))
    }
  }

  function validate(): FieldErrors {
    const found: FieldErrors = {}
    if (!values.title.trim()) found.title = "Add a title."
    if (!values.allDay && values.end <= values.start) found.end = "Ends before it starts."
    return found
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    const found = validate()
    setErrors(found)
    if (found.title) return document.getElementById(ids.title)?.focus()
    if (found.end) return document.getElementById(ids.end)?.focus()

    const data = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await saveAction({}, data)
      if (result.saved) {
        toast.success(result.saved.created ? "Event added" : "Event saved", {
          description: `${result.saved.title}, ${formatDayShort(values.date)}`,
        })
        onDone()
      } else {
        setServerError((prev) => ({
          message: result.error ?? "Something went wrong. Please try again.",
          attempt: (prev?.attempt ?? 0) + 1,
        }))
      }
    })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  function handleDelete() {
    if (draft.mode !== "edit") return
    const data = new FormData()
    data.set("event_id", draft.event.id)
    startDelete(async () => {
      const result = await deleteAction({}, data)
      setConfirmingDelete(false)
      if (result.deleted) {
        toast.success("Event deleted", { description: draft.event.title })
        onDone()
      } else {
        setServerError((prev) => ({
          message: result.error ?? "Couldn't delete the event.",
          attempt: (prev?.attempt ?? 0) + 1,
        }))
      }
    })
  }

  const sharedStudent = role === "tutor" ? students.find((s) => s.id === values.share) : undefined
  const showZone = !values.allDay && deviceZone !== null && deviceZone !== timeZone
  // A tutor with no students has nobody to share with: the row would be a
  // control with one option.
  const showShare = role === "student" || students.length > 0

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="flex min-h-0 flex-1 flex-col"
    >
      {draft.mode === "edit" ? <input type="hidden" name="event_id" value={draft.event.id} /> : null}
      {values.allDay ? <input type="hidden" name="all_day" value="on" /> : null}

      <DialogBody className="flex flex-col gap-5 pt-1 pb-6">
        {serverError ? <FormMessage key={serverError.attempt} error={serverError.message} /> : null}

        <div className="flex flex-col gap-1">
          <input
            ref={titleRef}
            data-composer
            id={ids.title}
            name="title"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={200}
            autoComplete="off"
            aria-label="Title"
            placeholder={role === "tutor" ? "Lesson: circle theorems" : "Mock exam, paper 2"}
            aria-required
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? ids.titleMessage : undefined}
            className={cn(composerField, "headline-md")}
          />
          {errors.title ? (
            <p id={ids.titleMessage} className="body-sm text-error">
              {errors.title}
            </p>
          ) : null}
        </div>

        <SegmentedControl
          legend="Type"
          hideLegend
          name="kind"
          value={values.kind}
          onValueChange={(kind) => set("kind", kind)}
          options={KIND_OPTIONS}
        />

        <div className="divide-y divide-outline rounded-xl border border-outline">
          {/* When */}
          <fieldset className="min-w-0">
            <legend className="sr-only">When</legend>
            <Row icon={Clock}>
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
                  <DateField
                    name="date"
                    variant="filled"
                    mono
                    aria-label={values.allDay ? "First day" : "Date"}
                    value={values.date}
                    onChange={(date) => set("date", date)}
                    className={valueField}
                  />
                  {values.allDay ? (
                    <>
                      <Dash />
                      <DateField
                        name="end_date"
                        variant="filled"
                        mono
                        aria-label="Last day"
                        min={values.date}
                        max={addDays(values.date, 30)}
                        value={values.endDate}
                        onChange={(date) => set("endDate", date)}
                        className={valueField}
                      />
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Input
                        name="start_time"
                        type="time"
                        variant="filled"
                        mono
                        required
                        aria-label="Starts"
                        value={values.start}
                        onChange={(e) => e.target.value && set("start", e.target.value)}
                        className={valueField}
                      />
                      <Dash />
                      <Input
                        id={ids.end}
                        name="end_time"
                        type="time"
                        variant="filled"
                        mono
                        required
                        aria-label="Ends"
                        value={values.end}
                        onChange={(e) => e.target.value && set("end", e.target.value)}
                        aria-invalid={errors.end ? true : undefined}
                        aria-describedby={errors.end ? ids.endMessage : undefined}
                        className={valueField}
                      />
                    </span>
                  )}
                </div>

                {errors.end ? (
                  <p id={ids.endMessage} className="body-sm text-error">
                    {errors.end}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <label className="flex cursor-pointer items-center gap-2.5 body-md text-on-surface-secondary">
                    <Switch checked={values.allDay} onCheckedChange={(checked) => set("allDay", checked)} />
                    All day
                  </label>
                  {showZone ? <span className="mono-data-sm text-on-surface-muted">{timeZone}</span> : null}
                </div>
              </div>
            </Row>
          </fieldset>

          {/* Who sees it */}
          {showShare ? (
            role === "tutor" ? (
              <Row icon={sharedStudent ? Users : Lock}>
                <input type="hidden" name="share" value={values.share} />
                <Select
                  value={values.share || ONLY_YOU}
                  onValueChange={(next) => set("share", next && next !== ONLY_YOU ? (next as string) : "")}
                >
                  <SelectTrigger
                    id={ids.share}
                    aria-label="Who can see this"
                    className={cn(
                      "-mx-2.5 flex h-9 w-[calc(100%+1.25rem)] items-center gap-2 rounded-lg px-2.5 text-left body-md text-on-surface outline-none",
                      "transition-colors duration-150 hover:bg-surface-sunken data-popup-open:bg-surface-sunken"
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{sharedStudent?.name ?? "Only you"}</span>
                    <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-on-surface-muted" />
                  </SelectTrigger>
                  <SelectContent className="dub min-w-(--anchor-width) rounded-lg p-1">
                    <SelectItem value={ONLY_YOU} className="h-9 rounded-md text-sm">
                      <Lock aria-hidden />
                      Only you
                    </SelectItem>
                    <SelectSeparator className="-mx-1 my-1" />
                    <SelectGroup>
                      <SelectGroupLabel className="px-2 pt-1.5 pb-1 text-xs font-medium tracking-normal normal-case">
                        Share with
                      </SelectGroupLabel>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id} className="h-9 rounded-md text-sm">
                          <Users aria-hidden />
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Row>
            ) : (
              <Row icon={values.share === "tutor" ? Users : Lock}>
                <label className="flex h-9 cursor-pointer items-center justify-between gap-4 body-md text-on-surface">
                  Share with your tutor
                  <Switch
                    checked={values.share === "tutor"}
                    onCheckedChange={(checked) => set("share", checked ? "tutor" : "")}
                  />
                </label>
                {values.share === "tutor" ? <input type="hidden" name="share" value="tutor" /> : null}
              </Row>
            )
          ) : null}

          {/* Notes */}
          <Row icon={AlignLeft}>
            <textarea
              name="notes"
              data-composer
              aria-label="Notes"
              placeholder="Notes"
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
              maxLength={2000}
              rows={1}
              className={cn(composerField, "field-sizing-content block max-h-48 min-h-9 resize-none py-2 body-md")}
            />
          </Row>
        </div>
      </DialogBody>

      <DialogFooter className="py-3">
        {draft.mode === "edit" ? (
          <ConfirmDialog
            scope="dub"
            open={confirmingDelete}
            onOpenChange={setConfirmingDelete}
            trigger={
              <Button type="button" variant="destructive" className="-ml-2 px-2 sm:px-3">
                <Trash2 aria-hidden />
                <span className="sr-only sm:not-sr-only">Delete</span>
              </Button>
            }
            title="Delete event?"
            description={
              draft.event.sharedWith
                ? `It also disappears from ${role === "tutor" ? draft.event.sharedWith.name + "'s" : "your tutor's"} calendar.`
                : "This can't be undone."
            }
            confirm={
              <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting" : "Delete"}
              </Button>
            }
          />
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          <DialogClose render={<Button variant="secondary" className="border-outline" />}>Cancel</DialogClose>
          <Button
            type="submit"
            variant="primary"
            disabled={pending}
            aria-keyshortcuts={isMac ? "Meta+Enter" : "Control+Enter"}
          >
            {pending ? "Saving" : draft.mode === "edit" ? "Save" : "Add event"}
            <kbd
              aria-hidden
              className="-mr-1.5 hidden h-5 items-center rounded-xs bg-on-primary/15 px-1.5 font-sans text-[11px] leading-none text-on-primary/80 md:inline-flex"
            >
              {isMac ? "⌘" : "Ctrl"} ↵
            </kbd>
          </Button>
        </div>
      </DialogFooter>
    </form>
  )
}

/** One line of the details card: a 16px icon in a fixed gutter, then its control. */
function Row({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <Icon aria-hidden className="mt-2.5 size-4 shrink-0 text-on-surface-muted" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function Dash() {
  return (
    <span aria-hidden className="text-on-surface-muted">
      –
    </span>
  )
}
