import type { Metadata } from "next"
import { Users } from "lucide-react"

import { Avatar, EmptyState, Page, PageHeader } from "@/components/brand/primitives"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableIdentity,
  TableRow,
} from "@/components/brand/table"
import { InviteForm, PendingInvites, type OpenInvite } from "@/components/invites/invite-panel"
import { Card, CardHeader } from "@/components/ui/card"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
import { LOCALE } from "@/lib/assignments/dates"

export const metadata: Metadata = { title: "Students · Maths Tasks" }
export const dynamic = "force-dynamic"

export default async function StudentsPage() {
  const profile = await requireRole("tutor")
  const supabase = await createClient()

  const [{ data: students }, { data: invites }, { data: assignments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .eq("role", "student")
      .order("full_name"),
    supabase
      .from("student_invites")
      .select("id, full_name, created_at, expires_at, pending_assignments(id)")
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("assignments").select("student_id, stage, verdict"),
  ])

  const openInvites: OpenInvite[] = (invites ?? []).map((invite) => ({
    id: invite.id,
    fullName: invite.full_name,
    createdAt: invite.created_at,
    expiresAt: invite.expires_at,
    queued: invite.pending_assignments?.length ?? 0,
  }))

  const tally = new Map<string, { active: number; toReview: number }>()
  for (const a of assignments ?? []) {
    const entry = tally.get(a.student_id) ?? { active: 0, toReview: 0 }
    if (a.verdict !== "approved") entry.active += 1
    if (a.stage === "submitted" && a.verdict === null) entry.toReview += 1
    tally.set(a.student_id, entry)
  }

  const roster = students ?? []
  const joined = (iso: string) =>
    new Date(iso).toLocaleDateString(LOCALE, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: profile.timezone,
    })

  return (
    <Page>
      <PageHeader
        title="Students"
        description={
          roster.length === 0
            ? "Invite your first student to get started."
            : `${roster.length} ${roster.length === 1 ? "student" : "students"} enrolled${
                openInvites.length > 0 ? `, ${openInvites.length} invited` : ""
              }.`
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="Roster" />
            {roster.length === 0 ? (
              <EmptyState
                icon={<Users />}
                title="No students yet"
                description="Students appear here once they accept an invite."
              />
            ) : (
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                    <TableHead className="text-right">To review</TableHead>
                    <TableHead className="hidden text-right md:table-cell">Joined</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {roster.map((student) => {
                    const counts = tally.get(student.id) ?? { active: 0, toReview: 0 }
                    const name = student.full_name || "Unnamed student"
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="w-full max-w-0">
                          <TableIdentity
                            leading={<Avatar name={name} />}
                            primary={name}
                            secondary={student.email ?? "No email"}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="mono-data">{counts.active}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              counts.toReview > 0 ? "mono-data" : "mono-data text-on-surface-muted"
                            }
                          >
                            {counts.toReview}
                          </span>
                        </TableCell>
                        <TableCell className="hidden text-right whitespace-nowrap md:table-cell">
                          <span className="mono-data-sm text-on-surface-muted">
                            {joined(student.created_at)}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </Card>

          <PendingInvites invites={openInvites} timeZone={profile.timezone} />
        </div>

        <InviteForm />
      </div>
    </Page>
  )
}
