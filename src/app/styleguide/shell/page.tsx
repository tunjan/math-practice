import { WorkspaceShell, type NavItem } from "@/components/shell/workspace-nav"

// Temporary fixture for the sidebar redesign; delete after.
const NAV: NavItem[] = [
  { href: "/styleguide/shell", label: "Tasks", icon: "tasks", exact: true },
  { href: "/student/calendar", label: "Calendar", icon: "calendar" },
  { href: "/student/syllabus", label: "Syllabus", icon: "syllabus" },
]

export default function Page() {
  return (
    <WorkspaceShell className="dub" home="/student" items={NAV}
      person={{ name: "Lucía Fernández", email: "lucia@example.com", role: "Student" }}>
      <div className="flex h-16 items-center border-b border-outline bg-surface px-6">
        <h1 className="headline-md">Tasks</h1>
      </div>
      <div className="p-6 text-on-surface-muted">Content</div>
    </WorkspaceShell>
  )
}
