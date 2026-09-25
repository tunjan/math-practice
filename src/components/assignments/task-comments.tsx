"use client"

import * as React from "react"
import { ArrowUp, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "cn"
import { MathProse } from "@/components/assignments/math-prose"
import { Button } from "@/components/ui/button"
import { addComment, deleteComment } from "@/lib/assignments/comment-actions"
import { MAX_COMMENT_LENGTH, type TaskComment } from "@/lib/assignments/comment-model"
import { formatMoment, relativeToNow } from "@/lib/assignments/dates"

type Change = { type: "add"; comment: TaskComment } | { type: "remove"; id: string }

/**
 * The conversation on one task, shared by its student and the tutor. Oldest
 * first, with the composer last, so it reads down like any thread. The tutor
 * speaks from a black disc and the student from a grey one, which is all the
 * attribution two people need.
 */
export function TaskComments({
  taskId,
  comments,
  viewer,
  timeZone,
  className,
}: {
  taskId: string
  comments: TaskComment[]
  viewer: { role: TaskComment["author"]; name: string }
  timeZone: string
  className?: string
}) {
  const headingId = React.useId()
  const [shown, change] = React.useOptimistic(comments, (state: TaskComment[], next: Change) =>
    next.type === "add" ? [...state, next.comment] : state.filter((comment) => comment.id !== next.id)
  )

  const post = (body: string) =>
    new Promise<boolean>((resolve) => {
      React.startTransition(async () => {
        change({
          type: "add",
          comment: {
            id: `pending-${Date.now()}`,
            body,
            at: new Date().toISOString(),
            mine: true,
            author: viewer.role,
            name: "You",
            pending: true,
          },
        })
        const result = await addComment(taskId, body)
        if (result.error) toast.error(result.error)
        resolve(!result.error)
      })
    })

  const remove = (id: string) => {
    React.startTransition(async () => {
      change({ type: "remove", id })
      const result = await deleteComment(id, taskId)
      if (result.error) toast.error(result.error)
    })
  }

  return (
    <section aria-labelledby={headingId} className={cn("flex flex-col gap-4", className)}>
      <h3 id={headingId} className="text-sm font-medium text-on-surface">
        Comments
      </h3>
      {shown.length > 0 ? (
        <ol role="list" className="flex flex-col gap-5">
          {shown.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              initial={initialOf(comment.mine ? viewer.name || "You" : comment.name)}
              timeZone={timeZone}
              onDelete={comment.mine && !comment.pending ? () => remove(comment.id) : undefined}
            />
          ))}
        </ol>
      ) : null}
      <Composer onPost={post} />
    </section>
  )
}

function Comment({
  comment,
  initial,
  timeZone,
  onDelete,
}: {
  comment: TaskComment
  initial: string
  timeZone: string
  onDelete?: () => void
}) {
  return (
    <li
      className={cn(
        "group/comment flex gap-3 transition-opacity duration-150",
        comment.pending && "opacity-50"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs leading-none font-medium",
          comment.author === "tutor"
            ? "bg-primary text-on-primary"
            : "bg-surface-sunken text-on-surface-secondary"
        )}
      >
        {initial}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex h-7 items-center gap-2">
          <span className="truncate text-sm font-medium text-on-surface">{comment.name}</span>
          <time
            dateTime={comment.at}
            suppressHydrationWarning
            title={formatMoment(comment.at, timeZone)}
            className="shrink-0 text-xs text-on-surface-muted"
          >
            {when(comment.at, timeZone)}
          </time>
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete comment"
              className={cn(
                "ml-auto flex size-6 shrink-0 items-center justify-center rounded-md text-on-surface-muted",
                "transition-[opacity,background-color,color] duration-150 hover:bg-surface-sunken hover:text-on-surface",
                "opacity-0 group-hover/comment:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
              )}
            >
              <X aria-hidden className="size-3.5" />
            </button>
          ) : null}
        </div>
        <MathProse className="gap-2 text-sm! leading-6! text-on-surface-secondary [overflow-wrap:anywhere]">
          {comment.body}
        </MathProse>
      </div>
    </li>
  )
}

/**
 * One field that grows with what's typed. Enter posts, Shift+Enter breaks the
 * line. The draft comes back if the post fails.
 */
function Composer({ onPost }: { onPost: (body: string) => Promise<boolean> }) {
  const [draft, setDraft] = React.useState("")
  const ready = draft.trim().length > 0

  const submit = async () => {
    const body = draft.trim()
    if (!body) return
    setDraft("")
    const posted = await onPost(body)
    if (!posted) setDraft(body)
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
      className={cn(
        "flex items-end gap-2 rounded-xl border border-outline bg-surface py-1.5 pr-1.5 pl-3",
        "transition-[border-color,box-shadow] duration-150",
        "focus-within:border-outline-strong focus-within:shadow-[0_0_0_4px_var(--surface-sunken)]"
      )}
    >
      <textarea
        data-composer
        rows={1}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault()
            void submit()
          }
        }}
        maxLength={MAX_COMMENT_LENGTH}
        aria-label="Comment"
        placeholder="Add a comment"
        className="field-sizing-content max-h-40 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-sm leading-5 text-on-surface outline-none placeholder:text-on-surface-muted"
      />
      <Button
        type="submit"
        variant="primary"
        size="icon-sm"
        disabled={!ready}
        aria-label="Post comment"
        className="rounded-lg"
      >
        <ArrowUp aria-hidden />
      </Button>
    </form>
  )
}

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?"
}

/** "Just now", "3 hours ago", then the date once it's more than a day old. */
function when(iso: string, timeZone: string): string {
  const age = Date.now() - new Date(iso).getTime()
  if (age < 60_000) return "Just now"
  if (age < 24 * 60 * 60_000) return relativeToNow(iso)
  return formatMoment(iso, timeZone)
}
