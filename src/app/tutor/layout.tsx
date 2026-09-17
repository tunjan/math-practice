import { SignOutButton } from "@/components/auth/sign-out-button"
import { WorkspaceNav } from "@/components/shell/workspace-nav"

const NAV = [
  { href: "/tutor", label: "Overview" },
  { href: "/tutor/assignments", label: "Assignments" },
  { href: "/tutor/students", label: "Students" },
  { href: "/tutor/library", label: "Library" },
  { href: "/tutor/settings", label: "Settings" },
]

export default function TutorLayout({ children }: LayoutProps<"/tutor">) {
  return (
    <div className="flex min-h-svh flex-col">
      <WorkspaceNav items={NAV} action={<SignOutButton />} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
