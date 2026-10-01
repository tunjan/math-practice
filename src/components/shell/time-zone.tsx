"use client"

import * as React from "react"
import { useActionState } from "react"
import { toast } from "sonner"

import { FormMessage } from "@/components/auth/form-message"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { LOCALE } from "@/lib/assignments/dates"
import { updateTimeZone, type TimeZoneState } from "@/lib/profile/actions"
import {
  allTimeZones,
  deviceTimeZone,
  sameClock,
  zoneCity,
  zoneOffsetLabel,
  zoneOffsetMinutes,
} from "@/lib/timezone"

type Zone = { id: string; city: string; region: string; offset: string; minutes: number }

function describe(id: string, now: Date): Zone {
  const region = id.includes("/") ? id.split("/")[0]!.replace(/_/g, " ") : ""
  return {
    id,
    city: zoneCity(id),
    region,
    offset: zoneOffsetLabel(id, now),
    minutes: zoneOffsetMinutes(id, now),
  }
}

/** West to east, then alphabetically: the order a map reads in. */
function zoneList(now: Date): Zone[] {
  return allTimeZones()
    .map((id) => describe(id, now))
    .sort((a, b) => a.minutes - b.minutes || a.city.localeCompare(b.city))
}

/** "sing", "asia/sing", "gmt+8" and "+8" all find Singapore. */
function matches(zone: Zone, query: string): boolean {
  const q = query.trim().toLowerCase().replace(/_/g, " ")
  if (!q) return true
  return (
    zone.city.toLowerCase().includes(q) ||
    zone.id.toLowerCase().replace(/_/g, " ").includes(q) ||
    zone.offset.toLowerCase().includes(q) ||
    zone.offset.toLowerCase().replace("gmt", "").startsWith(q)
  )
}

function clockIn(timeZone: string, now: Date) {
  return now.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit", timeZone })
}

/**
 * Where the signed-in person is. Every date in the app reads by this zone, and
 * a tutor sets a student's deadlines on it, so it is worth a dialog of its own
 * rather than a buried field.
 */
export function TimeZoneDialog({
  open,
  onOpenChange,
  current,
  role,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  current: string
  role: string
}) {
  const searchId = React.useId()
  const [now, setNow] = React.useState(() => new Date())
  const zones = React.useMemo(() => zoneList(now), [now])
  const [choice, setChoice] = React.useState(current)
  const [device, setDevice] = React.useState<string | null>(null)

  const [state, action, pending] = useActionState<TimeZoneState, FormData>(updateTimeZone, {})
  React.useEffect(() => {
    if (!state.saved) return
    onOpenChange(false)
    toast.success(`Time zone set to ${zoneCity(state.saved)}`, {
      description: "Dates and deadlines now show on that clock.",
    })
  }, [state, onOpenChange])

  const selected = zones.find((zone) => zone.id === choice) ?? describe(choice, now)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setNow(new Date())
          setChoice(current)
          setDevice(deviceTimeZone())
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:w-[min(480px,calc(100vw-4rem))]">
        <DialogHeader
          title="Time zone"
          description={
            role === "Tutor"
              ? "Dates across the app show on this clock."
              : "Dates and deadlines show on this clock, and your tutor sets deadlines by it."
          }
        />
        <form action={action} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="timezone" value={choice} />
          <DialogBody className="flex flex-col gap-4">
            {state.error ? <FormMessage error={state.error} /> : null}

            <div className="flex flex-col gap-2">
              <Label htmlFor={searchId}>Where you are</Label>
              <Combobox
                items={zones}
                value={selected}
                onValueChange={(zone: Zone | null) => zone && setChoice(zone.id)}
                isItemEqualToValue={(a: Zone, b: Zone) => a.id === b.id}
                itemToStringLabel={(zone: Zone) => `${zone.city} (${zone.offset})`}
                filter={matches}
              >
                <ComboboxInput
                  id={searchId}
                  placeholder="Search a city or offset, e.g. Singapore or +8"
                  className="w-full"
                />
                <ComboboxContent>
                  <ComboboxEmpty>No time zone matches.</ComboboxEmpty>
                  <ComboboxList>
                    {(zone: Zone) => (
                      <ComboboxItem key={zone.id} value={zone}>
                        <span className="min-w-0 flex-1 truncate">
                          {zone.city}
                          {zone.region ? (
                            <span className="text-muted-foreground"> · {zone.region}</span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {zone.offset}
                        </span>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              <p className="text-sm text-muted-foreground">
                It&rsquo;s{" "}
                <span className="text-foreground/80 tabular-nums">{clockIn(choice, now)}</span>{" "}
                in {selected.city} ({selected.offset}).
              </p>
            </div>

            {device && device !== choice ? (
              <Button
                type="button"
                variant="link"
                className="self-start"
                onClick={() => setChoice(device)}
              >
                Use this device&rsquo;s time zone ({zoneCity(device)})
              </Button>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <div className="ml-auto flex items-center gap-2">
              <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
              <Button type="submit" variant="primary" loading={pending} disabled={choice === current}>
                {pending ? "Saving" : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Notices when this device's clock disagrees with the account's time zone,
 * say after a move or a holiday, and offers to switch. Asks once per pair of
 * zones on this device, so declining sticks.
 */
export function TimeZoneCheck({ current }: { current: string }) {
  const [, startTransition] = React.useTransition()

  React.useEffect(() => {
    const device = deviceTimeZone()
    if (!device || sameClock(device, current)) return

    const key = `time-zone-declined:${current}:${device}`
    try {
      if (window.localStorage.getItem(key)) return
    } catch {
      // No storage: ask every visit rather than never.
    }
    const remember = () => {
      try {
        window.localStorage.setItem(key, "1")
      } catch {}
    }

    // After the page has settled, so the prompt isn't part of the arrival.
    const timer = window.setTimeout(() => {
      toast(`This device is on ${zoneCity(device)} time`, {
        description: `Dates here show ${zoneCity(current)} time (${zoneOffsetLabel(current)}).`,
        duration: Infinity,
        action: {
          label: `Use ${zoneCity(device)}`,
          onClick: () =>
            startTransition(async () => {
              const data = new FormData()
              data.set("timezone", device)
              const result = await updateTimeZone({}, data)
              if (result.saved) toast.success(`Time zone set to ${zoneCity(device)}`)
              else toast.error(result.error ?? "Couldn't save your time zone.")
            }),
        },
        cancel: { label: "Keep", onClick: remember },
        onDismiss: remember,
      })
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [current])

  return null
}
