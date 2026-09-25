"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ClipboardList, CornerDownLeft, User, type LucideIcon } from "lucide-react"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandShortcut,
} from "@/components/ui/command"
import { loadCommandIndex, type CommandEntry } from "@/lib/search/actions"

export type CommandPage = { href: string; label: string; Icon: LucideIcon }

const GROUP_ICON: Record<CommandEntry["group"], LucideIcon> = {
  Students: User,
  Tasks: ClipboardList,
}

/** True on Apple platforms, where the shortcut reads ⌘K rather than Ctrl K. */
export function useIsMac() {
  return React.useSyncExternalStore(
    () => () => {},
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => true
  )
}

/**
 * ⌘K / Ctrl+K: jump to any page, student or task. The index is fetched when
 * the palette opens (RLS decides what it holds) and refreshed on every open,
 * showing the last copy while the new one loads.
 */
export function CommandPalette({
  open,
  onOpenChange,
  pages,
  scope,
  load = loadCommandIndex,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pages: CommandPage[]
  scope?: string
  /** Where the index comes from; the styleguide passes sample data. */
  load?: () => Promise<CommandEntry[]>
}) {
  const router = useRouter()
  const [entries, setEntries] = React.useState<CommandEntry[] | null>(null)
  const [loading, startLoading] = React.useTransition()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  React.useEffect(() => {
    if (!open) return
    startLoading(async () => {
      try {
        setEntries(await load())
      } catch {
        // Keep whatever we had; pages still work without the index.
      }
    })
  }, [open, load])

  function go(href: string) {
    onOpenChange(false)
    router.push(href)
  }

  const groups = (["Students", "Tasks"] as const)
    .map((group) => ({ group, items: (entries ?? []).filter((entry) => entry.group === group) }))
    .filter(({ items }) => items.length > 0)

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} scope={scope}>
      <Command loop>
        <CommandInput placeholder="Search pages, students and tasks" />
        <CommandList>
          <CommandEmpty>Nothing matches.</CommandEmpty>
          <CommandGroup heading="Pages">
            {pages.map(({ href, label, Icon }) => (
              <CommandItem key={href} value={`page ${label}`} onSelect={() => go(href)}>
                <Icon aria-hidden />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
          {entries === null && loading ? <CommandLoading>Loading…</CommandLoading> : null}
          {groups.map(({ group, items }) => {
            const Icon = GROUP_ICON[group]
            return (
              <CommandGroup key={group} heading={group}>
                {items.map((entry) => (
                  <CommandItem
                    key={entry.id}
                    value={`${entry.id} ${entry.label} ${entry.hint ?? ""}`}
                    onSelect={() => go(entry.href)}
                  >
                    <Icon aria-hidden />
                    <span className="min-w-0 truncate">{entry.label}</span>
                    {entry.hint ? <CommandShortcut className="max-w-[45%] truncate">{entry.hint}</CommandShortcut> : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
        </CommandList>
        <div className="flex h-9 items-center gap-1.5 border-t border-outline px-4 body-sm text-on-surface-muted">
          <CornerDownLeft aria-hidden className="size-3.5" /> to open · Esc to close
        </div>
      </Command>
    </CommandDialog>
  )
}
