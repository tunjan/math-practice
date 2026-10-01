# Project Plan: Syllabus tracker (Phase 9)

> This is a living document. Update phase statuses and notes as the build progresses. Do not skip ahead of the "Working Agreement" rules below.

## 1. Project Summary

- **What it is:** A from-scratch replacement for the Phase 8 learning plan. Each IB student gets a syllabus tracker: every subtopic of their course (AA/AI, SL/HL), with a status, a 0–5 star rating, planned dates that show on the calendar, class exams, and CSV import/export so an LLM agent can draft the plan.
- **Who it's for:** One tutor (IB Maths AA/AI, SL/HL) and their students, on laptop and phone. Small scale (tens of students).
- **Key constraints:** Existing Next.js 16 + Supabase codebase. Users apply migrations themselves. Components come from shadcn (Base UI) and shadcn-compatible registries (ReUI, shadcnblocks, 21st.dev) and are restyled, not hand-rolled. Pages use the Dub design (`DESIGN.md`, `.dub` scope). Tags follow an Airtable-style pill look, added to `DESIGN.md` as the tag spec.

## 2. Stack & Architecture

| Layer | Choice | Rationale |
|---|---|---|
| Frontend framework | Next.js 16 App Router, React 19 | Existing |
| UI / component library | shadcn on Base UI; ReUI Data Grid (TanStack Table) for the tracker | Spreadsheet-like editing is Airtable's core; ReUI's grid is shadcn-native |
| Backend / API style | Server actions + Supabase RLS | Existing pattern (`src/lib/*/actions.ts`) |
| Data storage | Supabase Postgres; syllabus seeded by migration | Syllabus is fixed reference data |
| CSV | `papaparse` (client parse/unparse) | Handles quoting/newlines correctly; LLM output is often messy |

**Architecture notes:**
- `syllabus_topics` is read-only reference data keyed by `(course, code)`, with a level (`SL` or `AHL`). A student's topics are their course's SL topics, plus AHL topics if they're HL.
- The student's programme, course and level sit on `profiles` and are all nullable. No course means no tracker, and nothing else changes for that student.
- Progress rows are sparse: a missing row reads as "To see, 0 stars, unscheduled".
- Topic tags on tasks are a join table (a task can have several). Free categories stay alongside them.

## 3. Resolved Decisions Log

| # | Ambiguity | Interpretations considered | Decision | Notes |
|---|---|---|---|---|
| 1 | Who sets the 0–5 stars | two ratings / shared / tutor only | Tutor only | Student sees read-only |
| 2 | Existing categories | keep both / replace | Keep both | Categories stay for non-IB students and the library |
| 3 | Streak, weekly goal, log study (8.5) | discard / keep | Discard | Built on plan self-checks that go away |
| 4 | Student edit rights | rating+exams / everything / tutor only | Exams only | Tutor owns status, stars, dates, notes. Student can add/edit/delete own exams |
| 5 | "Seen" checkbox vs status | checkbox / single select | Single select: To see · In progress · Seen | Judgment call; avoids overlapping with stars |
| 6 | Tag code clash (AA 1.1 ≠ AI 1.1) | free text / seeded per course | Seeded per course | Tag shows code, full title on hover |
| 7 | Tags per task | one / many | Many | Tasks often span subtopics |
| 8 | Scope of Airtable tag look | topic tags only / all pills | All tags incl. task status | User: "including the ones already implemented" |
| 9 | Calendar density | one event per subtopic / bars grouped | Week bars, grouped by topic | Keeps ~60 HL rows readable |
| 10 | Programme | free text / enum | Enum, `ib_dp` only for now | Room for others later |

## 4. Feature → Phase Map

| Feature | Phases |
|---|---|
| Discard Phase 8 plan | 9.1 |
| Airtable tags | 9.2 |
| Syllabus + student course | 9.3, 9.4 |
| Topic tags on tasks | 9.5, 9.6 |
| Tracker table | 9.7, 9.8, 9.9, 9.10 |
| Calendar | 9.11 |
| Exams | 9.12, 9.13, 9.14 |
| CSV / LLM | 9.15, 9.16, 9.17 |

## 5. Phases

### Phase 9.1 — Discard the Phase 8 plan feature
- **Status:** done
- **Notes:** `database.types.ts` was hand-trimmed so typecheck catches leftovers; regenerate it after applying 0017. The tutor student page is now just the header until 9.4/9.8. `calendar_event_kind` already has an `exam` value; 9.12 keeps exams as their own table (they need marks and topics), so that kind stays for plain calendar entries.
- **Applied (2026-09-25):** 0017–0021 were applied to the hosted `maths-tasks` project. 0016 (aviary) was already live but isn't in its migration history. That project had drifted from the repo: it had `assignments.syllabus_codes`/`paper`, `student_courses`, `plan_unit_ratings` and the functions `valid_syllabus_codes`, `record_unit_rating` and `import_learning_plan`, none of them in any migration here. With the user's go-ahead, 0017 now drops those too (`if exists`, so it's a no-op on a fresh database). The data lost was the Phase 8 plan data (2 plans, 3 units, 1 objective, 1 rating, 3 study days); `syllabus_codes`/`paper` were empty. A schema fingerprint of the live project (columns, constraints, indexes, policies, triggers, guard function bodies, enums) matches one built from these migrations, and the generated types match `database.types.ts`.
- **Changes:** Migration `0017` drops learning plans, units, objectives, study days, their functions/triggers and `assignments.plan_unit_id`, and restores the student guard without that column. Deletes `src/components/plans`, `src/lib/plans` and `/student/plan`, plus plan references in the nav, the student home, the tutor student page, the task forms and the calendar/ICS.
- **Does NOT include yet:** Anything new.
- **Depends on:** —
- **Verify by:**
  1. Apply `0017`, regenerate `database.types.ts`, and confirm `npm run typecheck` passes.
  2. Student nav has no Plan link, and `/student/plan` returns 404.
  3. Tutor student page, new/edit task dialogs and the calendar render with no plan UI. Creating and editing a task still works.
  4. The ICS feed still serves task deadlines.

### Phase 9.2 — Airtable-style tag primitive
- **Status:** done
- **Notes:** Airtable's light fills as `--tag-*` tokens in `:root` (global) with one ink `--on-tag`. `Badge` gained ten colour variants; the status tones map onto them. Hand-rolled pills in the calendar day panel, the student task dialog/board and the landing page now use `Badge`. Categories get a stable colour hashed from their name (`tagColorFor`), not the legacy `accent_key` palette. Calendar month-grid chips are event bars, not tags, so they're unchanged.
- **Changes:** Adds a tag spec to `DESIGN.md` (rounded-full pastel pill, per-option colour from a fixed palette). Restyles `Badge` and the status/category chips to it.
- **Does NOT include yet:** Topic tags.
- **Verify by:** Task status pills and category chips on tutor + student task lists, the task detail and the calendar all look like Airtable single-select pills, in both themes.

### Phase 9.3 — Syllabus reference data and student course fields
- **Status:** done
- **Notes:** `0018_syllabus.sql`. Seeded from the first-assessment-2021 guides: AA 51 SL + 32 AHL, AI 39 SL + 39 AHL (161 rows). Titles are short labels, not the guide's full wording. Enums `ib_programme` (`ib_dp`), `ib_course` (AA/AI), `ib_level` (SL/HL), `syllabus_level` (SL/AHL). A check keeps programme/course/level all set or all null. `guard_profile_update` freezes them for students. Verified on the local harness: all 0001–0018 apply, the student's change is ignored, a partial set is rejected, and inserts into topics are refused by RLS. Types hand-added to `database.types.ts`.
- **Changes:** Migration: `syllabus_topics` (course AA/AI, level SL/AHL, topic number 1–5, code, title), seeded from the IB syllabus. Adds `programme`, `course` and `level` to `profiles`. RLS: everyone reads topics; only the tutor writes the course fields.
- **Does NOT include yet:** UI.
- **Verify by:** After applying, `select course, level, count(*) from syllabus_topics group by 1,2` returns plausible counts, and a student can't update their own course.

### Phase 9.4 — Tutor sets a student's programme / course / level
- **Status:** done
- **Notes:** `CourseCard` (`src/components/syllabus/course-card.tsx`) uses three native selects in a card, with Save enabled only when the course is changed and complete, and "Remove course" only when one is set. Action `saveStudentCourse` is in `src/lib/syllabus/actions.ts`; labels and helpers are in `src/lib/syllabus/model.ts`.
- **Changes:** Adds a "Course" control on the tutor student page (three selects + clear).
- **Verify by:** Setting AA HL persists after reload; clearing it hides the course everywhere.

### Phase 9.5 — Topic tags schema and task form field
- **Status:** done
- **Notes:** `0019_assignment_topics.sql`: a join table, a trigger that requires the topic to be in the student's course/level, and RLS (tutor manages, participants read). Tested on the harness. Picker = shadcn Base UI `combobox` (added `combobox.tsx` + `input-group.tsx` only, without overwriting the restyled button/input/textarea), restyled to tokens, with chips as Airtable pills coloured by strand (1 blue, 2 purple, 3 teal, 4 orange, 5 pink). Search by code prefix or title. The new-task dialog shows it under the chip row once a student with a course is chosen, and resets it when the student changes. Invites (pending tasks) get no tags. On edit, only the current course's tags are replaced; tags from a previous course are kept.
- **Changes:** `assignment_topics` join table + RLS. Adds a multi-select combobox in the new/edit task forms, listing only the student's topics, searchable by code or title.
- **Does NOT include yet:** Showing tags on lists.
- **Verify by:** Tag a task with 1.1 + 1.3, reopen edit and both are selected; a student with no course shows no field.

### Phase 9.6 — Show topic tags on tasks
- **Status:** done
- **Changes:** Shows topic pills (code, title on hover) on task lists, cards, the task detail and the calendar popovers.
- **Verify by:** Tagged tasks show pills everywhere; untagged tasks are unchanged.

### Phase 9.7 — Tracker progress schema
- **Status:** done
- **Changes:** `topic_progress` (student, topic, status enum, stars 0–5, planned_start, planned_end, notes) + RLS (tutor writes, student reads own).
- **Verify by:** A student can read their own row but can't update it.

### Phase 9.8 — Tutor tracker grid (read + inline edit)
- **Status:** done
- **Changes:** Adds a "Syllabus" tab on the tutor student page with a ReUI Data Grid grouped by topic 1–5. Columns: code, title, level, status (pill select), stars, planned start/end, tasks count, notes. Each cell saves on its own.
- **Verify by:** Edit each column type, reload, and the values persist. The AHL rows only appear for HL students.

### Phase 9.9 — Bulk edit in the tracker
- **Status:** done
- **Changes:** Adds row selection and a toolbar to set status or date range on the selected rows.
- **Verify by:** Select 5 rows and set the week; all 5 update.

### Phase 9.10 — Student tracker view
- **Status:** done
- **Notes:** `/student/syllabus` renders `SyllabusTracker` with `editable={false}`: no checkboxes or bulk bar, status as a plain pill, stars read-only, planned window and notes as text. The summary strip (seen, in progress, scheduled, average stars, progress bar) is the tracker's own. `SessionProfile` now carries `course`, so the student layout adds the Syllabus link (book icon, between Calendar and Aviary) only when a course is set; the page 404s without one.
- **Changes:** Adds a read-only `/student/syllabus` page with the same grid, plus a nav link (only when a course is set) and a progress summary.
- **Verify by:** A student with a course sees their tracker and can't edit it; a student without one has no link.

### Phase 9.11 — Planned topics on the calendar
- **Status:** done
- **Notes:** `weekPlans` (`src/lib/calendar/model.ts`) groups planned subtopics into one bar per student × Monday–Sunday week × strand. A window with only a start or only an end counts as that one day's week. Windows are capped at 54 weeks. Rows from a course the student is no longer on are dropped, the same as in the tracker. In the month grid, bars sit in a strip under each week row in the strand's tag colour (up to 3, then "n more planned"). The tutor's unfiltered view prefixes each bar with the student's name. The day panel lists the selected day's week bars first, each linking to the tracker (tutor: student page, student: `/student/syllabus`). ICS: one all-day Monday–Sunday event per bar, with a stable UID and a sequence taken from the latest edit.
- **Changes:** Shows planned topics as week bars grouped by topic on the tutor + student calendar and in the ICS feed.
- **Verify by:** Topics scheduled in a week appear on that week for both roles and in the subscribed calendar.

### Phase 9.12 — Exams schema
- **Status:** done
- **Notes:** `0021_exams.sql`. `exams` has `exam_date` (a date), a title (1–200 chars), `percent` 0–100 and `ib_grade` 1–7 (both nullable, so an exam can be added before it's marked) and notes (≤2000). `exam_topics` is a join table whose trigger requires the topic to be in the student's course/level, the same rule as task tags. A guard keeps exams on student profiles and stops an exam moving to another student. RLS: the student manages their own exams (`with check` blocks creating one for someone else); the tutor manages all. `exam_topics` follows whoever can see the exam. Tested on a local Postgres with a Supabase shim, applying 0001–0021: the student can create/edit/tag/delete their own exam; creating one for another student is refused by RLS; update/delete on another's exam touch 0 rows; tagging another's exam is refused; grade 8 / 101% / blank title are rejected; an exam can't be created for the tutor. Types are hand-added to `database.types.ts`.
- **Changes:** `exams` (student, date, title, percent, ib_grade 1–7, notes) + `exam_topics`. RLS: tutor all; student full CRUD on own.
- **Verify by:** A student can insert/update their own exam but can't touch another student's.

### Phase 9.13 — Exams UI
- **Status:** done
- **Notes:** `ExamsSection` (`src/components/syllabus/exams-section.tsx`) sits under the tracker on the tutor student page and on `/student/syllabus`. It's a table of date, exam (with an "Upcoming" pill from today on), topic pills, score %, IB grade pill (6–7 green, 4–5 yellow, 1–3 red) and notes, latest first. "Add exam" or clicking a title opens a dialog with name, date, score, grade (native select, "Not marked" allowed), topics (the 9.5 `TopicPicker`) and notes; delete asks for confirmation. Actions `saveExam`/`deleteExam` are in `src/lib/syllabus/actions.ts`: the tutor may manage anyone's exams and a student only their own (RLS enforces the same). Saving replaces the exam's topics with exactly the chosen set.
- **Changes:** Adds an Exams table + dialog (topics multi-select) under the tracker for both roles.
- **Verify by:** Add, edit and delete an exam as student and as tutor.

### Phase 9.14 — Exams on the calendar
- **Status:** done
- **Notes:** Exams are a third calendar item type (`ExamItem`), all day on their date and sorted before deadlines and events. In the month grid they're an ink (inverse) bar so they stand out from grey all-day events; on phones they're an ink dot. The day panel row shows "Exam · student" (tutor), the result ("78% · Grade 6") once marked, and topic pills, and links to the tracker page. The tutor's student filter narrows exams too. ICS: an all-day event "Exam: title (student)" with topics, result and notes in the description. Students get an alarm at 18:00 the evening before an upcoming exam.
- **Verify by:** Exams appear on their date for both roles and in the ICS feed.

### Phase 9.15 — CSV export
- **Status:** done
- **Notes:** `papaparse` added. `trackerToCsv` (`src/lib/syllabus/csv.ts`) writes one quoted row per subtopic in syllabus order, with status as its stored value (`to_see`/`in_progress`/`seen`), dates as `YYYY-MM-DD` and blanks for unset values, so a file round-trips. The download is built in the browser with a UTF-8 BOM (for Excel) and named like `syllabus-ana-garcia-aa-hl-2026-09-25.csv`. "Export CSV" is in the tracker toolbar for the tutor and for the student (read-only data, so harmless). Caveat: Sheets/Excel turn code `1.10` into `1.1` on open; 9.16's import falls back to the title in that case.
- **Changes:** Adds an Export button that downloads `code,title,level,status,stars,planned_start,planned_end,notes`.
- **Verify by:** The file opens in Sheets with one row per topic.

### Phase 9.16 — CSV import with preview
- **Status:** done
- **Notes:** "Import CSV" in the tutor's tracker toolbar opens a dialog: choose a file or paste (pasting into the empty box checks straight away), then Check, then a diff table (code, subtopic, each changed field before → after), then "Apply n changes". `parseTrackerCsv` (`src/lib/syllabus/csv.ts`) is pure and writes nothing:
  - Headers are case/space-insensitive.
  - Only `code` is required. A missing column leaves that field alone; unknown columns are ignored with a note.
  - A blank status/stars cell = unchanged; a blank date/notes cell = cleared, matching how export writes "not set", so a round trip gives 0 changes.
  - Status accepts stored values or labels ("In progress").
  - When code and title disagree and the title names another subtopic exactly, the title wins (Sheets turns 1.10 into 1.1).
  - Rejected with the spreadsheet row number (header = row 1): unknown or out-of-course codes, duplicate rows, non-integer or out-of-range stars, invalid dates (incl. 2026-02-30), end before start, windows over 366 days, notes over 2000 chars, and CSV syntax errors. Any problem blocks Apply.
  
  `importTopicProgress` re-validates every row with the same checks as inline edits (`progressValues`, now shared) and writes them in one upsert, so the import lands or fails whole. Checked with a script: round-trip of an export → 0 changes; mangled 1.10 matched by title; partial LLM file with labels; a file with every kind of error reports each with its row.
- **Changes:** Adds upload/paste → validation (unknown codes, bad dates, stars out of range) → diff preview → apply.
- **Verify by:** Round-trip an exported file unchanged (0 changes). A file with a bad code is rejected with the row number.

### Phase 9.17 — "Copy LLM prompt"
- **Status:** done
- **Notes:** "LLM prompt" in the tutor's tracker toolbar opens a popover with From (today) and To (30 April before the next May session) and copies `llmPlanPrompt` (`src/lib/syllabus/csv.ts`). The prompt includes: the course, how many subtopics aren't seen yet, the exact header, the rules Import enforces (same codes, no extras/repeats, status values, stars 0–5, YYYY-MM-DD with start ≤ end), planning guidance (prerequisites, SL before the AHL that builds on it, 1–2 weeks each, review time before the end date, weaker topics earlier, seen rows untouched) and the current tracker as CSV (every code the student studies). The importer now strips a ```csv fence, since LLMs add one anyway. Checked with a script: a reply in the requested shape (unquoted, with 1.10) imports with only the planned dates and notes changing.
- **Changes:** Copies a prompt with the CSV schema, the student's topic codes and the date range.
- **Verify by:** Paste it into an LLM, import the result, and the preview is valid.

### Phase 10 — Registry components where the app hand-rolled them
- **Status:** done (awaiting user verification)
- **Notes:** An audit of shadcn/ui, ReUI, 21st.dev, shadcnblocks and shadcncraft against every screen. Added only where a registry component replaces a hand-rolled widget; each is restyled to the Dub tokens, not left on shadcn defaults. Sources came from the shadcn-ui/ui and keenthemes/reui GitHub repos (the registry sites are blocked in the agent's network). `react-day-picker` added.
  - **Calendar + DateField** (shadcn Calendar / Date Picker) replace every native `type="date"` input: tracker Plan start/end (cell and bulk bar), LLM prompt range, exam date, event dates. `DateField` keeps the `YYYY-MM-DD` string contract, `min`/`max`, and posts through a hidden input when given a `name`, so no action code changed. Weeks start Monday. Time and `datetime-local` inputs stay native.
  - **ToggleGroup** (shadcn, Base UI) replaces the aria-pressed button rows: task browser filter (`track` variant) and tracker status filter (`chips`). One tab stop, arrow keys.
  - **Collapsible** (shadcn) replaces `<details>` for "Show N older" on the student board.
  - **Alert** (shadcn) now backs `FormMessage` and the upload-rejection / CSV-problem boxes in hand-in, material uploader and CSV import.
  - `/styleguide/components` renders all of them with sample data.
  - Considered and not adopted: ReUI Stepper, Rating, File upload, Kanban and Timeline duplicate existing, accessible custom builds (lifecycle tracker, star rating, uploaders, task board, comments). ReUI Data Grid (named in §2 for the tracker) would be a rewrite of a working 600-line grid and is left for its own phase. shadcnblocks/shadcncraft/21st.dev are mainly marketing blocks (hero, pricing, footer) with no screen to host them.
- **Verify by:**
  1. Tracker: Plan a subtopic with the date pickers; End can't be before Start; Clear works; the bulk bar's Plan works.
  2. Exams: add an exam with the date picker. Calendar: create an all-day event across days and a timed event; both save the chosen dates.
  3. Task browser and tracker filters work by click and by arrow keys.
  4. Student board: "Show N older" expands and collapses.
  5. Upload a too-large file, and import a CSV with a bad code: both errors show in the red alert box.

### Phase 11 — Registry components as new features
- **Status:** done (awaiting user verification)
- **Notes:** Follow-up to Phase 10: additions, not replacements. `cmdk` and `recharts` added (the shadcn Command and Chart dependencies).
  - **Command palette** (shadcn Command / cmdk). ⌘K or Ctrl+K anywhere in the tutor and student workspaces, or the new Search row at the top of the sidebar (and a search icon in the phone top bar). It lists the workspace pages; the tutor also gets every student and their 500 most recent tasks, the student their own tasks. The index comes from `loadCommandIndex` (`src/lib/search/actions.ts`) when the palette opens, so it costs nothing until used; RLS scopes it and the query also filters by role.
  - **By topic chart** (shadcn Chart / Recharts) above the tracker, for tutor and student: each IB topic as a 100% stacked bar of seen / in progress / to see, with seen/total at the end. It reads the tracker's optimistic rows, so it moves as the tutor edits. One green, light to dark (the states are ordered), checked with the dataviz palette validator. On phones the axis shows topic numbers only.
  - **Row context menu** (shadcn Context Menu, Base UI). Right-click a tracker row (tutor only) to set status or stars, select the row, clear its plan or clear its note.
  - `/styleguide/components` has the palette with sample data.
- **Verify by:**
  1. Press ⌘K / Ctrl+K as the tutor: type a student's name and a task title, and each opens its page. As a student, only your own tasks appear.
  2. The sidebar's Search row and the phone top bar's search icon open the palette.
  3. On a tracker, the By topic chart matches the counts in the grid and updates when you change a status.
  4. Right-click a tracker row: status and stars change, and the menu closes. Clear plan and Clear note work, and are disabled when there's nothing to clear. No menu appears for the student.

### Phase 12 — One tutor per student (tenancy)
- **Status:** done (awaiting user verification)
- **Decisions:** open self-serve tutor sign-up; one tutor per student.
- **Notes:** Migration `0023_multi_tutor.sql`. `profiles.tutor_id` links a student to their tutor: backfilled from the invite each student redeemed, otherwise to the first tutor; set by `redeem_invite()` from then on. Every role-wide `is_tutor()` policy now asks about ownership instead (`is_my_student`, `tutors_assignment`, `owns_material_folder`, `my_tutor_id`): profiles, categories, assignments and their files/topics, submissions, queued tasks, topic progress, exams, calendar sharing and all three storage buckets. Categories are per tutor (unique on tutor + name). The profile guard no longer waves tutors through: role, id, tutor and calendar token are frozen for everyone signed in, and only a student's own tutor sets their course. App code: the calendar feed (service role) filters a tutor's plans and exams to their students; a student's "share with tutor" uses their own `tutor_id`. Roster, search and task pickers needed no change, RLS now scopes them. `database.types.ts` edited by hand for the new column.
- **Tested:** all migrations applied to a local Postgres with Supabase stubs, then two tutors and three students: each tutor sees only their own students, tasks, topics, exams and invites; cross-tutor inserts, updates, file uploads and event shares are refused; students cannot move tutor or change role; the existing tutor sees what they saw before.
- **Does not change:** how anyone signs up. The first-account-is-tutor rule is still in place until Phase 13.
- **Verify by:**
  1. Apply `0023_multi_tutor.sql`, then sign in as the tutor: the roster, tasks, tracker, exams, calendar and ⌘K search all look exactly as before.
  2. Invite a student, redeem the link, and they appear in the roster; any queued task arrives with its attachment.
  3. As a student: tasks, topic names, tracker and calendar are unchanged; sharing an event with the tutor still works.
  4. The calendar subscription link (tutor and student) still returns the same events.

### Phase 13 — Tutor sign-up
- **Status:** done (awaiting user verification). Migrations 0023 and 0024 are applied to the hosted project.
- **Notes:**
  - Migration `0024_tutor_signup.sql`: `handle_new_user()` makes every new account a student with no tutor. The first-account-is-tutor rule is gone.
  - `/signup` (name, email, password) calls `signUpTutor` (`src/lib/auth/actions.ts`): the service role creates an unconfirmed account and promotes its profile to tutor; 5 sign-ups per hour per address. It gives the same reply for a taken address, so it can't be used to find accounts. Signing up again with an unconfirmed address replaces its password and re-sends the link.
  - `src/lib/auth/confirmation.ts` builds the link on `NEXT_PUBLIC_SITE_URL` and sends it through Resend (`confirmEmail` template, previewable at `/styleguide/emails/confirm`); 3 emails per hour per address. Without `RESEND_API_KEY` in development the link is printed in the server log.
  - `/auth/confirm` shows a button; the token is only spent on click, so mail scanners can't burn it. Confirming signs the tutor in and lands them in `/tutor`.
  - Sign-in refuses an unconfirmed account and sends a fresh link.
  - Login page footer, landing hero ("Start tutoring") and closing section link to `/signup`.
- **Needs in production:** `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY` and `RESEND_FROM_EMAIL` set, or nobody receives the link. Public sign-ups can be switched off in Supabase Auth settings; this flow doesn't use them.
- **Checked:** 0024 on the local Postgres harness; `/signup`, `/login` and `/auth/confirm` render; a bad token shows the expired-link error. Not run end to end: no account was created and no email sent.
- **Verify by:**
  1. `/signup` with your email: the form gives way to "We've sent a confirmation link".
  2. Signing in before confirming is refused and a new link arrives.
  3. The emailed link opens "Confirm your email"; the button lands you in an empty tutor workspace.
  4. Sign up a second tutor with another address: they see none of the first tutor's students, tasks or topics.
  5. Invite a student from each tutor; each student appears only in their own tutor's roster.

### Phase 14 — First-run for a new tutor
- **Status:** done (awaiting user verification)
- **Notes:**
  - Tutor overview (`src/app/tutor/page.tsx`): with no students, no open invites and no tasks it shows a "Get started" card (invite a student, set a task, review the hand-in) with one action, instead of four zeros and two empty lists. Once someone is invited but nothing is set, "Needs your attention" says "No tasks yet" with a New task button.
  - Time zone: the sign-up form posts the browser's zone (`TimeZoneField`), checked by `validTimeZone` (`src/lib/timezone.ts`) and stored on the profile; otherwise the default Europe/London stays. Addendum to the stated scope: the invite form does the same for students, since they had the same problem and no way to change it.
  - README has an Accounts section for multi-tutor, sign-up and the variables the confirmation email needs.
- **Checked:** type-check and lint; `/signup` posts the browser's zone. The first-run overview was not seen in a browser, as that needs a confirmed tutor account.
- **Verify by:**
  1. Confirm a new tutor account: the overview shows "Get started", and its button goes to Students.
  2. Create an invite, go back to the overview: the normal overview is there, with "No tasks yet" and a New task button.
  3. Set a task with a deadline: the time shown matches your own clock, not London's (if you are elsewhere).
  4. Redeem the invite as the student: their deadlines also read in their own zone.

### Phase 15 — GCSE Core Maths support (Cambridge IGCSE 0580)
- **Status:** done (awaiting user verification)
- **What it is:** Extends the syllabus tracker to support Cambridge IGCSE Mathematics (0580) Core curriculum (and Extended tier) alongside IB Diploma (AA and AI).
- **Notes:**
  - Migrations `0026_gcse_enums.sql` and `0027_gcse_syllabus.sql`:
    - Enums extended: `ib_programme` (`gcse`), `ib_course` (`0580`), `ib_level` (`Core`, `Extended`), `syllabus_level` (`Core`, `Extended`).
    - Constraints updated: `syllabus_topics_topic` widened from 1–5 to 1–9; `exams_ib_grade_range` widened from 1–7 to 1–9.
    - Guard triggers (`guard_assignment_topic`, `guard_topic_progress`, `guard_exam_topic`) updated to enforce matching course and tier rules for both IB and GCSE (`Core` students only access `Core` topics; `Extended` access `Core` and `Extended`).
    - Reference data: 60 subtopics across 9 strands for Cambridge IGCSE Mathematics 0580 (43 Core, 17 Extended).
  - App code:
    - `src/lib/syllabus/model.ts`: Programme, course, and level definitions, labels, and mappings (`PROGRAMME_COURSES`, `PROGRAMME_LEVELS`). `courseShortName` produces "GCSE Core Maths" for 0580 Core. `topicName(topic, course)` and 9 strand colors. `topicsForCourse` filters Core vs Extended. `GCSE_GRADES` (9–1).
    - `src/components/syllabus/course-card.tsx`: Programme select dynamically updates available courses and levels.
    - `src/components/syllabus/syllabus-tracker.tsx` & `src/components/syllabus/topic-picker.tsx`: Displays strand names according to course curriculum (e.g. Number, Algebra and graphs, Coordinate geometry, etc. for 0580).
    - `src/components/syllabus/exams-section.tsx`: Shows 1–9 grades for GCSE students with proper band coloring (7–9 green, 4–6 yellow, 1–3 red).
    - `src/lib/syllabus/csv.ts`: LLM prompt and guidance supports general curricula.
    - `src/lib/assignments/actions.ts` & `src/lib/calendar/load.ts`: Respects `Core` and `Extended` syllabus level filtering.
- **Verify by:**
  1. Apply `0026_gcse_enums.sql` and `0027_gcse_syllabus.sql` in the Supabase project.
  2. On a student's profile page as tutor, select Programme "Cambridge IGCSE", Course "0580 · Mathematics", Level "Core", and Save.
  3. Header displays "GCSE Core Maths".
  4. Syllabus tab renders 9 strands (Number, Algebra and graphs, Coordinate geometry, Geometry, Mensuration, Trigonometry, Transformations and vectors, Probability, Statistics) with 43 Core subtopics.
  5. Tasks can be tagged with 0580 Core subtopics.
  6. Exams section allows recording 1–9 grades.

### Phase 16 — Spanish ESO and Bachillerato mathematics support (3º & 4º ESO, 1º & 2º Bachillerato Ciencias y Sociales)
- **Status:** done (awaiting user verification)
- **What it is:** Extends the syllabus tracker to support the Spanish curriculum (LOMLOE):
  - Programmes: "ESO" and "Bachillerato"
  - Courses: 3º ESO (Común), 4º ESO (Ciencias and Sociales), 1º Bachillerato (Ciencias - Matemáticas I and Sociales - Matemáticas CCSS I), 2º Bachillerato (Ciencias - Matemáticas II and Sociales - Matemáticas CCSS II).
  - 1–10 grading scale for Spanish school exams (Sobresaliente 9–10, Notable 7–8, Bien/Suficiente 5–6, Insuficiente 1–4).
  - Course- and track-aware strand and subtopic naming in Spanish (e.g. Álgebra matricial, Geometría en el espacio, etc.).
- **Notes:**
  - Migrations `0028_spanish_enums.sql` and `0029_spanish_syllabus.sql`:
    - Enums extended: `ib_programme` (`eso`, `bachillerato`), `ib_course` (`3eso`, `4eso`, `1bach`, `2bach`), `ib_level` and `syllabus_level` (`Ciencias`, `Sociales`, `Común`).
    - Constraints updated: `syllabus_topics_course_level_code unique (course, level, code)` so tracks under the same course can share code numbering; `exams_ib_grade_range` widened to 1–10.
    - Guard triggers (`guard_assignment_topic`, `guard_topic_progress`, `guard_exam_topic`) updated to enforce matching course and tier rules (`or (p.level = t.level)`).
    - Reference data: Complete subtopics for all 7 tracks (~290 subtopics across ESO and Bachillerato).
  - App code:
    - `src/lib/syllabus/model.ts`: Programme, course, and level definitions, labels, and courseLevels helper. `courseShortName` formatting for ESO and Bachillerato. Spanish strand names and `SPANISH_GRADES` (1–10).
    - `src/components/syllabus/course-card.tsx`: Programme and course selects dynamically cascade valid levels (e.g. 3º ESO automatically locks to "Común", 4º ESO / Bachillerato show "Ciencias" and "Sociales").
    - `src/components/syllabus/syllabus-tracker.tsx` & `src/components/syllabus/topic-picker.tsx`: Pass course and level to `topicName` to render Spanish block headers correctly.
    - `src/components/syllabus/exams-section.tsx`: Shows 1–10 grades for Spanish curriculum with Spanish grade bands (≥7 green, ≥5 yellow, <5 red).
    - `src/lib/calendar/load.ts`: Respects `Común`, `Ciencias`, and `Sociales` level filtering.
- **Verify by:**
  1. Apply `0028_spanish_enums.sql` and `0029_spanish_syllabus.sql` in the Supabase project.
  2. On a student's profile page as tutor, select Programme "ESO" or "Bachillerato", pick a course and track (e.g. 2º Bachillerato + Ciencias), and Save.
  3. Header displays "2º Bachillerato (Ciencias)".
  4. Syllabus tab renders the Spanish blocks (e.g. Álgebra lineal, Geometría en el espacio, Continuidad y derivabilidad, etc.) and full list of subtopics in Spanish.
  5. Tasks can be tagged with the subtopics.
  6. Exams section allows recording 1–10 grades with passing grade coloring.

## 6. Working Agreement

- Implementation proceeds **one phase at a time**. Each phase is announced before it starts (what will and won't change).
- After each phase, report what changed and the verification checklist, then **stop and wait** for the user to test and confirm before continuing.
- The user owns functional/manual testing. Builds, linters, and type-checks may be run to confirm structural correctness, but that is not a substitute for the user's verification.
- Ambiguity is surfaced immediately — named explicitly, with concrete interpretations offered — and never resolved silently, during planning or mid-build.
- Once a phase begins, its scope is fixed. New ideas or unrelated fixes are logged as future phases (or as a flagged, explicitly-approved addendum), not folded in silently.
