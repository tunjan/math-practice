import "server-only"

import type { createClient } from "@/lib/supabase/server"

/** Someone a task can be set for. */
export type Recipient = {
  /** `student:<id>` or `invite:<id>`. */
  value: string
  label: string
  /** Invited but not signed up yet: the task waits for them. */
  pending: boolean
}

export type Topic = { id: string; name: string }

export type TaskOptions = { recipients: Recipient[]; topics: Topic[] }

/**
 * Everything the New task dialog offers to choose from. Loaded by each page
 * that can open the dialog, alongside that page's own queries.
 */
export async function loadTaskOptions(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<TaskOptions> {
  const [{ data: students }, { data: invites }, { data: categories }] = await Promise.all([
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
    supabase.from("categories").select("id, name").order("name"),
  ])

  return {
    recipients: [
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
    ],
    topics: (categories ?? []).map((c) => ({ id: c.id, name: c.name })),
  }
}
