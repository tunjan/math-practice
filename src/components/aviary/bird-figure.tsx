/* eslint-disable @next/next/no-img-element -- pixel sprites: next/image would resample them */
import { cn } from "cn"

import {
  ACCESSORY_SCALE,
  accessoryArt,
  SLOTS,
  STAGE,
  type BirdArt,
  type Outfit,
} from "@/lib/aviary/catalog"

const pct = (value: number, of: number) => `${(value / of) * 100}%`

/**
 * A bird on its stage, dressed in its outfit. Everything is placed in stage
 * percentages, so the figure scales with its box; give it a width that is a
 * multiple of the stage (80, 160, 240, 320px) and the pixels stay square.
 *
 * The feather goes behind the bird, so it peeks out from the back of the head;
 * everything else is drawn on top, feet first and hat last.
 */
export function BirdFigure({
  bird,
  outfit = {},
  silhouette = false,
  className,
}: {
  bird: BirdArt
  outfit?: Outfit
  /** Not yet unlocked: a flat shape, no accessories. */
  silhouette?: boolean
  className?: string
}) {
  const left = (STAGE.w - bird.w) / 2
  const top = STAGE.h - bird.h

  const layers = silhouette
    ? []
    : SLOTS.flatMap((slot) => {
        const id = outfit[slot]
        const art = id ? accessoryArt(id) : undefined
        if (!art || art.slot !== slot) return []
        const w = art.w * ACCESSORY_SCALE
        const h = art.h * ACCESSORY_SCALE
        const anchor = bird.anchors[slot]
        return [
          {
            art,
            behind: slot === "crest",
            style: {
              left: pct(left + anchor.x - art.pin.x * w, STAGE.w),
              top: pct(top + anchor.y - art.pin.y * h, STAGE.h),
              width: pct(w, STAGE.w),
            },
          },
        ]
      })

  return (
    <div
      className={cn("relative select-none [image-rendering:pixelated]", className)}
      style={{ aspectRatio: `${STAGE.w} / ${STAGE.h}` }}
    >
      {layers
        .filter((layer) => layer.behind)
        .map(({ art, style }) => (
          <img key={art.id} src={art.src} alt="" draggable={false} className="absolute max-w-none" style={style} />
        ))}
      <img
        src={bird.src}
        alt=""
        draggable={false}
        className={cn(
          "absolute max-w-none",
          silhouette && "opacity-[0.12] brightness-0 dark:invert"
        )}
        style={{ left: pct(left, STAGE.w), top: pct(top, STAGE.h), width: pct(bird.w, STAGE.w) }}
      />
      {layers
        .filter((layer) => !layer.behind)
        .map(({ art, style }) => (
          <img key={art.id} src={art.src} alt="" draggable={false} className="absolute max-w-none" style={style} />
        ))}
    </div>
  )
}

/**
 * One accessory on its own, centred in a square, for the shop grid. At the
 * default scale one art pixel is one CSS pixel, so it stays crisp.
 */
export function AccessorySprite({
  id,
  scale = 1,
  className,
}: {
  id: string
  scale?: number
  className?: string
}) {
  const art = accessoryArt(id)
  if (!art) return null
  const side = Math.max(art.w, art.h)
  return (
    <div
      className={cn("relative aspect-square shrink-0 [image-rendering:pixelated]", className)}
      style={{ width: side * scale }}
    >
      <img
        src={art.src}
        alt=""
        draggable={false}
        className="absolute max-w-none"
        style={{
          left: pct((side - art.w) / 2, side),
          top: pct((side - art.h) / 2, side),
          width: pct(art.w, side),
        }}
      />
    </div>
  )
}
