import type { Metadata } from "next"
import { AuthCard, AuthLink } from "@/components/auth/auth-card"
import { FormMessage } from "@/components/auth/form-message"
import { RedeemForm } from "@/components/invites/redeem-form"
import { Badge } from "@/components/ui/badge"
import { createAdminClient } from "@/lib/supabase/admin"
import { hashInviteToken, isWellFormedToken } from "@/lib/invites/tokens"

export const metadata: Metadata = { title: "Join · Maths Tasks" }
export const dynamic = "force-dynamic"

type InviteStatus =
  | { kind: "valid"; fullName: string; queued: number }
  | { kind: "invalid"; message: string }

/**
 * Read with the service role: there is no session yet, and student_invites has
 * no policy for anonymous callers by design — a stolen token must not become a
 * way to browse the invite table.
 */
async function loadInvite(token: string): Promise<InviteStatus> {
  if (!isWellFormedToken(token)) {
    return { kind: "invalid", message: "This invite link isn't valid." }
  }

  const admin = createAdminClient()
  const { data: invite } = await admin
    .from("student_invites")
    .select("id, full_name, accepted_at, revoked_at, expires_at")
    .eq("token_hash", hashInviteToken(token))
    .maybeSingle()

  // "Not found" and "withdrawn" deliberately read the same, so guessing at
  // tokens reveals nothing about which ones exist.
  if (!invite || invite.revoked_at) {
    return {
      kind: "invalid",
      message: "This invite link isn't valid. Ask your tutor for a new one.",
    }
  }
  if (invite.accepted_at) {
    return {
      kind: "invalid",
      message: "This invite has already been used. Try signing in instead.",
    }
  }
  if (new Date(invite.expires_at) <= new Date()) {
    return {
      kind: "invalid",
      message: "This invite has expired. Ask your tutor for a new link.",
    }
  }

  const { count } = await admin
    .from("pending_assignments")
    .select("id", { count: "exact", head: true })
    .eq("invite_id", invite.id)

  return {
    kind: "valid",
    fullName: invite.full_name,
    queued: count ?? 0,
  }
}

export default async function InvitePage({
  params,
}: PageProps<"/invite/[token]">) {
  const { token } = await params
  const status = await loadInvite(token)

  if (status.kind === "invalid") {
    return (
      <AuthCard
        title="This link doesn't work"
        footer={<AuthLink href="/login">Go to sign in</AuthLink>}
      >
        <FormMessage error={status.message} />
      </AuthCard>
    )
  }

  const firstName = status.fullName.split(" ")[0]

  return (
    <AuthCard
      title={firstName ? `Welcome, ${firstName}` : "Set up your account"}
      description="Your tutor has invited you to Maths Tasks. Choose an email and password to get started."
      footer={
        status.queued > 0 ? (
          <span className="flex items-center gap-2">
            <Badge variant="violet">
              {status.queued} {status.queued === 1 ? "task" : "tasks"} waiting
            </Badge>
            <span>already set for you</span>
          </span>
        ) : (
          "This link works once, and only for you."
        )
      }
    >
      <RedeemForm token={token} />
    </AuthCard>
  )
}
