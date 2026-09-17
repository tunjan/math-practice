# Design notes

How `DESIGN-x.ai.md` is wired into this codebase. Read this before adding UI.

Live reference: **`/styleguide`** renders every primitive against the real
tokens. Compare it to the design file rather than eyeballing individual screens.

## Where the tokens live

All of it is in [`src/app/globals.css`](src/app/globals.css). Nothing else in the
codebase should contain a hex value.

- The brand palette sits on `:root` as `--canvas`, `--ink`, `--hairline`,
  `--accent-sunset` and so on — named exactly as the design file names them.
- shadcn's semantic tokens (`--background`, `--card`, `--primary`, …) are
  *resolved onto* that palette, so shadcn components inherit the brand without
  being rewritten one by one.
- `@theme inline` exposes both sets to Tailwind, giving you `bg-canvas`,
  `text-body-mid`, `border-hairline`, `bg-sunset` alongside the usual
  `bg-background` / `text-foreground`.

## Dark only

The brand has no light counterpart. `:root` carries the dark values directly and
`<html>` is permanently `class="dark"` — the class is there only so shadcn's
`dark:` variants still resolve. Do not add a theme toggle.

## Type

Weight **400 everywhere**. The brand never bolds; hierarchy comes from size and
negative tracking. Use the ladder utilities, not raw `text-*` sizes:

| Utility | Size / tracking | Use |
|---|---|---|
| `display-xl` | 96 / -2.4 | Hero, desktop only |
| `display-lg` | 72 / -1.8 | Sub-hero |
| `display-md` | 48 / -1.2 | Section headline |
| `display-sm` | 32 / -0.6 | Page title, card cluster |
| `display-xs` | 20 | Card title, inline display |
| `body-lg` / `body-md` / `body-sm` | 18 / 16 / 14 | Prose |
| `eyebrow` / `eyebrow-sm` | 14 / +1.4, 12 / +1.2 | Geist Mono, UPPERCASE |
| `numeric` | — | Tabular figures for counters and countdowns |

Universal Sans is proprietary; the design file names **Inter 400** as the closest
substitute, and that is what `next/font` loads. **Geist Mono** is the brand's
documented mono companion and carries every eyebrow and label.

Headlines scale down on small screens — write `display-sm md:display-md`, never
a bare `display-xl`.

## Shape

Three radii exist: `0`, `8px`, and pill. Every Tailwind radius step
(`rounded-sm` … `rounded-4xl`) is remapped to 8px, so a stray `rounded-xl` from a
shadcn component still lands on-brand. `rounded-full` is the pill.

- **Every interactive element is a pill** — buttons, badges, chips, toggles.
- **Inputs are the exception**: 8px rectangles, per the design file's
  `text-input` spec.

## Elevation

Hairline borders only. **Nothing casts a shadow.** If a surface needs to lift off
the canvas it changes fill (`canvas` → `canvas-soft` → `canvas-card`) or gains a
`border-hairline`. Do not add `shadow-*` or `ring-*` for depth.

## Buttons

`src/components/ui/button.tsx`. `default` is deliberately the **outline pill**,
so an unstyled `<Button>` is already correct.

| Variant | When |
|---|---|
| `default` / `outline` | Everything. The canonical white-outline pill. |
| `primary` | The white-filled pill. **At most one per screen.** |
| `secondary` | Filled-but-quiet, for dense toolbars. |
| `ghost` | No chrome until hovered. |
| `destructive` | Text and edge only — never a filled red surface. |

Borders on outline pills are `white/25`, **translucent, never solid** — this is
called out explicitly in the design file's Do's and Don'ts.

Use **`ButtonLink`** for navigation. Base UI warns when a `<button>` renders as
an anchor; `ButtonLink` sets `nativeButton={false}` so you don't repeat it.

Touch targets inflate below the `sm` breakpoint to clear WCAG 44×44.

## Colour discipline

The accents — sunset, sunset-soft, dusk, twilight, breeze, midnight — are for
**illustrations, the bird companion, and 6px status dots**. They never fill a
button or a badge, and they never carry text.

Status is expressed as a mono-caps `<Badge>` plus a `<StatusDot accent="…" />`:

```tsx
<Badge variant="strong">
  <StatusDot accent="sunset" />
  Awaiting review
</Badge>
```

The brand publishes no semantic palette. `--destructive` exists because delete
actions need one, and it is held to text and hairline borders.

## Brand primitives

`src/components/brand/primitives.tsx` — the pieces the design file names that
shadcn has no equivalent for:

- `Eyebrow` — the uppercase tracked mono label above every headline.
- `StatusDot` — the only accent colour allowed into interface chrome.
- `Band` / `Container` — content bands on canvas; content centres at 1200px.
- `Rule` — the 1px hairline between bands.
- `PageHeader` — eyebrow over a weight-400 display line, with an optional action.
- `EmptyState` — canvas-soft frame with a quiet caption.

`src/components/brand/table.tsx` — mono-caps headers on `canvas-soft`, `body-sm`
cells, hairline row borders, no zebra striping.

## Motion

Transitions are short and colour-only by default. The global
`prefers-reduced-motion` block in `globals.css` flattens everything — don't
bypass it with inline styles.
