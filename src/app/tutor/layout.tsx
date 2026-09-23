import { WorkspaceShell, type NavItem } from "@/components/shell/workspace-nav"
import { Toaster } from "@/components/ui/sonner"
import { requireRole } from "@/lib/auth/session"

const NAV: NavItem[] = [
  { href: "/tutor", label: "Overview", icon: "overview", exact: true },
  { href: "/tutor/assignments", label: "Assignments", icon: "assignments" },
  { href: "/tutor/students", label: "Students", icon: "students" },
  { href: "/tutor/calendar", label: "Calendar", icon: "calendar" },
]

export default async function TutorLayout({ children }: LayoutProps<"/tutor">) {
  const profile = await requireRole("tutor")

  return (
    <WorkspaceShell
      home="/tutor"
      items={NAV}
      person={{
        name: profile.fullName || "Tutor",
        email: profile.email,
        role: "Tutor",
      }}
    >
      {children}
      <Toaster />
    </WorkspaceShell>
  )
}
