---
version: alpha
name: Dub
description: >-
  Design system for Dub (dub.co / app.dub.co), the link attribution platform.
  Neutral, monochrome, Tailwind-based UI with black primary actions, hairline
  borders, a blue accent for active/selected state, and generous 8–12px radii.
  Token values are taken from the open-source repo (github.com/dubinc/dub):
  packages/tailwind-config/tailwind.config.ts, themes.css and packages/ui.

colors:
  # --- Core roles -------------------------------------------------------------
  primary: "#000000"            # Primary buttons, badges, "Upgrade plan", filter count dots
  on-primary: "#FFFFFF"
  secondary: "#FFFFFF"          # Secondary (bordered white) buttons, inputs, cards
  on-secondary: "#171717"
  tertiary: "#2563EB"           # Accent (blue-600): active nav, selected tabs, info links
  on-tertiary: "#FFFFFF"
  tertiary-container: "#DBEAFE" # blue-100: active nav pill base (used at 50% alpha)
  tertiary-strong: "#3B82F6"    # blue-500: switches, checkboxes, "success" button
  neutral: "#F5F5F5"            # neutral-100: sidebar panel, hovers, skeletons

  # --- Surfaces (semantic, light theme = default) ------------------------------
  surface: "#FFFFFF"            # bg-default: main content canvas, cards, popovers
  surface-muted: "#FAFAFA"      # bg-muted: row hover, secondary button hover
  surface-subtle: "#F5F5F5"     # bg-subtle: sidebar area panel, disabled buttons
  surface-emphasis: "#E5E5E5"   # bg-emphasis / neutral-200: app shell rail behind the content
  surface-inverted: "#171717"   # bg-inverted: tooltips on dark, inverted chips
  on-surface: "#404040"         # content-default: body text
  on-surface-emphasis: "#171717" # content-emphasis: titles, primary labels
  on-surface-subtle: "#737373"  # content-subtle: secondary text, descriptions, section labels
  on-surface-muted: "#A3A3A3"   # content-muted: placeholders, disabled, tertiary meta

  # --- Borders -----------------------------------------------------------------
  border-muted: "#F5F5F5"
  border-subtle: "#E5E5E5"      # default hairline on cards, buttons, inputs, toolbar
  border-default: "#D4D4D4"     # stronger control borders (text inputs)
  border-emphasis: "#A3A3A3"
  border-focus: "#737373"       # neutral-500 focus border (paired with a 4px neutral-200 ring)

  # --- Neutral ramp (Tailwind neutral) ----------------------------------------
  neutral-50: "#FAFAFA"
  neutral-100: "#F5F5F5"
  neutral-200: "#E5E5E5"
  neutral-300: "#D4D4D4"
  neutral-400: "#A3A3A3"
  neutral-500: "#737373"
  neutral-600: "#525252"
  neutral-700: "#404040"
  neutral-800: "#262626"
  neutral-900: "#171717"
  neutral-950: "#0A0A0A"

  # --- Feedback (bg / content pairs) -------------------------------------------
  info: "#2563EB"
  info-container: "#DBEAFE"
  success: "#16A34A"
  success-container: "#DCFCE7"
  attention: "#EA580C"
  attention-container: "#FFEDD5"
  warning: "#CA8A04"
  warning-container: "#FEF9C3"
  error: "#DC2626"
  error-container: "#FEE2E2"
  danger: "#EF4444"             # red-500: danger buttons, input error border
  danger-hover: "#DC2626"

  # --- Analytics / data-viz --------------------------------------------------
  metric-clicks: "#3B82F6"      # blue-500
  metric-leads: "#A855F7"       # purple-500
  metric-sales: "#14B8A6"       # teal-500
  chart-axis: "#00000066"
  chart-grid: "#00000026"

  # --- Tag palette (Airtable single-select fills, one shared ink) ------------
  tag-gray: "#EEEEEE"
  tag-blue: "#CFDFFF"
  tag-cyan: "#D0F0FD"
  tag-teal: "#C2F5E9"
  tag-green: "#D1F7C4"
  tag-yellow: "#FFEAB6"
  tag-orange: "#FEE2D5"
  tag-red: "#FFDCE5"
  tag-pink: "#FFDAF6"
  tag-purple: "#EDE2FE"
  on-tag: "#1D1F25"

  # --- Dark theme (applied under the `.dark` class) ---------------------------
  dark-surface: "#000000"
  dark-surface-muted: "#171717"
  dark-surface-subtle: "#262626"
  dark-surface-emphasis: "#404040"
  dark-surface-inverted: "#FAFAFA"
  dark-on-surface: "#D4D4D4"
  dark-on-surface-emphasis: "#FAFAFA"
  dark-on-surface-subtle: "#A3A3A3"
  dark-on-surface-muted: "#525252"
  dark-border-subtle: "#404040"
  dark-border-default: "#525252"

typography:
  # Marketing / display — Satoshi (variable, 300–900), `font-display`
  display-xl:
    fontFamily: Satoshi
    fontSize: 50px
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: -0.01em
  display-lg:
    fontFamily: Satoshi
    fontSize: 40px
    fontWeight: 500
    lineHeight: 1.15
  display-md:
    fontFamily: Satoshi
    fontSize: 30px
    fontWeight: 500
    lineHeight: 1.2
  display-sm:
    fontFamily: Satoshi
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4
  # Product UI — Inter, `font-default`
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 600
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 600
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 500
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  body-md-strong:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 600
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
  micro:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: 500
    lineHeight: 14px
  kbd:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 300
    lineHeight: 16px
  mono-sm:
    fontFamily: Geist Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 20px

rounded:
  none: 0px
  sm: 4px        # rounded      — kbd hints, tiny count chips, checkbox inner
  md: 6px        # rounded-md   — inputs, menu items, pagination buttons
  lg: 8px        # rounded-lg   — buttons, sidebar items, filter/select triggers, search input
  xl: 12px       # rounded-xl   — cards, card lists, tooltips, toolbar, content canvas, sidebar panel
  2xl: 16px      # rounded-2xl  — modals, empty-state icon tiles
  3xl: 20px      # marketing nav dropdown panels
  full: 9999px   # tags, status pills, avatars, switches, progress bars

spacing:
  base: 4px
  0-5: 2px
  1: 4px
  1-5: 6px
  2: 8px
  2-5: 10px
  3: 12px
  4: 16px
  5: 20px
  6: 24px
  8: 32px
  10: 40px
  12: 48px
  16: 64px
  control-sm: 28px        # h-7  pagination/analytics buttons
  control-md: 32px        # h-8  sidebar items, compact buttons, tooltip actions
  control-lg: 36px        # h-9  menu items
  control-xl: 40px        # h-10 default Button, inputs, filter triggers
  page-header-height: 64px
  page-header-height-mobile: 48px
  page-max-width: 1280px
  page-gutter: 12px
  page-gutter-lg: 24px
  marketing-gutter-lg: 40px
  shell-inset: 8px
  sidebar-rail-width: 64px
  sidebar-width: 304px
  sidebar-panel-width: 232px
  breakpoint-xs: 420px

components:
  # ---------------------------------------------------------------- Buttons
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    height: 40px
    padding: 0 12px
  button-primary-hover:
    backgroundColor: "{colors.surface-inverted}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-emphasis}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    height: 40px
    padding: 0 12px
  button-secondary-hover:
    backgroundColor: "{colors.surface-muted}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    height: 40px
  button-outline-hover:
    backgroundColor: "#1717170D"
  button-success:
    backgroundColor: "{colors.tertiary-strong}"
    textColor: "{colors.on-tertiary}"
    rounded: "{rounded.lg}"
    height: 40px
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    height: 40px
  button-danger-hover:
    backgroundColor: "{colors.danger-hover}"
  button-disabled:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.on-surface-subtle}"
    rounded: "{rounded.lg}"
    height: 40px
  button-sm:
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: 0 14px
  kbd-on-primary:
    backgroundColor: "{colors.neutral-700}"
    textColor: "{colors.neutral-400}"
    typography: "{typography.kbd}"
    rounded: "{rounded.sm}"
    padding: 2px 8px
  kbd-on-secondary:
    backgroundColor: "{colors.neutral-200}"
    textColor: "{colors.neutral-400}"
    typography: "{typography.kbd}"
    rounded: "{rounded.sm}"
    padding: 2px 8px
  icon-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral-500}"
    rounded: "{rounded.md}"
    size: 24px
  icon-button-hover:
    backgroundColor: "{colors.neutral-100}"

  # ---------------------------------------------------------------- Inputs
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral-900}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 8px 12px
  input-focus:
    backgroundColor: "{colors.surface}"
  input-readonly:
    backgroundColor: "{colors.neutral-100}"
    textColor: "{colors.neutral-500}"
  input-error:
    textColor: "{colors.danger}"
  search-input:
    backgroundColor: "{colors.surface}"
    textColor: "#000000"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    height: 40px
    padding: 0 40px
  filter-trigger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral-900}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    height: 40px
    padding: 0 12px
  filter-count-dot:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.micro}"
    rounded: "{rounded.full}"
    size: 16px
  checkbox:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    size: 20px
  checkbox-checked:
    backgroundColor: "{colors.tertiary-strong}"
    textColor: "#FFFFFF"
  switch-track-off:
    backgroundColor: "{colors.neutral-200}"
    rounded: "{rounded.full}"
    height: 16px
    width: 32px
  switch-track-on:
    backgroundColor: "{colors.tertiary-strong}"

  # ---------------------------------------------------------------- App shell
  app-shell:
    backgroundColor: "{colors.surface-emphasis}"
    padding: 8px 8px 8px 0
  sidebar-rail:
    backgroundColor: "{colors.surface-emphasis}"
    width: 64px
  sidebar-rail-item:
    backgroundColor: "{colors.surface-emphasis}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    size: 44px
  sidebar-rail-item-active:
    backgroundColor: "{colors.surface}"
  sidebar-panel:
    backgroundColor: "{colors.surface-subtle}"
    rounded: "{rounded.xl}"
    width: 232px
    padding: 12px
  sidebar-title:
    textColor: "{colors.on-surface-emphasis}"
    typography: "{typography.headline-md}"
    padding: 8px 12px
  sidebar-section-label:
    textColor: "{colors.on-surface-subtle}"
    typography: "{typography.body-md}"
    padding: 0 0 0 12px
  sidebar-item:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: 8px
  sidebar-item-hover:
    backgroundColor: "#1717170D"
  sidebar-item-active:
    backgroundColor: "#DBEAFE80"
    textColor: "{colors.tertiary}"
    typography: "{typography.label-md}"
  sidebar-upgrade-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    height: 32px
  usage-meter-track:
    backgroundColor: "{colors.neutral-200}"
    rounded: "{rounded.full}"
    height: 4px
  usage-meter-fill:
    backgroundColor: "{colors.tertiary-strong}"
  content-canvas:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
  page-header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-emphasis}"
    typography: "{typography.headline-md}"
    height: 64px
    padding: 0 24px
  page-width-wrapper:
    width: 1280px
    padding: 0 24px

  # ---------------------------------------------------------------- Data display
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: 16px
  card-list-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    padding: 12px 16px
  card-list-row-hover:
    backgroundColor: "{colors.surface-muted}"
  link-card-title:
    textColor: "{colors.neutral-800}"
    typography: "{typography.body-md-strong}"
  link-card-destination:
    textColor: "{colors.neutral-500}"
    typography: "{typography.body-md}"
  link-favicon:
    backgroundColor: "{colors.neutral-100}"
    rounded: "{rounded.full}"
    size: 32px
  analytics-badge:
    backgroundColor: "{colors.neutral-50}"
    textColor: "{colors.neutral-800}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 2px 8px
  tag:
    backgroundColor: "{colors.tag-gray}"   # any tag-* fill
    textColor: "{colors.on-tag}"
    typography: "{typography.caption}"     # 12px, regular
    rounded: "{rounded.full}"
    height: 20px
    padding: 0 8px
  status-badge-info:
    backgroundColor: "{colors.info-container}"
    textColor: "{colors.info}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.md}"
    padding: 4px 8px
  status-badge-attention:
    backgroundColor: "{colors.attention-container}"
    textColor: "{colors.attention}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.md}"
    padding: 4px 8px
  metric-dot-clicks:
    backgroundColor: "{colors.metric-clicks}"
    rounded: "{rounded.sm}"
    size: 8px
  metric-dot-leads:
    backgroundColor: "{colors.metric-leads}"
    rounded: "{rounded.sm}"
    size: 8px
  metric-dot-sales:
    backgroundColor: "{colors.metric-sales}"
    rounded: "{rounded.sm}"
    size: 8px
  chart-axis-label:
    textColor: "{colors.chart-axis}"
    typography: "{typography.caption}"
  chart-gridline:
    backgroundColor: "{colors.chart-grid}"
    height: 1px
  badge-neutral:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral-500}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 1px 8px
  badge-black:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 1px 8px
  status-badge-success:
    backgroundColor: "{colors.success-container}"
    textColor: "{colors.success}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.md}"
    padding: 4px 8px
  status-badge-error:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.error}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.md}"
    padding: 4px 8px
  status-badge-pending:
    backgroundColor: "{colors.warning-container}"
    textColor: "{colors.warning}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.md}"
    padding: 4px 8px
  empty-state-container:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: 48px 16px
  empty-state-icon:
    backgroundColor: "{colors.neutral-50}"
    textColor: "{colors.neutral-800}"
    rounded: "{rounded.2xl}"
    size: 64px
  empty-state-title:
    textColor: "{colors.neutral-950}"
    typography: "{typography.title-md}"
  empty-state-description:
    textColor: "{colors.neutral-500}"
    typography: "{typography.body-md}"
    width: 384px
  pagination-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral-600}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 8px 16px
  pagination-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral-600}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: 28px
    padding: 0 8px
  pagination-button-disabled:
    backgroundColor: "{colors.neutral-100}"
    textColor: "{colors.neutral-400}"
  skeleton:
    backgroundColor: "{colors.neutral-200}"
    rounded: "{rounded.md}"

  # ---------------------------------------------------------------- Navigation
  toggle-group:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: 4px
  toggle-group-item:
    textColor: "{colors.on-surface-emphasis}"
    typography: "{typography.label-md}"
    padding: 4px 12px
  toggle-group-item-selected:
    backgroundColor: "{colors.surface-muted}"
    rounded: "{rounded.lg}"
  tab-select-item:
    textColor: "{colors.on-surface-subtle}"
    typography: "{typography.body-md}"
  tab-select-item-selected:
    textColor: "{colors.tertiary}"
    typography: "{typography.label-md}"
  marketing-nav:
    backgroundColor: "#FFFFFFBF"
    height: 64px
  marketing-nav-item:
    textColor: "{colors.neutral-700}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: 0 12px

  # ---------------------------------------------------------------- Overlays
  tooltip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 8px 16px
  popover:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 8px
  menu-item:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: 36px
    padding: 0 8px
  menu-item-hover:
    backgroundColor: "{colors.surface-subtle}"
  menu-item-danger:
    textColor: "{colors.error}"
  menu-section-label:
    textColor: "{colors.neutral-500}"
    typography: "{typography.label-sm}"
    padding: 0 4px
  modal:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: 0px
  onboarding-pill:
    backgroundColor: "{colors.neutral-950}"
    textColor: "#FFFFFF"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    height: 32px
    padding: 0 12px
  onboarding-pill-hover:
    backgroundColor: "{colors.neutral-800}"
  modal-overlay:
    backgroundColor: "#F5F5F580"
  sheet-mobile:
    backgroundColor: "{colors.surface}"
    rounded: 10px
  toast:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-emphasis}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 12px 16px
---

# Dub Design System

## Overview

Dub is a link attribution platform (short links, conversion analytics, affiliate programs). Its interface is **quiet, precise, and utilitarian** — a monochrome, Vercel/Linear‑school aesthetic where content and data carry the color, and chrome stays out of the way. The UI should feel like a fast developer tool that marketers also enjoy: dense but never cramped, calm, and trustworthy.

Personality keywords: *neutral, crisp, engineered, friendly-minimal*.

Key traits an agent must reproduce:

1. **Monochrome first.** Almost everything is white, neutral grays, and black. Black (`primary`) is reserved for the single most important action on a view ("Create link", "Upgrade plan", "Save changes").
2. **One blue accent for "you are here."** Blue (`tertiary`, blue‑600) signals active navigation, selected tabs, toggles, checkboxes and info links — never decoration.
3. **Hairline borders over shadows.** Surfaces are separated by 1px `border-subtle` (#E5E5E5) lines and subtle background shifts (white on neutral‑100 on neutral‑200), not heavy elevation.
4. **Soft, consistent geometry.** 8px radius on controls, 12px on containers, 16px on modals.
5. **Keyboard‑centric.** Primary actions show a keyboard shortcut chip (e.g. `C` inside "Create link").
6. **Tailwind + Radix implementation.** The source is React/Next.js with Tailwind CSS v3, `class-variance-authority`, Radix primitives, Vaul drawers on mobile, and `@dub/ui` components. When coding, prefer Tailwind utility classes that map 1:1 to the tokens here (e.g. `rounded-lg`, `border-neutral-200`, `text-neutral-500`, `h-10`).

The marketing site (dub.co) shares the same palette and components but adds **Satoshi** display headlines (e.g. "Turn clicks into revenue"), a translucent blurred top nav, subtle grid/dot background patterns, and real product screenshots framed in bordered, rounded cards.

## Colors

The palette is **Tailwind's neutral scale plus a single blue accent**, with semantic tokens exposed as CSS variables (`--bg-*`, `--border-*`, `--content-*`) so light/dark themes swap cleanly.

- **Primary — Ink Black (#000000):** Primary buttons, the sidebar "Upgrade plan" button, filter-count dots, black badges. On hover it lightens to `surface-inverted` (#171717) and gains a 4px `border-subtle` ring.
- **Secondary — Paper White (#FFFFFF):** Secondary buttons, inputs, cards, popovers — always with a 1px `border-subtle` outline.
- **Tertiary — Signal Blue (#2563EB / #3B82F6):** Active sidebar item (text blue‑600 on blue‑100 at 50% alpha), selected tab text and underline, checked checkboxes and switches (blue‑500), inline info links, unread count chips.
- **Neutral surfaces:** A three‑step layered shell. The outer app frame is `surface-emphasis` (#E5E5E5, neutral‑200); the sidebar panel sits on `surface-subtle` (#F5F5F5); the main content canvas is `surface` (#FFFFFF). Row and button hovers use `surface-muted` (#FAFAFA).
- **Text hierarchy:** `on-surface-emphasis` (#171717) for titles and key labels, `on-surface` (#404040) for body and nav items, `on-surface-subtle` (#737373) for descriptions and section labels ("Insights", "Library"), `on-surface-muted` (#A3A3A3) for placeholders and disabled text.
- **Feedback pairs:** Always use the container + content pair together — info (#DBEAFE/#2563EB), success (#DCFCE7/#16A34A), attention (#FFEDD5/#EA580C), warning (#FEF9C3/#CA8A04), error (#FEE2E2/#DC2626). Destructive buttons use red‑500 (#EF4444).
- **Analytics colors:** Clicks = blue‑500, Leads = purple‑500, Sales = teal‑500. Keep this mapping consistent across charts, badges and legends. Chart axes use black at 40% (#00000066) and gridlines black at 15% (#00000026).
- **Tag colors:** Tags are Airtable single-select pills: a pale fill from ten hues (gray, blue, cyan, teal, green, yellow, orange, red, pink, purple) with one shared near-black ink (`on-tag`, #1D1F25). Status tones map onto them: success → green, warning → yellow, error → red, info → blue, violet → purple, accent → orange, neutral → gray. Free-text options (categories) get a stable hue from their name; gray means "nothing set".
- **Borders & dark theme tokens:** `border-*` and `dark-*` tokens are applied through Tailwind utilities (`border-border-subtle`, the `.dark` class) rather than component properties, so they are intentionally not referenced from `components`.
- **Dark mode:** Applied via the `.dark` class. Surfaces invert to pure black (#000000) → #171717 → #262626, text to #FAFAFA/#D4D4D4, borders to #404040/#525252. The dashboard ships light-first; build light first and use semantic tokens so dark mode follows automatically.

## Typography

Dub uses three families, loaded through `next/font`:

- **Inter** (`font-default`, `--font-inter`) — all product UI. Almost everything is **14px (`text-sm`)**; this is the workhorse size for nav items, buttons, inputs, table rows and descriptions. 12px (`text-xs`) is used for meta, badges, kbd hints and usage stats; 10px (`text-2xs`, 14px line height) for tiny counters.
- **Satoshi** (`font-display`, `--font-satoshi`, variable 300–900) — marketing headlines, onboarding and large modal/hero titles, set in **Medium (500)** with tight leading (1.1–1.15) and `text-balance`.
- **Geist Mono** (`font-mono`) — API keys, code snippets, IDs, tokens.

Hierarchy rules:

- **Page title (`headline-md`):** 18px / 28px, semibold, `on-surface-emphasis` (e.g. "Links" in the page header, "Short Links" in the sidebar panel).
- **Section / empty-state title (`title-md`):** 16px medium, near-black ("No links yet").
- **Body (`body-md`):** 14px / 20px regular, `on-surface` or `on-surface-subtle` for supporting copy.
- **Link card title (`body-md-strong`):** 14px semibold with 24px line height (`font-semibold leading-6`), neutral‑800.
- **Labels (`label-md`/`label-sm`):** Medium weight (500) — used for button emphasis, active nav, badges.
- **Keyboard hints (`kbd`):** 12px **light (300)** inside a small rounded chip.

Weights in practice: 400, 500, 600. Avoid 700+ in the app. Never use all-caps labels; Dub uses sentence case everywhere ("Create link", "Learn more", "Complete setup").

## Layout

**App shell (app.dub.co)** — a two-column grid `[min-content, 1fr]`:

1. **Sidebar (304px total)** = a **64px icon rail** (workspace avatar at top, product-area icons as 44×44 `rounded-lg` buttons — the active one is a white tile — and gift/help/user avatar at the bottom) + a **232px panel** (`rounded-xl`, neutral‑100) with the area title ("Short Links"), grouped nav items with 2px (`gap-0.5`) spacing, groups separated by 32px (`gap-8`) with a 14px subtle section label ("Insights", "Library"), and a **usage block** pinned to the bottom (border‑top, "Usage ›" link, Events/Links meters "0 of 1K", reset date caption, black "Upgrade plan" button).
2. **Content canvas:** a white `rounded-xl` panel inset 8px from the top, right and bottom of the neutral‑200 frame (`lg:pt-2 lg:pr-2 lg:pb-2`).

**Page anatomy** (inside the canvas):

- **Page header:** 64px tall (48px mobile), bottom `border-subtle`, title left, primary control(s) right (e.g. black "Create link [C]").
- **Page width wrapper:** `max-w-screen-xl` (1280px) centered, horizontal padding 12px → 24px at `lg`. Marketing uses the same max width with 40px `lg` gutters.
- **Toolbar row:** 20px below the header; left: "Filter ▾" and "Display ▾" secondary triggers (h‑10, gap‑2); right: search input ("Search by short link or URL", ~w‑72) plus a kebab icon button.
- **Content:** card lists / tables / empty states with 12–16px gap below the toolbar.
- **Floating pagination bar:** sticky at the bottom center, a white `rounded-xl` bar with border and soft drop shadow — "Viewing N links" on the left, "Previous"/"Next" 28px buttons on the right.

**Spacing:** Tailwind's 4px scale. Common gaps: 8px between controls, 12px card padding, 16px section padding, 32px between nav groups. Controls are 40px tall by default, 32px compact, 28px mini.

**Responsive:** Breakpoints `xs` 420, `sm` 640, `md` 768, `lg` 1024, `xl` 1280. Below `lg` the sidebar becomes an off-canvas drawer over a `bg-black/20 backdrop-blur-sm` scrim, the shell loses its rounded inset, popovers/modals become Vaul bottom sheets (10px top radius, grab handle 48×4px), and kbd hints are hidden (`md:inline-block`). Use container queries (`@container/page`) for toolbar wrapping.

## Elevation & Depth

Depth comes from **tonal layering and 1px borders**, not shadows:

- Level 0 — app frame: neutral‑200.
- Level 1 — sidebar panel: neutral‑100, no border.
- Level 2 — content canvas, cards, inputs: white + `border-subtle` (#E5E5E5).
- Level 3 — floating layers:
  - Tooltips: `shadow-sm` + 1px border, `rounded-xl`.
  - Popovers / dropdowns: `drop-shadow-lg` + 1px border, `rounded-lg`.
  - Modals: `shadow-xl`, `rounded-2xl`, over a `bg-neutral-100/50 backdrop-blur-md` overlay.
  - Floating toolbar/pagination: `drop-shadow(0 5px 8px #222A351D)`.
  - Card hover: `drop-shadow(0 2px 4px #222A350D)` (`drop-shadow-card-hover`) or a `neutral-50` background.

**Focus & interaction rings** substitute for elevation: focused/open controls get `border-neutral-500` plus a **4px `ring-neutral-200`** halo; primary buttons get a 4px `ring-border-subtle` halo on hover; danger buttons a 4px `ring-red-100`. Keyboard focus on nav uses `ring-2 ring-black/50`.

## Shapes

The shape language is **softly engineered** — rounded enough to feel friendly, never pill-shaped for actions.

- `rounded-sm` 4px — kbd chips, tiny count chips.
- `rounded-md` 6px — text inputs, menu items, analytics badges, pagination buttons, checkboxes.
- `rounded-lg` 8px — **all buttons**, sidebar nav items, rail icons, filter/select triggers, search input, popovers.
- `rounded-xl` 12px — cards, card lists (first/last row only), tooltips, toggle groups, content canvas, sidebar panel, floating bars.
- `rounded-2xl` 16px — modals, empty-state icon tiles (64×64).
- `rounded-full` — tags and status pills, avatars, favicons, switches, meters, grab handles.

Nested radii step down one level (e.g. a `rounded-xl` toggle group contains `rounded-lg` selected pills with 4px padding). Borders are always 1px.

Icons: 16px (`size-4`) inline with 14px text, 20px (`size-5`) in the rail/header. Dub uses a custom **Nucleo**-style outline icon set (`@dub/ui/icons`) with 1.5px strokes, supplemented by `lucide-react`. Favicons of destination sites appear in 32px circles on link cards.

## Components

**Buttons** — `@dub/ui` `Button`. Base: `h-10 w-full rounded-lg border px-3 text-sm gap-2`, leading icon optional, `text` truncates, optional `shortcut` renders a `kbd` chip on the right (hidden below `md`).

- *primary*: black bg + black border, white text; hover `bg-inverted` + `ring-4 ring-border-subtle`. Shortcut chip neutral‑700/neutral‑400.
- *secondary*: white bg, `border-subtle`, emphasis text; hover `bg-muted`; open state `border-emphasis ring-4 ring-border-subtle`.
- *outline*: transparent, no visible border; hover `bg-neutral-900/5`. Use for toolbar/ghost actions.
- *success*: blue‑500; *danger*: red‑500 with `ring-red-100` hover; *danger-outline*: red text that fills red on hover.
- *disabled/loading*: `bg-subtle`, `border-subtle`, `text-subtle`, `cursor-not-allowed`; loading replaces the icon with a spinner. Disabled buttons may carry a `disabledTooltip` explaining why.
- Set explicit widths (`w-fit`) in toolbars; the default is `w-full`.

**Inputs** — 40px, `rounded-md`, `border-neutral-300`, placeholder neutral‑400, 14px. Focus: `border-neutral-500` + neutral ring. Error: `border-red-500`, red alert-circle icon inside the right edge, message below in `text-sm text-red-500`. Read-only: neutral‑100 bg, neutral‑500 text. Labels: 14px medium neutral‑800 above the field with 8px gap.

**Search input** — leading 16px magnifier at 12px inset, `px-10`, `rounded-lg`, `border-neutral-200`, focus `border-neutral-500 ring-4 ring-neutral-200`; a clear (×) button appears when filled.

**Filter / Display triggers** — secondary-style 40px `rounded-lg` buttons with leading icon, label, trailing chevron. Open state: `border-neutral-500 ring-4 ring-neutral-200`. Active filter count shows as a 16px black circular dot. The dropdown is a command-menu popover: search field on top separated by a border, options as `rounded-md px-3 py-2 text-sm` rows with `data-[selected]:bg-neutral-100`, grouped with `text-xs font-medium text-neutral-500` section labels.

**Sidebar nav item** — 32px, `rounded-lg p-2 text-sm`, 16px icon + label with 10px gap. Hover `bg-black/5`, pressed `bg-black/10`. Active: `bg-blue-100/50 text-blue-600 font-medium` (icon also blue). Optional count chip on the right (`text-xs font-semibold rounded px-1.5`, blue‑100/blue‑600, inverted when active). Expandable items show a nested list with a left `border-neutral-200` guide.

**Usage meter** — label row (`text-xs font-medium text-neutral-700` + icon) with "used of limit" right-aligned, a 4px rounded track below, then a caption ("Usage will reset Sep 29, 2026", 12px neutral‑500).

**Card list / Link card** — rows share borders to form one `rounded-xl` block (compact mode) or float as separate `rounded-xl` bordered cards (loose mode). Row: 32px favicon circle, **short link** in 14px semibold neutral‑800 (hover black), destination URL below/next to it in neutral‑500 with a ↳ arrow; right side holds an **analytics badge** (`rounded-md border-neutral-200 bg-neutral-50 px-2 py-0.5 text-sm`, e.g. "⤷ 1.2K clicks"), tag badges, creator avatar, relative time, and a kebab menu. Hover: `bg-neutral-50`.

**Badges and tags** — every tag and status pill in the app is the *Tag* (`Badge` in `src/components/ui/badge.tsx`): `h-5 rounded-full px-2 text-xs font-normal`, a `tag-*` fill, `on-tag` ink, no border, optional 12px leading icon. Several tags sit in a row with `gap-1.5`, exactly like a multi-select cell in Airtable. Use the variant for the colour; never hand-roll a pill. `outline`, `solid` and `count` are not tags and keep their own shapes.

**Empty state** — centered in the bordered content area: an illustration stack of three ghost link-card skeletons (white cards with light-gray bars, link icon and click icon, faded at top), or a 64×64 `rounded-2xl` neutral‑50 icon tile; title "No links yet" (16px medium); description max‑w‑sm 14px neutral‑500 `text-balance`; actions: primary "Create link [C]" + secondary "Learn more", 8px apart.

**Toggle group** — segmented control: `rounded-xl border p-1 gap-1`; items `px-3 py-1 text-sm font-medium`; the selected pill is an animated (Framer Motion `layoutId`) `rounded-lg border bg-bg-muted` layer behind the label.

**Tab select** — underline tabs, 14px; selected text blue‑600 medium with a 2px blue rounded-top underline; unselected neutral‑500 → neutral‑700 on hover.

**Checkbox / Switch** — checkbox 20px `rounded-md border-neutral-200`, checked blue‑500 with white check; switch 16×32 track, neutral‑200 off / blue‑500 on, white thumb.

**Tooltip** — white, `rounded-xl border shadow-sm`, `px-4 py-2`, 14px centered prose, max‑w‑xs; supports inline markdown links and a small CTA button. Enter animation `slide-up-fade` 0.4s `cubic-bezier(0.16,1,0.3,1)`.

**Popover / Dropdown menu** — white, `rounded-lg border drop-shadow-lg`, 8px inner padding; `MenuItem`s are 36px `rounded-md px-2 text-sm font-medium` with icon + label + optional kbd hint; hover `bg-subtle`; danger items red text with `hover:bg-red-50`. Section separators: `-mx-1 my-1 border-b`.

**Modal** — centered, `rounded-2xl border shadow-xl`, white, zero outer padding (content provides its own: header 16–24px with 18px semibold title and bottom border, footer with right-aligned secondary + primary buttons on neutral‑50 with top border). Overlay `bg-neutral-100/50 backdrop-blur-md`. Enter: `scale-in` 0.2s. On mobile, becomes a bottom sheet.

**Pagination bar** — floating white `rounded-xl` bar with border and `drop-shadow(0 5px 8px #222A351d)`, "Viewing **0** links" 14px neutral‑600, Previous/Next 28px `rounded-md` bordered buttons (disabled: neutral‑100 bg, neutral‑400 text).

**Complete setup pill** — bottom-right floating 32px `rounded-full` pill (`bg-neutral-950`, white `text-xs font-medium`, `shadow-md`, circular progress ring); hover `bg-neutral-800 ring-4 ring-neutral-200`. It opens a `rounded-xl` checklist popover with a black header block and a bordered, divided task list.

**Charts** — Visx-based area/bar/funnel charts; area fills are a vertical gradient of the metric color fading to transparent, lines 2px; axes and gridlines in black at 40% and 15% alpha; tooltips follow the tooltip spec.

**Motion** — short and springy: popovers/tooltips `slide-*-fade` 0.4s `cubic-bezier(0.16, 1, 0.3, 1)`; modals `scale-in` 0.2s same curve; sheets 0.2s ease; accordions 300ms `cubic-bezier(0.87,0,0.13,1)`; hover color transitions 75–150ms. Respect `motion-reduce`.

## Do's and Don'ts

- **Do** use black for the single primary action per view; everything else is secondary (white + border) or outline.
- **Do** reserve blue for active/selected/checked state and informational links only.
- **Do** separate surfaces with 1px #E5E5E5 borders and background steps (white / neutral‑50 / neutral‑100 / neutral‑200) instead of shadows.
- **Do** keep product UI at 14px Inter; use 12px only for meta and badges. Use Satoshi only for marketing and hero-level headings.
- **Do** show keyboard shortcut chips on primary actions and hide them below `md`.
- **Do** use 40px as the default control height and align buttons, inputs, and filter triggers on the same row to it.
- **Do** use semantic tokens (`bg-bg-default`, `text-content-emphasis`, `border-border-subtle`) in new components so dark mode works.
- **Do** pair every status color with its container color (e.g. `bg-bg-success text-content-success`).
- **Do** keep Dub's exact status/tag pairs (they are faithful to the source), but for long-form text on tinted backgrounds step the text one shade darker (e.g. `text-green-700` instead of 600) to meet WCAG AA 4.5:1.
- **Do** write sentence-case, concise microcopy ("No links yet", "Create link", "Learn more").
- **Don't** introduce new brand colors, gradients on buttons, or colored page backgrounds in the app.
- **Don't** use pill-shaped (`rounded-full`) buttons for actions in the app — buttons are `rounded-lg`; only badges, avatars and the floating "Complete setup" pill are fully rounded.
- **Don't** add heavy drop shadows to cards; hover states are a background tint or a barely visible drop shadow.
- **Don't** use bold (700+) weights or all-caps labels in the dashboard.
- **Don't** mix the analytics color mapping (clicks = blue, leads = purple, sales = teal).
- **Don't** put borders on the sidebar panel or rail; they are defined purely by tone.
- **Don't** exceed the 1280px content width or remove the 8px inset around the content canvas on desktop.
