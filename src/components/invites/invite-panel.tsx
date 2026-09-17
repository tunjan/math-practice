"use client"

import { useActionState, useEffect, useId, useState } from "react"
import { Check, Copy, Link2, UserPlus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FormMessage } from "@/components/auth/form-message"
import { EmptyState, Eyebrow } from "@/components/brand/primitives"
import {
  createInvite,
  revokeInvite,
  type InviteActionState,
} from "@/lib/invites/actions"

export type OpenInvite = {
  id: string
  fullName: string
  createdAt: string
  expiresAt: string
  queued: number
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <Button
      type="button"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
        } catch {
          // Clipboard access can be refused; the link is visible and
          // selectable either way, so there is nothing to recover from.
        }
      }}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? "Copied" : "Copy link"}
    </Button>
  )
}

/**
 * The invite link is shown exactly once, at creation. Only its hash is stored,
 * so there is nothing to re-display later — losing it means revoking and
 * inviting again. The UI has to say so plainly rather than implying the link
 * can be found again.
 */
function NewInviteLink({ link }: { link: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-white/25 bg-canvas p-4">
      <div className="flex items-center gap-2">
        <Link2 className="size-4 text-ink" />
        <Eyebrow size="sm" className="text-ink">
          Invite link — copy it now
        </Eyebrow>
      </div>
      <code className="block overflow-x-auto rounded-lg border border-hairline bg-canvas-soft px-3 py-2 font-mono text-xs text-body">
        {link}
      </code>
      <div className="flex flex-wrap items-center gap-3">
        <CopyButton value={link} />
        <p className="body-sm text-body-mid">
          Shown once. We store only a hash, so it can&apos;t be shown again.
        </p>
      </div>
    </div>
  )
}

function RevokeButton({ inviteId }: { inviteId: string }) {
  const [state, action, pending] = useActionState<InviteActionState, FormData>(
    revokeInvite,
    {}
  )

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="invite_id" value={inviteId} />
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        <X />
        {pending ? "Revoking…" : "Revoke"}
      </Button>
      {state.error ? (
        <span className="body-sm text-destructive">{state.error}</span>
      ) : null}
    </form>
  )
}

export function InvitePanel({ invites }: { invites: OpenInvite[] }) {
  const [state, action, pending] = useActionState<InviteActionState, FormData>(
    createInvite,
    {}
  )
  const nameId = useId()

  return (
    <div className="flex flex-col gap-6">
      <form
        action={action}
        className="flex flex-col gap-4 rounded-lg border border-hairline bg-canvas-card p-6"
      >
        <div className="flex flex-col gap-2">
          <Eyebrow size="sm">Invite a student</Eyebrow>
          <p className="body-sm text-body-mid">
            You name them; they choose their own email and password.
          </p>
        </div>

        <FormMessage error={state.error} notice={state.notice} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor={nameId} className="eyebrow-sm text-body-mid">
              Student name
            </Label>
            <Input
              id={nameId}
              name="full_name"
              required
              maxLength={120}
              placeholder="Amara Osei"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={pending}
            className="sm:w-auto"
          >
            <UserPlus />
            {pending ? "Creating…" : "Create invite"}
          </Button>
        </div>

        {state.link ? <NewInviteLink link={state.link} /> : null}
      </form>

      <div className="flex flex-col gap-3">
        <Eyebrow size="sm">Outstanding invites</Eyebrow>

        {invites.length === 0 ? (
          <EmptyState
            title="No invites waiting"
            description="Invites you create appear here until they're redeemed or revoked."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-canvas-card px-4 py-3"
              >
                <div className="flex flex-col gap-1">
                  <span className="body-md text-ink">
                    {invite.fullName || "Unnamed student"}
                  </span>
                  <span className="eyebrow-sm text-body-mid">
                    Expires{" "}
                    {new Date(invite.expiresAt).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {invite.queued > 0 ? (
                    <Badge>
                      {invite.queued} task{invite.queued === 1 ? "" : "s"} queued
                    </Badge>
                  ) : null}
                  <RevokeButton inviteId={invite.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
