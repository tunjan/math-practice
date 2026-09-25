import { WorkspaceShell, type NavItem } from "@/components/shell/workspace-nav"
import { Toaster } from "@/components/ui/sonner"
import { requireRole } from "@/lib/auth/session"

const TASKS: NavItem = { href: "/student", label: "Tasks", icon: "tasks", exact: true, also: ["/student/tasks"] }
const CALENDAR: NavItem = { href: "/student/calendar", label: "Calendar", icon: "calendar" }
const SYLLABUS: NavItem = { href: "/student/syllabus", label: "Syllabus", icon: "syllabus" }
const AVIARY: NavItem = { href: "/student/aviary", label: "Aviary", icon: "aviary" }

export default async function StudentLayout({ children, task }: LayoutProps<"/student">) {
  const profile = await requireRole("student")
  // No course means no tracker, so no link to one.
  const nav = profile.course ? [TASKS, CALENDAR, SYLLABUS, AVIARY] : [TASKS, CALENDAR, AVIARY]

  return (
    <WorkspaceShell
      className="dub"
      home="/student"
      items={nav}
      person={{
        name: profile.fullName || "Student",
        email: profile.email,
        role: "Student",
      }}
    >
      {children}
      {task}
      <Toaster />
    </WorkspaceShell>
  )
}
