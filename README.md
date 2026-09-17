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

The entire visual surface follows [`DESIGN-x.ai.md`](DESIGN-x.ai.md).
**Read [`DESIGN-NOTES.md`](DESIGN-NOTES.md) before writing UI** — it explains
how those tokens are wired in and which rules are non-negotiable (dark only,
weight 400, pills, hairlines, no shadows).

`/styleguide` renders every primitive against the real tokens.

## Running it

```bash
npm install
cp .env.example .env.local   # fill in once Supabase is provisioned
npm run dev
```

> Builds must be run from a normal terminal — Turbopack's PostCSS worker needs
> to bind a local port, which the agent's sandboxed shell disallows.
