import { WorkspaceShell, type NavItem } from "@/components/shell/workspace-nav"

// Temporary fixture for the sidebar redesign; delete after.
const NAV: NavItem[] = [
  { href: "/styleguide/shell", label: "Tasks", icon: "tasks", exact: true },
  { href: "/student/calendar", label: "Calendar", icon: "calendar" },
  { href: "/student/syllabus", label: "Syllabus", icon: "syllabus" },
]

export default function Page() {
  return (
    <WorkspaceShell home="/student" items={NAV}
      person={{ name: "Lucía Fernández", email: "lucia@example.com", role: "Student", timeZone: "Europe/Madrid" }}>
      <div className="flex h-16 items-center border-b border-border bg-background px-6">
        <h1 className="font-heading text-lg font-medium">Tasks</h1>
      </div>
      <div className="p-6 text-muted-foreground">Content</div>
    </WorkspaceShell>
  )
}
