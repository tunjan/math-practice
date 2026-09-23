# Maths Tasks

A private tutoring and homework management platform for a mathematics tutor and
their students.

- **Tutors** assign problem sets and reading notes, attach materials, track the
  Assigned → Opened → Submitted → Reviewed lifecycle, and issue verdicts.
- **Students** work through tasks, submit their solutions, watch deadlines on a
  calendar they can subscribe to, and raise a hand for extra practice.
- Both sides share a real-time discussion thread on every assignment, an in-app
  notification centre, and a topic-organised resource library.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, CSS-first tokens |
| Components | shadcn/ui on Base UI primitives |
| Backend | Supabase — Postgres + RLS, Auth, Storage, Realtime, Edge Functions |
| Email | Resend, via a Supabase Edge Function |

## Design

The whole visual surface follows [`DESIGN.md`](DESIGN.md) ("Quiet Console"):
a light grey `canvas-neutral` background, white hairline cards with no shadows, near-black as the
only strong colour, and pale semantic containers that carry status only.

- Tokens and type styles live in `src/app/globals.css`; components use them by
  name (`bg-surface`, `text-on-surface-muted`, `label-caps`, `mono-data`…) and
  never hard-code a colour.
- Inter is for anything a person wrote, JetBrains Mono for anything the
  database produced (dates, sizes, counts, status tags).
- The product accent is orange: brand mark, progress ticks and selection
  controls only, never text.
- Task status always goes through `assignmentStatus()` in
  `src/lib/assignments/model.ts`, so every screen names and colours a state
  the same way.
- Dates are formatted in `en-GB` and the viewer's profile timezone, so server
  and browser render identical strings.

`/styleguide` renders every primitive and the main screens with sample data,
and needs no login.

## Running it

```bash
npm install
cp .env.example .env.local   # fill in once Supabase is provisioned
npm run dev
```

> Builds must be run from a normal terminal — Turbopack's PostCSS worker needs
> to bind a local port, which the agent's sandboxed shell disallows.
