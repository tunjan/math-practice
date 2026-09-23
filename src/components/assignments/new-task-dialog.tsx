"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Eye, Paperclip, Plus, UserPlus } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { FormMessage } from "@/components/auth/form-message"
import { EmptyState } from "@/components/brand/primitives"
import { Button, ButtonLink } from "@/components/ui/button"
import {
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createAssignment, type CreateAssignmentState } from "@/lib/assignments/actions"
import { DUE_PRESETS, fromDateTimeLocalValue, toDateTimeLocalValue } from "@/lib/assignments/dates"
import { MATERIAL_ACCEPT } from "@/lib/assignments/files"
import type { Recipient, Topic } from "@/lib/assignments/task-options"

import { useMaterialUploads } from "./material-uploader"
import { MathProse } from "./math-prose"
import { AttachmentChips, DueChip, StudentChip, TopicChip, TypeChip } from "./new-task-fields"

type CreateAction = (
  state: CreateAssignmentState,
  formData: FormData
) => Promise<CreateAssignmentState>

type Created = NonNullable<CreateAssignmentState["created"]> & { recipient: string }

type OpenChangeDetails = Parameters<
  NonNullable<React.ComponentProps<typeof Dialog>["onOpenChange"]>
>[1]

/**
 * "New task", as a dialog over whichever list the tutor is on.
 *
 * The trigger is the page's one primary action. Closing a dialog with work in
 * it asks first, and discarding also removes anything already uploaded, so an
 * abandoned draft leaves nothing behind in Storage.
 */
export function NewTaskDialog({
  recipients,
  topics,
  defaultOpen = false,
  action = createAssignment,
}: {
  recipients: Recipient[]
  topics: Topic[]
  /** Open on arrival, for links to the old /tutor/assignments/new page. */
  defaultOpen?: boolean
  /** Swapped out by the styleguide, which must never write. */
  action?: CreateAction
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(defaultOpen)
  const [confirmingDiscard, setConfirmingDiscard] = React.useState(false)
  // Every opening starts clean: a fresh reserved id and no leftover uploads.
  const [draft, setDraft] = React.useState(0)
  const formRef = React.useRef<NewTaskFormHandle>(null)
  const titleRef = React.useRef<HTMLInputElement>(null)

  function handleOpenChange(next: boolean, details: OpenChangeDetails) {
    if (!next && formRef.current?.isDirty()) {
      details.cancel()
      setConfirmingDiscard(true)
      return
    }
    setOpen(next)
  }

  function discard() {
    formRef.current?.discard()
    setConfirmingDiscard(false)
    setOpen(false)
  }

  const handleCreated = React.useCallback(
    (created: Created) => {
      setOpen(false)
      if (created.queued) {
        toast.success(`Task queued for ${created.recipient}`, {
          description: "They'll see it once they accept their invite.",
        })
      } else {
        toast.success(`Task set for ${created.recipient}`, {
          description: created.title,
          action: {
            label: "View",
            onClick: () => router.push(`/tutor/assignments/${created.id}`),
          },
        })
      }
    },
    [router]
  )

  function handleClosed(isOpen: boolean) {
    if (isOpen) return
    setDraft((n) => n + 1)
    // Drop the ?new that opened it, so a refresh doesn't open it again.
    const url = new URL(window.location.href)
    if (url.searchParams.has("new")) {
      url.searchParams.delete("new")
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} onOpenChangeComplete={handleClosed}>
      <DialogTrigger render={<Button variant="primary" />}>
        <Plus aria-hidden />
        New task
      </DialogTrigger>

      <DialogContent
        // Straight into the title by keyboard or mouse; on touch, don't throw
        // the on-screen keyboard over the sheet before it has even arrived.
        initialFocus={(openType) => (openType === "touch" ? true : (titleRef.current ?? true))}
      >
        <DialogHeader title="New task" />

        {recipients.length === 0 ? (
          <DialogBody>
            <EmptyState
              icon={<UserPlus />}
              title="No students yet"
              description="Invite a student first. You can set work for them before they've even joined."
              action={
                <ButtonLink variant="primary" href="/tutor/students">
                  Invite student
                </ButtonLink>
              }
              className="py-8"
            />
          </DialogBody>
        ) : (
          <NewTaskForm
            key={draft}
            ref={formRef}
            titleRef={titleRef}
            recipients={recipients}
            topics={topics}
            action={action}
            onCreated={handleCreated}
          />
        )}

        <ConfirmDialog
          open={confirmingDiscard}
          onOpenChange={setConfirmingDiscard}
          title="Discard this task?"
          description="The title, instructions and any files you've uploaded will be lost."
          cancelLabel="Keep editing"
          confirm={
            <Button variant="destructive" onClick={discard}>
              Discard
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  )
}

// ── Form ────────────────────────────────────────────────────────────────────

type NewTaskFormHandle = {
  /** Anything typed or uploaded that closing would throw away. */
  isDirty: () => boolean
  /** Remove uploaded objects for a draft that is being abandoned. */
  discard: () => void
}

type FieldKey = "title" | "target" | "due"
type FieldErrors = Partial<Record<FieldKey, string>>

/** Top to bottom, so focus lands on the first problem the tutor will see. */
const FIELD_ORDER: FieldKey[] = ["title", "target", "due"]

function validate(data: FormData): FieldErrors {
  const errors: FieldErrors = {}
  if (!String(data.get("title") ?? "").trim()) errors.title = "Add a title."
  if (!data.get("target")) errors.target = "Choose a student."
  if (!data.get("due_at")) errors.due = "Pick a due date."
  return errors
}

function useIsMac() {
  return React.useSyncExternalStore(
    () => () => {},
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => true
  )
}

/** Borderless: the dialog is the field. The caret marks focus. */
const composerField =
  "w-full bg-transparent text-on-surface outline-none placeholder:text-on-surface-muted"

function NewTaskForm({
  ref,
  titleRef,
  recipients,
  topics,
  action,
  onCreated,
}: {
  ref: React.Ref<NewTaskFormHandle>
  titleRef: React.RefObject<HTMLInputElement | null>
  recipients: Recipient[]
  topics: Topic[]
  action: CreateAction
  onCreated: (created: Created) => void
}) {
  const formRef = React.useRef<HTMLFormElement>(null)
  const instructionsRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const alertRef = React.useRef<HTMLDivElement>(null)
  const errorId = React.useId()
  const isMac = useIsMac()

  const [pending, startTransition] = React.useTransition()
  const [errors, setErrors] = React.useState<FieldErrors>({})
  // Keyed by attempt, so the same message twice is announced twice.
  const [serverError, setServerError] = React.useState<{ message: string; attempt: number }>()

  const [instructions, setInstructions] = React.useState("")
  const [preview, setPreview] = React.useState(false)
  const [target, setTarget] = React.useState<string | null>(() =>
    recipients.length === 1 ? recipients[0]!.value : null
  )
  const [due, setDue] = React.useState(() =>
    toDateTimeLocalValue(DUE_PRESETS[0]!.resolve(new Date()))
  )
  const [type, setType] = React.useState("problem_set")
  const [topic, setTopic] = React.useState<string | null>(null)
  const [dragging, setDragging] = React.useState(false)

  // Reserved up front so materials upload to their final path before the row exists.
  const [assignmentId] = React.useState(() => crypto.randomUUID())
  const uploads = useMaterialUploads(assignmentId)
  const uploading = uploads.uploading

  React.useImperativeHandle(
    ref,
    () => ({
      isDirty() {
        const form = formRef.current
        if (!form) return false
        const data = new FormData(form)
        const typed = (name: string) => String(data.get(name) ?? "").trim() !== ""
        return (
          typed("title") || typed("description") || typed("new_category") || uploads.items.length > 0
        )
      },
      discard: uploads.discardAll,
    }),
    [uploads.items.length, uploads.discardAll]
  )

  React.useEffect(() => {
    if (serverError) alertRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [serverError])

  function clearError(key: FieldKey) {
    if (!(key in errors)) return
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || uploading > 0) return

    const form = event.currentTarget
    const data = new FormData(form)
    const found = validate(data)
    setErrors(found)

    const first = FIELD_ORDER.find((key) => found[key])
    if (first) {
      form.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus()
      return
    }

    const recipient = recipients.find((r) => r.value === target)?.label ?? "the student"
    startTransition(async () => {
      const result = await action({}, data)
      if (result.created) {
        onCreated({ ...result.created, recipient })
      } else {
        setServerError((prev) => ({
          message: result.error ?? "Something went wrong. Please try again.",
          attempt: (prev?.attempt ?? 0) + 1,
        }))
      }
    })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter") return
    if (event.metaKey || event.ctrlKey) {
      event.preventDefault()
      formRef.current?.requestSubmit()
    } else if (event.target === titleRef.current) {
      // Enter moves on to the instructions, like a document.
      event.preventDefault()
      instructionsRef.current?.focus()
    } else if (event.target instanceof HTMLInputElement) {
      // Creating is always deliberate: the button or Cmd/Ctrl+Enter.
      event.preventDefault()
    }
  }

  const iso = fromDateTimeLocalValue(due)?.toISOString() ?? ""
  const chipError = errors.target ?? errors.due
  const uploadStatus =
    uploading > 0 ? `Uploading ${uploading} ${uploading === 1 ? "file" : "files"}` : ""

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        void uploads.upload(event.dataTransfer.files)
      }}
      className="relative flex min-h-0 flex-1 flex-col"
    >
      <input type="hidden" name="assignment_id" value={assignmentId} />
      <input type="hidden" name="files" value={JSON.stringify(uploads.uploaded)} />
      <input type="hidden" name="target" value={target ?? ""} />
      <input type="hidden" name="due_at" value={iso} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="category_id" value={topic ?? ""} />

      <DialogBody className="flex flex-col gap-2 pt-2 pb-5">
        {serverError ? (
          <div ref={alertRef} className="mb-2 scroll-mt-4">
            <FormMessage key={serverError.attempt} error={serverError.message} />
          </div>
        ) : null}

        <input
          ref={titleRef}
          name="title"
          data-field="title"
          aria-label="Title"
          placeholder="Task title"
          maxLength={200}
          autoComplete="off"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? `${errorId}-title` : undefined}
          onChange={() => clearError("title")}
          className={cn(composerField, "headline-md")}
        />
        {errors.title ? (
          <p id={`${errorId}-title`} className="-mt-1 body-sm text-error">
            {errors.title}
          </p>
        ) : null}

        {/* Stays mounted during preview so the text is always submitted. */}
        <textarea
          ref={instructionsRef}
          name="description"
          aria-label="Instructions"
          placeholder="Add instructions (Markdown, LaTeX)"
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          rows={4}
          className={cn(
            composerField,
            "field-sizing-content max-h-72 min-h-28 resize-none body-md",
            preview && "hidden"
          )}
        />
        {preview ? (
          <div className="max-h-72 min-h-28 overflow-y-auto">
            <MathProse>{instructions}</MathProse>
          </div>
        ) : null}

        {uploads.errors.length > 0 ? (
          <ul role="alert" className="flex flex-col gap-0.5">
            {uploads.errors.map((message) => (
              <li key={message} className="body-sm text-error">
                {message}
              </li>
            ))}
          </ul>
        ) : null}
        <AttachmentChips items={uploads.items} onRemove={(item) => void uploads.remove(item)} />

        <div className="flex flex-wrap items-center gap-2 pt-3">
          <StudentChip
            recipients={recipients}
            value={target}
            onValueChange={(next) => {
              setTarget(next)
              clearError("target")
            }}
            invalid={Boolean(errors.target)}
            describedBy={errors.target ? `${errorId}-chips` : undefined}
          />
          <DueChip
            value={due}
            onValueChange={(next) => {
              setDue(next)
              clearError("due")
            }}
            invalid={Boolean(errors.due)}
            describedBy={errors.due ? `${errorId}-chips` : undefined}
          />
          <TypeChip value={type} onValueChange={setType} />
          <TopicChip topics={topics} value={topic} onValueChange={setTopic} />
        </div>
        {chipError ? (
          <p id={`${errorId}-chips`} className="body-sm text-error">
            {chipError}
          </p>
        ) : null}
      </DialogBody>

      <DialogFooter className="py-3">
        <div className="-ml-2 flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip aria-hidden />
            <span className="sr-only sm:not-sr-only">Attach</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={preview}
            disabled={!instructions.trim()}
            onClick={() => setPreview((on) => !on)}
            className="px-2 aria-pressed:bg-surface-sunken aria-pressed:text-on-surface"
          >
            <Eye aria-hidden />
            <span className="sr-only sm:not-sr-only">Preview</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={MATERIAL_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => {
              if (event.target.files) void uploads.upload(event.target.files)
              event.target.value = ""
            }}
          />
          <span className="sr-only" aria-live="polite">
            {uploadStatus}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <DialogClose render={<Button variant="ghost" className="max-sm:hidden" />}>
            Cancel
          </DialogClose>
          <Button
            type="submit"
            variant="primary"
            disabled={pending || uploading > 0}
            aria-keyshortcuts={isMac ? "Meta+Enter" : "Control+Enter"}
          >
            {pending ? "Creating" : uploading > 0 ? "Uploading" : "Create task"}
            <kbd
              aria-hidden
              className="-mr-1.5 hidden h-5 items-center rounded-xs bg-on-primary/15 px-1.5 font-sans text-[11px] leading-none text-on-primary/80 sm:inline-flex"
            >
              {isMac ? "⌘" : "Ctrl"} ↵
            </kbd>
          </Button>
        </div>
      </DialogFooter>

      {dragging ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2 flex items-center justify-center rounded-lg border-2 border-dashed border-on-surface bg-surface/90"
        >
          <span className="label-md text-on-surface">Drop to attach</span>
        </div>
      ) : null}
    </form>
  )
}
