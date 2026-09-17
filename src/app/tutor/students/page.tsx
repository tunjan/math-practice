import type { Metadata } from "next"

import { Band, Container, EmptyState, Eyebrow, PageHeader } from "@/components/brand/primitives"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/brand/table"
import { InvitePanel, type OpenInvite } from "@/components/invites/invite-panel"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Students · Maths Tasks" }
export const dynamic = "force-dynamic"

export default async function StudentsPage() {
  await requireRole("tutor")
  const supabase = await createClient()

  const [{ data: students }, { data: invites }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .eq("role", "student")
      .order("created_at", { ascending: false }),
    supabase
      .from("student_invites")
      .select("id, full_name, created_at, expires_at, pending_assignments(id)")
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
  ])

  const openInvites: OpenInvite[] = (invites ?? []).map((invite) => ({
    id: invite.id,
    fullName: invite.full_name,
    createdAt: invite.created_at,
    expiresAt: invite.expires_at,
    queued: invite.pending_assignments?.length ?? 0,
  }))

  return (
    <Band>
      <Container width="wide" className="flex flex-col gap-10">
        <PageHeader
          eyebrow="Students"
          title="Your roster"
          description="Everyone you teach, and the invites still waiting to be claimed."
        />

        <div className="flex flex-col gap-4">
          <Eyebrow size="sm">Enrolled</Eyebrow>

          {students && students.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="text-ink">
                      {student.full_name || "—"}
                    </TableCell>
                    <TableCell>{student.email ?? "—"}</TableCell>
                    <TableCell className="numeric text-body-mid">
                      {new Date(student.created_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No students yet"
              description="Create an invite below and send the link to your first student."
            />
          )}
        </div>

        <InvitePanel invites={openInvites} />
      </Container>
    </Band>
  )
}
