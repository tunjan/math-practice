"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Globe,
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
import { TimeZoneCheck, TimeZoneDialog } from "@/components/shell/time-zone"
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
import { zoneCity } from "@/lib/timezone"
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

type Person = { name: string; email: string | null; role: string; timeZone: string }

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
  onTimeZone,
  className,
}: {
  home: string
  items: NavItem[]
  person: Person
  signOutId: string
  onSearch: () => void
  onTimeZone: () => void
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
    <Sidebar collapsible="icon" variant="inset" className={className}>
      <SidebarHeader
        className={cn(
          "h-14 justify-center px-3 group-data-[collapsible=icon]:px-0",
          "border-b-0 pl-4 pr-2"
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
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </Button>
          ) : (
            <SidebarTrigger
              className={cn(
                "hidden md:flex text-muted-foreground hover:text-foreground",
                "group-data-[collapsible=icon]:size-8 hover:bg-sidebar-accent"
              )}
              aria-label="Toggle sidebar"
            />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent
        className={cn(
          "px-2 py-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2",
          "pt-1"
        )}
      >
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu
              className={"group-data-[collapsible=icon]:items-center gap-0.5"}
            >
              <SidebarMenuItem
                className={cn(
                  "group-data-[collapsible=icon]:mb-1 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center",
          "mb-4"
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
                    "border text-muted-foreground hover:text-foreground",
                    "border-border bg-background hover:bg-muted/50! group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:hover:bg-sidebar-accent!",
                  )}
                >
                  <Search className="size-4 shrink-0" aria-hidden />
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
                      <Icon className="size-4 shrink-0" aria-hidden />
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
          "gap-1 p-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2"
        )}
      >
        {/* Expanded: who is signed in, with sign out beside them. */}
        <div className="flex items-center gap-3 rounded-xl py-2 pl-2 pr-1 group-data-[collapsible=icon]:hidden">
          <Avatar name={person.name} className="bg-background" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate body-md text-foreground">{person.name}</span>
            <span className="truncate body-md text-muted-foreground">
              {person.email ?? person.role}
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Time zone: ${zoneCity(person.timeZone)}`}
                  onClick={() => {
                    if (isMobile) setOpenMobile(false)
                    onTimeZone()
                  }}
                  className={cn(
                    "shrink-0 text-muted-foreground hover:text-foreground",
          "hover:bg-sidebar-accent"
                  )}
                />
              }
            >
              <Globe className="size-4" aria-hidden />
            </TooltipTrigger>
            <TooltipContent side="top" className={className}>
              {zoneCity(person.timeZone)} time
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Sign out"
                  onClick={signOut}
                  className={cn(
                    "relative shrink-0 text-muted-foreground after:absolute after:-inset-1 hover:text-foreground",
          "hover:bg-sidebar-accent"
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
        <Avatar name={person.name} className={"mb-1 hidden group-data-[collapsible=icon]:flex bg-background"} />
        <SidebarMenu className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem className="flex justify-center">
            <SidebarMenuButton
              tooltip={tip(`${zoneCity(person.timeZone)} time`)}
              onClick={onTimeZone}
              className="text-muted-foreground"
            >
              <Globe className="size-4 shrink-0" aria-hidden />
              <span className="sr-only">Time zone: {zoneCity(person.timeZone)}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="flex justify-center">
            <SidebarMenuButton
              tooltip={tip("Sign out")}
              onClick={signOut}
              className="text-muted-foreground"
            >
              <LogOut className="size-4 shrink-0" aria-hidden />
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
 * item takes an `outline` fill; under Dub (`className=""`) a 5% black fill
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
  className?: string
  children: React.ReactNode
}) {
  const signOutId = React.useId()
  const [searching, setSearching] = React.useState(false)
  const [settingZone, setSettingZone] = React.useState(false)
  const pages = React.useMemo(
    () => items.map((item) => ({ href: item.href, label: item.label, Icon: ICONS[item.icon] })),
    [items]
  )

  return (
    <SidebarProvider className={className}>
      <form id={signOutId} action={signOut} className="hidden" />

      <AppSidebar
        home={home}
        items={items}
        person={person}
        signOutId={signOutId}
        onSearch={() => setSearching(true)}
        onTimeZone={() => setSettingZone(true)}
        className={className}
      />
      <CommandPalette open={searching} onOpenChange={setSearching} pages={pages} />
      <TimeZoneDialog
        open={settingZone}
        onOpenChange={setSettingZone}
        current={person.timeZone}
        role={person.role}
      />
      <TimeZoneCheck current={person.timeZone} />

      <SidebarInset
        className={cn(
          "min-h-svh bg-background md:min-h-[calc(100svh-1rem)]"
        )}
      >
        {/* Mobile top bar */}
        <header
          className={cn(
            "sticky top-0 z-30 flex h-14 items-center justify-between border-b border-sidebar-border px-4 md:hidden",
          "bg-background"
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
