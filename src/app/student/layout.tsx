import { SignOutButton } from "@/components/auth/sign-out-button"
import { WorkspaceNav } from "@/components/shell/workspace-nav"

const NAV = [
  { href: "/student", label: "Practice" },
  { href: "/student/calendar", label: "Calendar" },
  { href: "/student/library", label: "Library" },
  { href: "/student/nest", label: "Nest" },
]

export default function StudentLayout({ children }: LayoutProps<"/student">) {
  return (
    <div className="flex min-h-svh flex-col">
      <WorkspaceNav items={NAV} action={<SignOutButton />} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
