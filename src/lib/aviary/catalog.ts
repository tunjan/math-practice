/**
 * The aviary's art. Prices and slots are the database's (`aviary_items`); this
 * file only says what each item looks like and where it sits on a bird.
 *
 * Everything is measured in art pixels of the source sprites. A bird is drawn
 * on a fixed stage, feet on the floor and centred, so every bird lines up and
 * a hat has headroom. Accessories are drawn at half the bird's pixel size: the
 * sheet was painted at the birds' scale, so a crown at 1:1 is as wide as a bird.
 */

export const SLOTS = ["crest", "feet", "neck", "eyes", "head"] as const
export type Slot = (typeof SLOTS)[number]

export const SLOT_LABEL: Record<Slot, string> = {
  head: "Hat",
  eyes: "Eyes",
  neck: "Neck",
  feet: "Feet",
  crest: "Feather",
}

/** Stage size, in art pixels. Wide enough for the widest bird, tall enough for a top hat. */
export const STAGE = { w: 80, h: 84 } as const

/** Accessories are painted at twice the birds' pixel density. */
export const ACCESSORY_SCALE = 0.5

type Point = { x: number; y: number }

export type BirdArt = {
  id: string
  name: string
  species: string
  blurb: string
  src: string
  w: number
  h: number
  /** Where each slot's anchor lands on this bird, in the bird's own pixels. */
  anchors: Record<Slot, Point>
}

export type AccessoryArt = {
  id: string
  name: string
  slot: Slot
  src: string
  w: number
  h: number
  /** The point of the accessory that goes on the bird's anchor, as fractions of its size. */
  pin: Point
}

export const BIRDS: BirdArt[] = [
  {
    id: "sparrow",
    name: "Pip",
    species: "Sparrow",
    blurb: "Small, curious, first to the feeder.",
    src: "/aviary/birds/sparrow.png",
    w: 68,
    h: 63,
    anchors: {
      head: { x: 47, y: 4 },
      eyes: { x: 50, y: 12 },
      neck: { x: 51, y: 22 },
      feet: { x: 44, y: 62 },
      crest: { x: 36, y: 9 },
    },
  },
  {
    id: "bluebird",
    name: "Sky",
    species: "Bluebird",
    blurb: "Sings the answer before you ask.",
    src: "/aviary/birds/bluebird.png",
    w: 72,
    h: 63,
    anchors: {
      head: { x: 50, y: 8 },
      eyes: { x: 55, y: 13 },
      neck: { x: 56, y: 23 },
      feet: { x: 46, y: 62 },
      crest: { x: 42, y: 11 },
    },
  },
  {
    id: "wren",
    name: "Moss",
    species: "Wren",
    blurb: "Tiny, loud and never gives up.",
    src: "/aviary/birds/wren.png",
    w: 65,
    h: 61,
    anchors: {
      head: { x: 44, y: 10 },
      eyes: { x: 47, y: 16 },
      neck: { x: 46, y: 23 },
      feet: { x: 34, y: 60 },
      crest: { x: 36, y: 14 },
    },
  },
  {
    id: "owlet",
    name: "Sage",
    species: "Owlet",
    blurb: "Has read every textbook twice.",
    src: "/aviary/birds/owlet.png",
    w: 65,
    h: 63,
    anchors: {
      head: { x: 46, y: 8 },
      eyes: { x: 44, y: 19 },
      neck: { x: 43, y: 30 },
      feet: { x: 40, y: 62 },
      crest: { x: 32, y: 10 },
    },
  },
]

const HAT: Point = { x: 0.5, y: 0.85 }
const NECKLACE: Point = { x: 0.5, y: 0.05 }

export const ACCESSORIES: AccessoryArt[] = [
  { id: "bell-collar", name: "Bell collar", slot: "neck", w: 40, h: 32, pin: { x: 0.5, y: 0.2 } },
  { id: "green-feather", name: "Leaf feather", slot: "crest", w: 18, h: 43, pin: { x: 0.5, y: 0.95 } },
  { id: "brown-feather", name: "Hawk feather", slot: "crest", w: 17, h: 41, pin: { x: 0.5, y: 0.95 } },
  { id: "bead-necklace", name: "Bead necklace", slot: "neck", w: 44, h: 40, pin: { x: 0.5, y: 0.15 } },
  { id: "bow-tie", name: "Bow tie", slot: "neck", w: 36, h: 18, pin: { x: 0.5, y: 0.5 } },
  { id: "straw-hat", name: "Straw hat", slot: "head", w: 50, h: 28, pin: HAT },
  { id: "boots", name: "Boots", slot: "feet", w: 42, h: 26, pin: { x: 0.5, y: 1 } },
  { id: "flower-crown", name: "Flower crown", slot: "head", w: 50, h: 23, pin: HAT },
  { id: "locket", name: "Locket", slot: "neck", w: 30, h: 54, pin: NECKLACE },
  { id: "goggles", name: "Goggles", slot: "eyes", w: 40, h: 23, pin: { x: 0.62, y: 0.5 } },
  { id: "compass", name: "Compass", slot: "neck", w: 36, h: 56, pin: NECKLACE },
  { id: "top-hat", name: "Top hat", slot: "head", w: 42, h: 37, pin: HAT },
  { id: "sapphire-pendant", name: "Sapphire pendant", slot: "neck", w: 42, h: 54, pin: NECKLACE },
  { id: "emerald-pendant", name: "Emerald pendant", slot: "neck", w: 42, h: 56, pin: NECKLACE },
  { id: "pirate-hat", name: "Pirate hat", slot: "head", w: 48, h: 27, pin: HAT },
  { id: "crown", name: "Crown", slot: "head", w: 36, h: 29, pin: HAT },
].map((a) => ({ ...a, slot: a.slot as Slot, src: `/aviary/accessories/${a.id}.png` }))

const BIRD_BY_ID = new Map(BIRDS.map((b) => [b.id, b]))
const ACCESSORY_BY_ID = new Map(ACCESSORIES.map((a) => [a.id, a]))

export function birdArt(id: string): BirdArt | undefined {
  return BIRD_BY_ID.get(id)
}

export function accessoryArt(id: string): AccessoryArt | undefined {
  return ACCESSORY_BY_ID.get(id)
}

export const STARTER_BIRD = "sparrow"

/** What a bird is wearing, slot by slot. */
export type Outfit = Partial<Record<Slot, string>>
