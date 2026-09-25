"use server"

import { requireProfile } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
import { STAGE_LABEL, asStage } from "@/lib/assignments/model"

export type CommandEntry = {
  id: string
  group: "Students" | "Tasks"
  label: string
  /** Muted text after the label: a student's name, a task's stage. */
  hint: string | null
  href: string
}

const LIMIT = 500

/**
 * What the ⌘K palette can jump to, fetched once when it first opens. RLS
 * already scopes the rows; the filters here keep each role to its own pages.
 */
export async function loadCommandIndex(): Promise<CommandEntry[]> {
  const profile = await requireProfile()
  const supabase = await createClient()

  if (profile.role === "tutor") {
    const [{ data: students }, { data: tasks }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email").eq("role", "student").order("full_name"),
      supabase
        .from("assignments")
        .select("id, title, stage, profiles!assignments_student_id_fkey(full_name, email)")
        .order("due_at", { ascending: false })
        .limit(LIMIT),
    ])
    return [
      ...(students ?? []).map((s) => ({
        id: s.id,
        group: "Students" as const,
        label: s.full_name || s.email || "Unnamed student",
        hint: s.full_name ? s.email : null,
        href: `/tutor/students/${s.id}`,
      })),
      ...(tasks ?? []).map((t) => ({
        id: t.id,
        group: "Tasks" as const,
        label: t.title,
        hint: t.profiles?.full_name || t.profiles?.email || null,
        href: `/tutor/assignments/${t.id}`,
      })),
    ]
  }

  const { data: tasks } = await supabase
    .from("assignments")
    .select("id, title, stage")
    .eq("student_id", profile.id)
    .order("due_at", { ascending: false })
    .limit(LIMIT)
  return (tasks ?? []).map((t) => ({
    id: t.id,
    group: "Tasks" as const,
    label: t.title,
    hint: STAGE_LABEL[asStage(t.stage)],
    href: `/student/tasks/${t.id}`,
  }))
}
