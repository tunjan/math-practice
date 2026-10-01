"use client"

import * as React from "react"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import {
  BookOpen,
  Check,
  Clock,
  CircleEllipsis,
  GraduationCap,
  Lock,
  PencilLine,
  Sun,
  Trash2,
  Users,
} from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { FormMessage } from "@/components/auth/form-message"
import { Button } from "@/components/ui/button"
import { chipClass, chipOnClass, composerField } from "@/components/ui/chip"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog"
import { DateField } from "@/components/ui/date-field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select"
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
 * A composer, like New task: a title line and notes, then a row of property
 * chips (when, type, who sees it). Each chip shows its value, so the controls
 * explain themselves without labels or helper text.
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
        className="sm:w-[min(520px,calc(100vw-4rem))]"
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
          open={confirmingDiscard}
          onOpenChange={setConfirmingDiscard}
          title={editing ? "Discard changes?" : "Discard event?"}
          description={editing ? "The event stays as it was." : undefined}
          cancelLabel="Keep editing"
          confirmLabel="Discard"
          onConfirm={() => {
            setConfirmingDiscard(false)
            onClose()
          }}
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

/** A native time field inside a chip: no box of its own, no browser clock icon. */
const timeInput =
  "field-sizing-content bg-transparent tabular-nums outline-none [&::-webkit-calendar-picker-indicator]:hidden"

type FieldErrors = Partial<Record<"title" | "end", string>>

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
    end: React.useId(),
    endMessage: React.useId(),
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

  const kind = KIND_OPTIONS.find((option) => option.value === values.kind) ?? KIND_OPTIONS[0]
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
      <input type="hidden" name="kind" value={values.kind} />

      <DialogBody className="flex flex-col gap-2 pt-2 pb-5">
        {serverError ? <FormMessage key={serverError.attempt} error={serverError.message} /> : null}

        <input
          ref={titleRef}
          id={ids.title}
          name="title"
          aria-label="Title"
          placeholder="Event title"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={200}
          autoComplete="off"
          aria-required
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? ids.titleMessage : undefined}
          className={cn(composerField, "headline-md")}
        />
        {errors.title ? (
          <p id={ids.titleMessage} className="-mt-1 body-md text-destructive">
            {errors.title}
          </p>
        ) : null}

        <textarea
          name="notes"
          aria-label="Notes"
          placeholder="Add notes"
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          maxLength={2000}
          rows={2}
          className={cn(composerField, "field-sizing-content max-h-48 min-h-14 resize-none body-md")}
        />

        <div className="flex flex-col gap-2 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <DateField
              variant="chip"
              name="date"
              aria-label={`${values.allDay ? "Start date" : "Date"}, ${formatDayShort(values.date)}`}
              format={formatDayShort}
              value={values.date}
              onChange={(date) => set("date", date)}
            />
            {values.allDay ? (
              <>
                <span aria-hidden className="text-muted-foreground">-</span>
                <DateField
                  variant="chip"
                  name="end_date"
                  aria-label={`End date, ${formatDayShort(values.endDate)}`}
                  format={formatDayShort}
                  min={values.date}
                  max={addDays(values.date, 30)}
                  value={values.endDate}
                  onChange={(date) => set("endDate", date)}
                />
              </>
            ) : (
              <div
                className={cn(
                  chipClass,
                  "pr-1.5 focus-within:border-ring focus-within:ring-4 focus-within:ring-border",
                  errors.end && "border-destructive"
                )}
              >
                <Clock aria-hidden />
                <input
                  type="time"
                  name="start_time"
                  aria-label="Start time"
                  required
                  value={values.start}
                  onChange={(e) => e.target.value && set("start", e.target.value)}
                  className={timeInput}
                />
                <span aria-hidden className="text-muted-foreground">-</span>
                <input
                  id={ids.end}
                  type="time"
                  name="end_time"
                  aria-label="End time"
                  required
                  value={values.end}
                  onChange={(e) => e.target.value && set("end", e.target.value)}
                  aria-invalid={errors.end ? true : undefined}
                  aria-describedby={errors.end ? ids.endMessage : undefined}
                  className={timeInput}
                />
              </div>
            )}
            <TogglePrimitive
              pressed={values.allDay}
              onPressedChange={(pressed) => set("allDay", pressed)}
              className={cn(chipClass, chipOnClass)}
            >
              {values.allDay ? <Check aria-hidden /> : <Sun aria-hidden />}
              All day
            </TogglePrimitive>
          </div>
          {errors.end ? (
            <p id={ids.endMessage} className="body-md text-destructive">
              {errors.end}
            </p>
          ) : showZone ? (
            <p className="body-md text-muted-foreground">Times in {timeZone}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={values.kind}
              onValueChange={(next) => next && set("kind", next as EventKind)}
            >
              <SelectTrigger aria-label="Type" className={chipClass}>
                <kind.icon aria-hidden />
                <span className="truncate">{kind.label}</span>
              </SelectTrigger>
              <SelectContent className="min-w-48">
                {KIND_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <SelectItem key={value} value={value}>
                    <Icon aria-hidden />
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {showShare && role === "tutor" ? (
              <>
                <input type="hidden" name="share" value={values.share} />
                <Select
                  value={values.share || ONLY_YOU}
                  onValueChange={(next) => set("share", next && next !== ONLY_YOU ? (next as string) : "")}
                >
                  <SelectTrigger aria-label="Visible to" className={chipClass}>
                    {sharedStudent ? <Users aria-hidden /> : <Lock aria-hidden />}
                    <span className="truncate">{sharedStudent?.name ?? "Only you"}</span>
                  </SelectTrigger>
                  <SelectContent className="min-w-56">
                    <SelectItem value={ONLY_YOU}>
                      <Lock aria-hidden />
                      Only you
                    </SelectItem>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectGroupLabel>Share with</SelectGroupLabel>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          <Users aria-hidden />
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </>
            ) : null}

            {role === "student" ? (
              <>
                {values.share === "tutor" ? <input type="hidden" name="share" value="tutor" /> : null}
                <TogglePrimitive
                  pressed={values.share === "tutor"}
                  onPressedChange={(pressed) => set("share", pressed ? "tutor" : "")}
                  className={cn(chipClass, chipOnClass)}
                >
                  {values.share === "tutor" ? <Check aria-hidden /> : <Users aria-hidden />}
                  Share with tutor
                </TogglePrimitive>
              </>
            ) : null}
          </div>
        </div>
      </DialogBody>

      <DialogFooter className="py-3">
        {draft.mode === "edit" ? (
          <ConfirmDialog
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
            confirmLabel="Delete event"
            pendingLabel="Deleting"
            pending={deleting}
            onConfirm={handleDelete}
          />
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
          <Button
            type="submit"
            variant="primary"
            loading={pending}
            aria-keyshortcuts={isMac ? "Meta+Enter" : "Control+Enter"}
            shortcut={`${isMac ? "⌘" : "Ctrl"} ↵`}
          >
            {pending ? "Saving" : draft.mode === "edit" ? "Save" : "Add event"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  )
}
