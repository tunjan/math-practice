"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  LayoutGrid,
  ListTodo,
  LogOut,
  Search,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"

import { Avatar, Wordmark } from "@/components/brand/primitives"
import { CommandPalette, useIsMac } from "@/components/shell/command-palette"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
  syllabus: BookOpen,
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
  onSearch,
  dub,
  className,
}: {
  home: string
  items: NavItem[]
  person: Person
  signOutId: string
  onSearch: () => void
  dub: boolean
  className?: string
}) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  const isMac = useIsMac()
  const signOut = () => {
    (document.getElementById(signOutId) as HTMLFormElement | null)?.requestSubmit()
  }
  // Collapsed-rail tooltips are portalled, so they need the theme scope too.
  const tip = (label: string) => ({ children: label, className })

  return (
    <Sidebar collapsible="icon" className={cn("border-r border-sidebar-border bg-sidebar", className)}>
      <SidebarHeader
        className={cn(
          "h-14 justify-center px-3 group-data-[collapsible=icon]:px-0",
          dub ? "border-b-0 pl-4 pr-2" : "border-b border-sidebar-border"
        )}
      >
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
              className={cn(
                "hidden md:flex text-on-surface-muted hover:text-on-surface",
                "group-data-[collapsible=icon]:size-9",
                dub && "hover:bg-black/5"
              )}
              aria-label="Toggle sidebar"
            />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent
        className={cn(
          "px-2 py-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2",
          dub && "pt-1"
        )}
      >
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu
              className={cn("group-data-[collapsible=icon]:items-center", dub ? "gap-0.5" : "gap-1")}
            >
              <SidebarMenuItem
                className={cn(
                  "group-data-[collapsible=icon]:mb-1 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center",
                  dub ? "mb-4" : "mb-2"
                )}
              >
                <SidebarMenuButton
                  tooltip={tip("Search")}
                  aria-keyshortcuts="Meta+K Control+K"
                  onClick={() => {
                    if (isMobile) setOpenMobile(false)
                    onSearch()
                  }}
                  className={cn(
                    "border text-on-surface-muted hover:text-on-surface",
                    dub
                      ? "border-outline bg-surface hover:bg-surface-muted! group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:hover:bg-surface-hover!"
                      : "border-outline",
                  )}
                >
                  <Search className="size-5 shrink-0" aria-hidden />
                  <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">Search</span>
                  <Kbd className="h-5 min-w-5 px-1 group-data-[collapsible=icon]:hidden">{isMac ? "⌘K" : "Ctrl K"}</Kbd>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
                      tooltip={tip(item.label)}
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

      <SidebarFooter
        className={cn(
          "gap-1 p-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2",
          !dub && "border-t border-sidebar-border"
        )}
      >
        {/* Expanded: who is signed in, with sign out beside them. */}
        <div className="flex items-center gap-3 rounded-lg py-2 pl-2 pr-1 group-data-[collapsible=icon]:hidden">
          <Avatar name={person.name} className={cn(dub && "bg-surface-sunken")} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate body-md text-on-surface">{person.name}</span>
            <span className="truncate body-sm text-on-surface-muted">
              {person.email ?? person.role}
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Sign out"
                  onClick={signOut}
                  className={cn(
                    "shrink-0 text-on-surface-muted after:absolute after:-inset-1 hover:text-on-surface",
                    dub && "hover:bg-black/5"
                  )}
                />
              }
            >
              <LogOut className="size-4" aria-hidden />
            </TooltipTrigger>
            <TooltipContent side="top" className={className}>
              Sign out
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Collapsed: the avatar, then sign out as a rail item. */}
        <Avatar name={person.name} className={cn("mb-1 hidden group-data-[collapsible=icon]:flex", dub && "bg-surface-sunken")} />
        <SidebarMenu className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem className="flex justify-center">
            <SidebarMenuButton
              tooltip={tip("Sign out")}
              onClick={signOut}
              className={cn("text-on-surface-muted hover:bg-surface-sunken hover:text-on-surface")}
            >
              <LogOut className="size-5 shrink-0" aria-hidden />
              <span className="sr-only">Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

/**
 * The workspace shell, built on shadcn's sidebar with a sheet drawer on mobile:
 * a 260px white sidebar with a hairline edge. Under Quiet Console the active
 * item takes an `outline` fill; under Dub (`className="dub"`) a 5% black fill
 * with ink text, and the header drops its divider.
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
  const [searching, setSearching] = React.useState(false)
  const pages = React.useMemo(
    () => items.map((item) => ({ href: item.href, label: item.label, Icon: ICONS[item.icon] })),
    [items]
  )
  const dub = className?.split(/\s+/).includes("dub") ?? false

  return (
    <SidebarProvider className={className}>
      <form id={signOutId} action={signOut} className="hidden" />

      <AppSidebar
        home={home}
        items={items}
        person={person}
        signOutId={signOutId}
        onSearch={() => setSearching(true)}
        dub={dub}
        className={className}
      />
      <CommandPalette open={searching} onOpenChange={setSearching} pages={pages} scope={className} />

      <SidebarInset
        className={cn(
          "min-h-svh",
          dub ? "bg-surface" : "bg-canvas-neutral"
        )}
      >
        {/* Mobile top bar */}
        <header
          className={cn(
            "sticky top-0 z-30 flex h-14 items-center justify-between border-b border-sidebar-border px-4 md:hidden",
            dub ? "bg-surface" : "bg-sidebar"
          )}
        >
          <Wordmark href={home} />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setSearching(true)}>
              <Search aria-hidden />
            </Button>
            <SidebarTrigger aria-label="Open menu" size="icon" />
          </div>
        </header>

        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
