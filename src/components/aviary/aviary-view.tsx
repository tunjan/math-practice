"use client"

import * as React from "react"
import { Check, Lock, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/dialog"
import { formatShortDate } from "@/lib/assignments/dates"
import { chooseBird, setWorn, unlockItem } from "@/lib/aviary/actions"
import { SLOT_LABEL, SLOTS, type Outfit, type Slot } from "@/lib/aviary/catalog"
import {
  DIFFICULTIES,
  DIFFICULTY_LABEL,
  DIFFICULTY_POINTS,
  formatPoints,
} from "@/lib/aviary/difficulty"
import type { Aviary, AviaryAccessory, AviaryBird } from "@/lib/aviary/load"

import { AccessorySprite, BirdFigure } from "./bird-figure"
import { DifficultyMeter } from "./difficulty-meter"

type OutfitChange = { bird: string; slot: Slot; item: string | null }

/**
 * The student's aviary: the bird on show, dressed, beside their points; then
 * every bird and accessory, each either theirs or priced.
 *
 * The stage shows whichever bird the student picked from the list, which may
 * be one they have not unlocked yet. Hovering an accessory tries it on.
 */
export function AviaryView({ aviary, timeZone }: { aviary: Aviary; timeZone: string }) {
  const [stageId, setStageId] = React.useState(aviary.companion)
  const [preview, setPreview] = React.useState<AviaryAccessory | null>(null)

  const [outfits, changeOutfit] = React.useOptimistic(
    aviary.outfits,
    (current: Record<string, Outfit>, change: OutfitChange) => {
      const next = { ...current[change.bird] }
      if (change.item) next[change.slot] = change.item
      else delete next[change.slot]
      return { ...current, [change.bird]: next }
    }
  )
  const [companion, changeCompanion] = React.useOptimistic(aviary.companion)
  const [, startTransition] = React.useTransition()

  const stage = aviary.birds.find((b) => b.id === stageId) ?? aviary.birds[0]!
  const worn = outfits[stage.id] ?? {}
  const shown: Outfit = stage.owned && preview ? { ...worn, [preview.slot]: preview.id } : worn

  function wear(item: AviaryAccessory, on: boolean) {
    startTransition(async () => {
      changeOutfit({ bird: stage.id, slot: item.slot, item: on ? item.id : null })
      const result = await setWorn(stage.id, item.id, on)
      if (result.error) toast.error(result.error)
    })
  }

  function makeCompanion(bird: AviaryBird) {
    startTransition(async () => {
      changeCompanion(bird.id)
      const result = await chooseBird(bird.id)
      if (result.error) toast.error(result.error)
      else toast.success(`${bird.name} is your companion now.`)
    })
  }

  const ownedBirds = aviary.birds.filter((b) => b.owned).length
  const ownedAccessories = aviary.accessories.filter((a) => a.owned).length

  return (
    <div className="dub flex flex-1 flex-col bg-surface">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-10 pb-20 sm:px-8 sm:pt-14">
        <header className="flex min-w-0 flex-col gap-3">
          <h1 className="animate-slide-up-fade font-display text-3xl leading-[1.2] font-medium text-on-surface sm:text-4xl sm:leading-[1.15]">
            Aviary
          </h1>
          <p
            style={{ animationDelay: "80ms" }}
            className="max-w-lg animate-slide-up-fade text-base text-pretty text-on-surface-muted sm:text-lg sm:leading-7"
          >
            Every task your tutor approves earns points. Spend them on new birds and things for them to wear.
          </p>
        </header>

        <div
          style={{ animationDelay: "140ms" }}
          className="grid animate-slide-up-fade gap-4 lg:grid-cols-[minmax(0,1fr)_300px]"
        >
          <Stage
            bird={stage}
            outfit={shown}
            worn={worn}
            previewing={Boolean(stage.owned && preview && worn[preview.slot] !== preview.id)}
            isCompanion={stage.id === companion}
            balance={aviary.balance}
            accessories={aviary.accessories}
            onTakeOff={(item) => wear(item, false)}
            onMakeCompanion={() => makeCompanion(stage)}
          />
          <PointsCard aviary={aviary} timeZone={timeZone} />
        </div>

        <section aria-labelledby="aviary-birds" className="flex flex-col gap-4">
          <SectionHeading id="aviary-birds" title="Birds" count={`${ownedBirds}/${aviary.birds.length}`} />
          <ul role="list" className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {aviary.birds.map((bird) => (
              <li key={bird.id}>
                <BirdCard
                  bird={bird}
                  outfit={outfits[bird.id]}
                  selected={bird.id === stage.id}
                  isCompanion={bird.id === companion}
                  balance={aviary.balance}
                  onSelect={() => {
                    setStageId(bird.id)
                    setPreview(null)
                  }}
                />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="aviary-accessories" className="flex flex-col gap-4">
          <SectionHeading
            id="aviary-accessories"
            title="Accessories"
            count={`${ownedAccessories}/${aviary.accessories.length}`}
            hint={
              stage.owned ? (
                <>
                  Dressing {stage.name}.<span className="hidden pointer-fine:inline"> Hover to try one on.</span>
                </>
              ) : (
                `Unlock ${stage.name} to dress them.`
              )
            }
          />
          <ul role="list" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {aviary.accessories.map((item) => (
              <li
                key={item.id}
                onPointerEnter={() => setPreview(item)}
                onPointerLeave={() => setPreview((current) => (current?.id === item.id ? null : current))}
                onFocus={() => setPreview(item)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setPreview(null)
                }}
              >
                <AccessoryCard
                  item={item}
                  worn={worn[item.slot] === item.id}
                  canWear={stage.owned}
                  balance={aviary.balance}
                  onWear={(on) => wear(item, on)}
                  onUnlocked={() => {
                    if (stage.owned) wear(item, true)
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function SectionHeading({
  id,
  title,
  count,
  hint,
}: {
  id: string
  title: string
  count: string
  hint?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
      <h2 id={id} className="text-base font-medium text-on-surface">
        {title}{" "}
        <span className="font-mono text-xs font-normal text-on-surface-muted tabular-nums">{count}</span>
      </h2>
      {hint ? <p className="text-sm text-on-surface-muted">{hint}</p> : null}
    </div>
  )
}

/* ── Stage ────────────────────────────────────────────────────────────────── */

function Stage({
  bird,
  outfit,
  worn,
  previewing,
  isCompanion,
  balance,
  accessories,
  onTakeOff,
  onMakeCompanion,
}: {
  bird: AviaryBird
  outfit: Outfit
  worn: Outfit
  previewing: boolean
  isCompanion: boolean
  balance: number
  accessories: AviaryAccessory[]
  onTakeOff: (item: AviaryAccessory) => void
  onMakeCompanion: () => void
}) {
  const wearing = SLOTS.flatMap((slot) => {
    const item = accessories.find((a) => a.id === worn[slot])
    return item ? [item] : []
  }).reverse()

  return (
    <section
      aria-label={`${bird.name} the ${bird.species.toLowerCase()}`}
      className="flex flex-col overflow-hidden rounded-xl border border-outline"
    >
      <div className="flex items-start justify-between gap-4 px-4 pt-4">
        <div className="flex min-w-0 flex-col">
          <span className="text-base font-medium text-on-surface">{bird.name}</span>
          <span className="text-sm text-on-surface-muted">
            {bird.species} · {bird.blurb}
          </span>
        </div>
        {bird.owned ? (
          isCompanion ? (
            <Pill tone="selected">Your companion</Pill>
          ) : (
            <Button size="sm" onClick={onMakeCompanion}>
              Make companion
            </Button>
          )
        ) : (
          <Pill>
            <Lock aria-hidden className="size-3" />
            {formatPoints(bird.cost)}
          </Pill>
        )}
      </div>

      <div
        className={cn(
          "relative flex h-[340px] items-end justify-center",
          "bg-[radial-gradient(var(--outline)_1px,transparent_1px)] bg-size-[16px_16px] bg-center"
        )}
      >
        {/* A soft floor so the bird stands on something. */}
        <span aria-hidden className="absolute bottom-7 h-4 w-40 rounded-[50%] bg-on-surface/6" />
        <BirdFigure
          key={bird.id}
          bird={bird}
          outfit={outfit}
          className={cn("relative mb-8 w-[240px] animate-in duration-300 fade-in zoom-in-95", !bird.owned && "opacity-90")}
        />
        {previewing ? (
          <span className="absolute top-3 left-1/2 -translate-x-1/2">
            <Pill>Trying on</Pill>
          </span>
        ) : null}
      </div>

      <div className="flex min-h-14 flex-wrap items-center gap-2 border-t border-outline bg-surface-muted px-4 py-3">
        {!bird.owned ? (
          <>
            <p className="flex-1 text-sm text-on-surface-muted">
              {balance >= bird.cost
                ? `You have enough points to unlock ${bird.name}.`
                : `${formatPoints(bird.cost - balance)} to go.`}
            </p>
            <UnlockButton item={bird} balance={balance} variant="primary" />
          </>
        ) : wearing.length > 0 ? (
          wearing.map((item) => (
            <span
              key={item.id}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-outline bg-surface pr-0.5 pl-1.5 text-sm text-on-surface"
            >
              <AccessorySprite id={item.id} scale={0.4} />
              {item.name}
              <button
                type="button"
                aria-label={`Take off ${item.name}`}
                onClick={() => onTakeOff(item)}
                className="flex size-7 items-center justify-center rounded-md text-on-surface-muted hover:bg-surface-hover hover:text-on-surface"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </span>
          ))
        ) : (
          <p className="text-sm text-on-surface-muted">Nothing on yet. Pick something from Accessories below.</p>
        )}
      </div>
    </section>
  )
}

/* ── Points ───────────────────────────────────────────────────────────────── */

function PointsCard({ aviary, timeZone }: { aviary: Aviary; timeZone: string }) {
  const recent = aviary.awards.slice(0, 4)

  return (
    <section aria-label="Points" className="flex flex-col rounded-xl border border-outline">
      <div className="flex flex-col gap-1 p-4">
        <span className="text-sm text-on-surface-muted">Points to spend</span>
        <span className="font-display text-5xl leading-none font-medium text-on-surface tabular-nums">
          {aviary.balance.toLocaleString("en-GB")}
        </span>
        <span className="text-xs text-on-surface-muted">
          {aviary.earned.toLocaleString("en-GB")} earned in total
        </span>
      </div>

      <div className="flex flex-col gap-2 border-t border-outline p-4">
        <h3 className="text-sm font-medium text-on-surface">Per approved task</h3>
        <ul role="list" className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {DIFFICULTIES.map((difficulty) => (
            <li key={difficulty} className="flex items-center gap-2 text-sm text-on-surface-secondary">
              <DifficultyMeter difficulty={difficulty} className="text-on-surface-muted" />
              <span className="flex-1">{DIFFICULTY_LABEL[difficulty]}</span>
              <span className="font-mono text-xs text-on-surface-muted tabular-nums">
                +{DIFFICULTY_POINTS[difficulty]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-outline p-4">
        <h3 className="text-sm font-medium text-on-surface">Recently earned</h3>
        {recent.length > 0 ? (
          <ul role="list" className="flex flex-col gap-2">
            {recent.map((award) => (
              <li key={award.id} className="flex items-baseline gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate text-on-surface-secondary">{award.title}</span>
                <span suppressHydrationWarning className="shrink-0 text-xs text-on-surface-muted">
                  {formatShortDate(award.awardedAt, timeZone)}
                </span>
                <span className="w-8 shrink-0 text-right font-mono text-xs text-on-surface tabular-nums">
                  +{award.points}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-on-surface-muted">Points from approved tasks show up here.</p>
        )}
      </div>
    </section>
  )
}

/* ── Cards ────────────────────────────────────────────────────────────────── */

function BirdCard({
  bird,
  outfit,
  selected,
  isCompanion,
  balance,
  onSelect,
}: {
  bird: AviaryBird
  outfit: Outfit | undefined
  selected: boolean
  isCompanion: boolean
  balance: number
  onSelect: () => void
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-xl border transition-[border-color,box-shadow] duration-150",
        selected ? "border-[#3b82f6] ring-4 ring-info-container" : "border-outline hover:border-outline-strong"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={bird.owned ? `Show ${bird.name}` : `Preview ${bird.name}, locked`}
        className="flex flex-1 flex-col items-center gap-3 px-3 pt-3 pb-3 text-left outline-none"
      >
        <span className="flex w-full justify-center rounded-lg bg-surface-sunken pt-2">
          <BirdFigure bird={bird} outfit={outfit} silhouette={!bird.owned} className="w-[160px] max-w-full" />
        </span>
        <span className="flex w-full items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-on-surface">{bird.name}</span>
          <span className="shrink-0 text-xs text-on-surface-muted">{bird.species}</span>
        </span>
      </button>
      <div className="flex h-12 items-center border-t border-outline px-3">
        {bird.owned ? (
          isCompanion ? (
            <span className="text-sm font-medium text-[#2563eb]">Companion</span>
          ) : (
            <span className="text-sm text-on-surface-muted">In your aviary</span>
          )
        ) : (
          <UnlockButton item={bird} balance={balance} className="w-full" />
        )}
      </div>
    </div>
  )
}

function AccessoryCard({
  item,
  worn,
  canWear,
  balance,
  onWear,
  onUnlocked,
}: {
  item: AviaryAccessory
  worn: boolean
  canWear: boolean
  balance: number
  onWear: (on: boolean) => void
  onUnlocked: () => void
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-xl border transition-[border-color,box-shadow] duration-150",
        worn ? "border-[#3b82f6] ring-4 ring-info-container" : "border-outline hover:border-outline-strong"
      )}
    >
      <div className="relative flex flex-col items-center gap-2 p-3 text-center sm:flex-row sm:gap-3 sm:text-left">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-surface-sunken">
          <AccessorySprite id={item.id} />
        </span>
        <span className="flex min-w-0 flex-col items-center sm:items-start">
          <span className="text-sm font-medium text-balance text-on-surface sm:truncate">{item.name}</span>
          <span className="inline-flex items-center gap-1 text-xs text-on-surface-muted">
            {item.owned ? null : <Lock aria-label="Locked" className="size-3" />}
            {SLOT_LABEL[item.slot]}
          </span>
        </span>
        {worn ? (
          <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-[#3b82f6] text-white">
            <Check aria-hidden className="size-3" strokeWidth={3} />
            <span className="sr-only">Wearing</span>
          </span>
        ) : null}
      </div>
      <div className="mt-auto flex h-12 items-center border-t border-outline px-3">
        {item.owned ? (
          <Button size="sm" className="w-full" disabled={!canWear} onClick={() => onWear(!worn)}>
            {worn ? "Take off" : "Wear"}
          </Button>
        ) : (
          <UnlockButton item={item} balance={balance} className="w-full" onUnlocked={onUnlocked} />
        )}
      </div>
    </div>
  )
}

/* ── Unlocking ────────────────────────────────────────────────────────────── */

function UnlockButton({
  item,
  balance,
  variant = "secondary",
  className,
  onUnlocked,
}: {
  item: AviaryBird | AviaryAccessory
  balance: number
  variant?: "primary" | "secondary"
  className?: string
  onUnlocked?: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const short = item.cost - balance

  if (short > 0) {
    return (
      <Button size="sm" variant={variant} className={className} disabled>
        <Lock aria-hidden />
        {item.cost}
        <span className="sr-only"> points, {short} more needed</span>
      </Button>
    )
  }

  return (
    <ConfirmDialog
      scope="dub"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button size="sm" variant={variant} className={className}>
          Unlock · {item.cost}
        </Button>
      }
      title={`Unlock ${item.name}?`}
      description={`It costs ${formatPoints(item.cost)}. You'll have ${formatPoints(balance - item.cost)} left.`}
      confirm={
        <Button
          variant="primary"
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await unlockItem(item.id, item.name)
              if (result.error) {
                toast.error(result.error)
                return
              }
              setOpen(false)
              toast.success(result.notice)
              onUnlocked?.()
            })
          }
        >
          Unlock
        </Button>
      }
    />
  )
}

function Pill({ tone = "neutral", children }: { tone?: "neutral" | "selected"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-px text-xs leading-5 font-medium",
        tone === "selected"
          ? "border-[#bfdbfe] bg-info-container text-[#2563eb]"
          : "border-outline bg-surface text-on-surface-secondary"
      )}
    >
      {children}
    </span>
  )
}
