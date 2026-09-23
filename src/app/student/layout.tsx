import { WorkspaceShell, type NavItem } from "@/components/shell/workspace-nav"
import { Toaster } from "@/components/ui/sonner"
import { requireRole } from "@/lib/auth/session"

const NAV: NavItem[] = [
  { href: "/student", label: "Tasks", icon: "tasks", exact: true, also: ["/student/tasks"] },
  { href: "/student/calendar", label: "Calendar", icon: "calendar" },
]

export default async function StudentLayout({ children, task }: LayoutProps<"/student">) {
  const profile = await requireRole("student")

  return (
    <WorkspaceShell
      className="dub"
      home="/student"
      items={NAV}
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
