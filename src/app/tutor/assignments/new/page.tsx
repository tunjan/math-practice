import type { Metadata } from "next"
import Link from "next/link"

import { Band, Container, EmptyState, PageHeader } from "@/components/brand/primitives"
import { ButtonLink } from "@/components/ui/button"
import {
  CreateAssignmentForm,
  type Recipient,
  type Topic,
} from "@/components/assignments/create-assignment-form"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "New task · Maths Tasks" }
export const dynamic = "force-dynamic"

export default async function NewAssignmentPage() {
  await requireRole("tutor")
  const supabase = await createClient()

  const [{ data: students }, { data: invites }, { data: categories }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "student")
        .order("full_name"),
      supabase
        .from("student_invites")
        .select("id, full_name")
        .is("accepted_at", null)
        .is("revoked_at", null)
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name, accent_key").order("name"),
    ])

  const recipients: Recipient[] = [
    ...(students ?? []).map((student) => ({
      value: `student:${student.id}`,
      label: student.full_name || student.email || "Unnamed student",
      pending: false,
    })),
    ...(invites ?? []).map((invite) => ({
      value: `invite:${invite.id}`,
      label: invite.full_name || "Invited student",
      pending: true,
    })),
  ]

  const topics: Topic[] = (categories ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    accentKey: category.accent_key,
  }))

  return (
    <Band>
      <Container className="flex flex-col gap-10">
        <PageHeader
          eyebrow="New task"
          title="Set some work"
          description="Attach the sheets, pick a deadline, and it lands in their list."
          action={<ButtonLink href="/tutor/assignments">Cancel</ButtonLink>}
        />

        {recipients.length === 0 ? (
          <EmptyState
            title="Nobody to assign to yet"
            description="Invite a student first — you can set work for them before they even sign up."
            action={
              <ButtonLink variant="primary" href="/tutor/students">
                Invite a student
              </ButtonLink>
            }
          />
        ) : (
          <CreateAssignmentForm recipients={recipients} topics={topics} />
        )}
      </Container>
    </Band>
  )
}
