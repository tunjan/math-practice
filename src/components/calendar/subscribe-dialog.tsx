"use client"

import * as React from "react"
import { CalendarDays, Check, Copy, ExternalLink, KeyRound, RefreshCw, Rss } from "lucide-react"
import { toast } from "sonner"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/ui/label"
import type { ResetLinkState } from "@/lib/calendar/actions"

export type ResetLinkAction = () => Promise<ResetLinkState>

const APPS = [
  {
    name: "Apple Calendar",
    how: "Opens straight in Calendar on a Mac, iPhone or iPad.",
    link: "webcal",
  },
  {
    name: "Google Calendar",
    how: "Other calendars, then From URL, then paste the link.",
    link: "google",
  },
  {
    name: "Outlook",
    how: "Add calendar, then Subscribe from web, then paste the link.",
    link: null,
  },
] as const

/**
 * The calendar feed, for subscribing from a phone or laptop.
 *
 * The link is the credential, so the dialog says so, and offers a reset that
 * kills the old one. The feed URL lives in state because a reset changes it
 * without the page reloading.
 */
export function SubscribeDialog({
  feedUrl: initialUrl,
  resetAction,
}: {
  feedUrl: string
  resetAction: ResetLinkAction
}) {
  const [feedUrl, setFeedUrl] = React.useState(initialUrl)
  const [copied, setCopied] = React.useState(false)
  const [confirmingReset, setConfirmingReset] = React.useState(false)
  const [resetting, startReset] = React.useTransition()
  const inputId = React.useId()

  const webcalUrl = feedUrl.replace(/^https?:/, "webcal:")

  React.useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(feedUrl)
      setCopied(true)
    } catch {
      // Clipboard access can be refused; select the text so Cmd+C works.
      const input = document.getElementById(inputId) as HTMLInputElement | null
      input?.select()
      toast.error("Couldn't copy automatically", { description: "The link is selected, so copy it by hand." })
    }
  }

  function reset() {
    startReset(async () => {
      const result = await resetAction()
      setConfirmingReset(false)
      if (result.feedUrl) {
        setFeedUrl(result.feedUrl)
        toast.success("Calendar link reset", {
          description: "The old link no longer works. Subscribe again with this one.",
        })
      } else {
        toast.error(result.error ?? "Couldn't reset the link.")
      }
    })
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button className="h-10 shrink-0 rounded-lg border-outline px-3" />}>
        <Rss aria-hidden />
        Subscribe
      </DialogTrigger>

      <DialogContent scope="dub" className="sm:w-[min(560px,calc(100vw-4rem))]">
        <DialogHeader
          title="Subscribe to your calendar"
          description="See your deadlines and events in the calendar app you already use. It stays in sync on its own."
        />

        <DialogBody className="flex flex-col gap-6">
          <Field
            label="Calendar link"
            htmlFor={inputId}
            hint="Calendar apps check for changes every few hours, so new items can take a while to appear."
          >
            <div className="flex gap-2">
              <Input
                id={inputId}
                value={feedUrl}
                readOnly
                mono
                onFocus={(event) => event.currentTarget.select()}
                className="min-w-0 flex-1"
              />
              <Button onClick={copy} className="w-28 shrink-0">
                {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <span className="sr-only" aria-live="polite">
                {copied ? "Link copied" : ""}
              </span>
            </div>
          </Field>

          <ul role="list" className="flex flex-col overflow-hidden rounded-lg border border-outline">
            {APPS.map((app) => (
              <li
                key={app.name}
                className="flex min-h-16 items-center gap-3.5 border-t border-outline px-4 py-3 first:border-t-0"
              >
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-md border border-outline bg-surface-muted text-on-surface-muted"
                >
                  <CalendarDays className="size-4" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-medium text-on-surface">{app.name}</span>
                  <span className="text-sm text-on-surface-muted">{app.how}</span>
                </div>
                {app.link === "webcal" ? (
                  <a href={webcalUrl} className={buttonVariants({ size: "sm" })}>
                    Open
                  </a>
                ) : app.link === "google" ? (
                  <a
                    href="https://calendar.google.com/calendar/u/0/r/settings/addbyurl"
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ size: "sm" })}
                  >
                    Open
                    <ExternalLink aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                ) : null}
              </li>
            ))}
          </ul>

          <p className="flex gap-2.5 rounded-lg border border-warning/20 bg-warning-container px-3.5 py-3 text-sm text-on-warning-container">
            <KeyRound aria-hidden className="mt-0.5 size-4 shrink-0" />
            Anyone with this link can see your calendar, so keep it to yourself. If it gets out,
            reset it and subscribe again.
          </p>
        </DialogBody>

        <DialogFooter>
          <ConfirmDialog
            scope="dub"
            open={confirmingReset}
            onOpenChange={setConfirmingReset}
            trigger={
              <Button variant="destructive" className="-ml-2 px-2 sm:px-3">
                <RefreshCw aria-hidden />
                Reset link
              </Button>
            }
            title="Reset your calendar link?"
            description="The current link stops working straight away. Any calendar app subscribed to it will need the new one."
            confirm={
              <Button variant="destructive" onClick={reset} disabled={resetting}>
                {resetting ? "Resetting" : "Reset link"}
              </Button>
            }
          />
          <DialogClose render={<Button variant="primary" className="ml-auto" />}>Done</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
