"use client"

import { useActionState, useEffect, useId, useState } from "react"
import { Check, Copy, MailPlus } from "lucide-react"

import { EmptyState } from "@/components/brand/primitives"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/brand/table"
import { FormMessage } from "@/components/auth/form-message"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardSection } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/ui/label"
import { createInvite, revokeInvite, type InviteActionState } from "@/lib/invites/actions"
import { LOCALE } from "@/lib/assignments/dates"

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
      className="shrink-0"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
        } catch {
          // Clipboard access can be refused; the link is visible and selectable.
        }
      }}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {copied ? "Copied" : "Copy"}
    </Button>
  )
}

/** Create an invite. The link is shown once: only its hash is stored. */
export function InviteForm() {
  const [state, action, pending] = useActionState<InviteActionState, FormData>(createInvite, {})
  const nameId = useId()
  const linkId = useId()

  return (
    <Card>
      <CardHeader
        title="Invite a student"
        description="They choose their own email and password when they accept."
      />
      <CardSection className="flex flex-col gap-4">
        <form action={action} className="flex flex-col gap-4">
          <FormMessage error={state.error} />
          <Field label="Student's name" htmlFor={nameId}>
            <Input id={nameId} name="full_name" required maxLength={120} autoComplete="off" />
          </Field>
          <Button type="submit" variant="primary" disabled={pending} className="w-full">
            <MailPlus aria-hidden />
            {pending ? "Creating link" : "Create invite link"}
          </Button>
        </form>

        {state.link ? (
          <div className="flex flex-col gap-2 border-t border-outline pt-4">
            <label htmlFor={linkId} className="label-md text-on-surface-secondary">
              Invite link
            </label>
            <div className="flex gap-2">
              <Input
                id={linkId}
                readOnly
                value={state.link}
                variant="filled"
                mono
                onFocus={(event) => event.currentTarget.select()}
              />
              <CopyButton value={state.link} />
            </div>
            <p className="body-sm text-on-surface-muted">
              Send it to the student now. It won&apos;t be shown again after you leave this page.
            </p>
          </div>
        ) : null}
      </CardSection>
    </Card>
  )
}

function RevokeInvite({ invite }: { invite: OpenInvite }) {
  const [state, action, pending] = useActionState<InviteActionState, FormData>(revokeInvite, {})
  const [open, setOpen] = useState(false)

  const [seen, setSeen] = useState(state)
  if (state !== seen) {
    setSeen(state)
    if (!state.error) setOpen(false)
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="destructive" size="sm">
          Revoke
        </Button>
      }
      title="Revoke this invite?"
      description={
        <>
          The link for {invite.fullName || "this student"} stops working.
          {invite.queued > 0
            ? ` The ${invite.queued === 1 ? "task" : `${invite.queued} tasks`} queued for them will be discarded.`
            : ""}
          {state.error ? <span className="mt-2 block text-error">{state.error}</span> : null}
        </>
      }
      confirm={
        <form action={action}>
          <input type="hidden" name="invite_id" value={invite.id} />
          <Button type="submit" variant="primary" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Revoking" : "Revoke invite"}
          </Button>
        </form>
      }
    />
  )
}

export function PendingInvites({
  invites,
  timeZone,
}: {
  invites: OpenInvite[]
  timeZone: string
}) {
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(LOCALE, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone,
    })

  return (
    <Card>
      <CardHeader
        title="Pending invites"
        description="Invites wait here until they're accepted or revoked."
      />
      {invites.length === 0 ? (
        <EmptyState
          icon={<MailPlus />}
          title="No pending invites"
          description="Invites you create appear here until the student accepts."
          className="py-10"
        />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Expires</TableHead>
              <TableHead className="hidden sm:table-cell">Queued</TableHead>
              <TableHead className="w-px">
                <span className="sr-only">Actions</span>
              </TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {invites.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell className="w-full max-w-0">
                  <span className="block truncate">{invite.fullName || "Unnamed student"}</span>
                </TableCell>
                <TableCell className="hidden whitespace-nowrap sm:table-cell">
                  <span className="mono-data-sm text-on-surface-secondary">
                    {date(invite.expiresAt)}
                  </span>
                </TableCell>
                <TableCell className="hidden whitespace-nowrap sm:table-cell">
                  {invite.queued > 0 ? (
                    <Badge variant="violet">
                      {invite.queued} {invite.queued === 1 ? "task" : "tasks"}
                    </Badge>
                  ) : (
                    <span className="mono-data-sm text-on-surface-muted">0</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <RevokeInvite invite={invite} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  )
}
