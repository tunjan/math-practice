"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bird,
  CalendarDays,
  ClipboardList,
  LayoutGrid,
  ListTodo,
  LogOut,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"

import { Avatar, Wordmark } from "@/components/brand/primitives"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { signOut } from "@/lib/auth/actions"
import { cn } from "cn"

const ICONS = {
  overview: LayoutGrid,
  assignments: ClipboardList,
  students: Users,
  tasks: ListTodo,
  calendar: CalendarDays,
  aviary: Bird,
} satisfies Record<string, LucideIcon>

export type NavItem = {
  href: string
  label: string
  icon: keyof typeof ICONS
  /** Active only on an exact match, for a section's root page. */
  exact?: boolean
  /** Other sections that belong to this item, e.g. a list's detail pages. */
  also?: string[]
}

type Person = { name: string; email: string | null; role: string }

function isActive(pathname: string, item: NavItem) {
  const under = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  if (item.also?.some(under)) return true
  if (item.exact) return pathname === item.href
  return under(item.href)
}

function AppSidebar({
  home,
  items,
  person,
  signOutId,
  className,
}: {
  home: string
  items: NavItem[]
  person: Person
  signOutId: string
  className?: string
}) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon" className={cn("border-r border-sidebar-border bg-sidebar", className)}>
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-3 group-data-[collapsible=icon]:px-0">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <Wordmark href={home} className="group-data-[collapsible=icon]:hidden" />
          {isMobile ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpenMobile(false)}
              aria-label="Close menu"
              className="text-on-surface-muted hover:text-on-surface"
            >
              <X className="size-5" />
            </Button>
          ) : (
            <SidebarTrigger
              className="hidden md:flex text-on-surface-muted hover:text-on-surface group-data-[collapsible=icon]:size-9"
              aria-label="Toggle sidebar"
            />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center">
              {items.map((item) => {
                const Icon = ICONS[item.icon]
                const active = isActive(pathname, item)

                return (
                  <SidebarMenuItem
                    key={item.href}
                    className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                  >
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={active}
                      tooltip={item.label}
                      aria-current={active ? "page" : undefined}
                      onClick={() => {
                        if (isMobile) {
                          setOpenMobile(false)
                        }
                      }}
                    >
                      <Icon className="size-5 shrink-0" aria-hidden />
                      <span className="truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 gap-2 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2">
        <div className="flex items-center gap-3 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
          <Avatar name={person.name} />
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate body-md text-on-surface">{person.name}</span>
            <span className="truncate body-sm text-on-surface-muted">
              {person.email ?? person.role}
            </span>
          </div>
        </div>

        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={() => {
                (document.getElementById(signOutId) as HTMLFormElement | null)?.requestSubmit()
              }}
              className="text-on-surface-muted hover:bg-surface-sunken hover:text-on-surface"
            >
              <LogOut className="size-5 shrink-0" aria-hidden />
              <span className="truncate group-data-[collapsible=icon]:hidden">Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

/**
 * DESIGN.md › sidebar
 *
 * A 260px white sidebar with a hairline edge on application shells. Items are
 * 40px, `label-md`, 8px radius; the active item takes an `outline` fill.
 * Built using shadcn sidebar components with responsive sheet drawer on mobile.
 */
export function WorkspaceShell({
  home,
  items,
  person,
  className,
  children,
}: {
  home: string
  items: NavItem[]
  person: Person
  /** A theme scope such as `dub`; the mobile drawer is portalled, so it gets it too. */
  className?: string
  children: React.ReactNode
}) {
  const signOutId = React.useId()

  return (
    <SidebarProvider className={className}>
      <form id={signOutId} action={signOut} className="hidden" />

      <AppSidebar
        home={home}
        items={items}
        person={person}
        signOutId={signOutId}
        className={className}
      />

      <SidebarInset className="min-h-svh bg-canvas-neutral">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 md:hidden">
          <Wordmark href={home} />
          <SidebarTrigger aria-label="Open menu" size="icon" />
        </header>

        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
