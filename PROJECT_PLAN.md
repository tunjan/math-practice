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
- **Status:** implemented, awaiting user verification
- **Notes:** `0019_assignment_topics.sql`: a join table, a trigger that requires the topic to be in the student's course/level, and RLS (tutor manages, participants read). Tested on the harness. Picker = shadcn Base UI `combobox` (added `combobox.tsx` + `input-group.tsx` only, without overwriting the restyled button/input/textarea), restyled to tokens, with chips as Airtable pills coloured by strand (1 blue, 2 purple, 3 teal, 4 orange, 5 pink). Search by code prefix or title. The new-task dialog shows it under the chip row once a student with a course is chosen, and resets it when the student changes. Invites (pending tasks) get no tags. On edit, only the current course's tags are replaced; tags from a previous course are kept.
- **Changes:** `assignment_topics` join table + RLS. Adds a multi-select combobox in the new/edit task forms, listing only the student's topics, searchable by code or title.
- **Does NOT include yet:** Showing tags on lists.
- **Verify by:** Tag a task with 1.1 + 1.3, reopen edit and both are selected; a student with no course shows no field.

### Phase 9.6 — Show topic tags on tasks
- **Status:** implemented, awaiting user verification
- **Changes:** Shows topic pills (code, title on hover) on task lists, cards, the task detail and the calendar popovers.
- **Verify by:** Tagged tasks show pills everywhere; untagged tasks are unchanged.

### Phase 9.7 — Tracker progress schema
- **Status:** implemented, awaiting user verification
- **Changes:** `topic_progress` (student, topic, status enum, stars 0–5, planned_start, planned_end, notes) + RLS (tutor writes, student reads own).
- **Verify by:** A student can read their own row but can't update it.

### Phase 9.8 — Tutor tracker grid (read + inline edit)
- **Status:** implemented, awaiting user verification
- **Changes:** Adds a "Syllabus" tab on the tutor student page with a ReUI Data Grid grouped by topic 1–5. Columns: code, title, level, status (pill select), stars, planned start/end, tasks count, notes. Each cell saves on its own.
- **Verify by:** Edit each column type, reload, and the values persist. The AHL rows only appear for HL students.

### Phase 9.9 — Bulk edit in the tracker
- **Status:** implemented, awaiting user verification
- **Changes:** Adds row selection and a toolbar to set status or date range on the selected rows.
- **Verify by:** Select 5 rows and set the week; all 5 update.

### Phase 9.10 — Student tracker view
- **Status:** implemented, awaiting user verification
- **Notes:** `/student/syllabus` renders `SyllabusTracker` with `editable={false}`: no checkboxes or bulk bar, status as a plain pill, stars read-only, planned window and notes as text. The summary strip (seen, in progress, scheduled, average stars, progress bar) is the tracker's own. `SessionProfile` now carries `course`, so the student layout adds the Syllabus link (book icon, between Calendar and Aviary) only when a course is set; the page 404s without one.
- **Changes:** Adds a read-only `/student/syllabus` page with the same grid, plus a nav link (only when a course is set) and a progress summary.
- **Verify by:** A student with a course sees their tracker and can't edit it; a student without one has no link.

### Phase 9.11 — Planned topics on the calendar
- **Status:** implemented, awaiting user verification
- **Notes:** `weekPlans` (`src/lib/calendar/model.ts`) groups planned subtopics into one bar per student × Monday–Sunday week × strand. A window with only a start or only an end counts as that one day's week. Windows are capped at 54 weeks. Rows from a course the student is no longer on are dropped, the same as in the tracker. In the month grid, bars sit in a strip under each week row in the strand's tag colour (up to 3, then "n more planned"). The tutor's unfiltered view prefixes each bar with the student's name. The day panel lists the selected day's week bars first, each linking to the tracker (tutor: student page, student: `/student/syllabus`). ICS: one all-day Monday–Sunday event per bar, with a stable UID and a sequence taken from the latest edit.
- **Changes:** Shows planned topics as week bars grouped by topic on the tutor + student calendar and in the ICS feed.
- **Verify by:** Topics scheduled in a week appear on that week for both roles and in the subscribed calendar.

### Phase 9.12 — Exams schema
- **Status:** implemented, awaiting user verification
- **Notes:** `0021_exams.sql`. `exams` has `exam_date` (a date), a title (1–200 chars), `percent` 0–100 and `ib_grade` 1–7 (both nullable, so an exam can be added before it's marked) and notes (≤2000). `exam_topics` is a join table whose trigger requires the topic to be in the student's course/level, the same rule as task tags. A guard keeps exams on student profiles and stops an exam moving to another student. RLS: the student manages their own exams (`with check` blocks creating one for someone else); the tutor manages all. `exam_topics` follows whoever can see the exam. Tested on a local Postgres with a Supabase shim, applying 0001–0021: the student can create/edit/tag/delete their own exam; creating one for another student is refused by RLS; update/delete on another's exam touch 0 rows; tagging another's exam is refused; grade 8 / 101% / blank title are rejected; an exam can't be created for the tutor. Types are hand-added to `database.types.ts`.
- **Changes:** `exams` (student, date, title, percent, ib_grade 1–7, notes) + `exam_topics`. RLS: tutor all; student full CRUD on own.
- **Verify by:** A student can insert/update their own exam but can't touch another student's.

### Phase 9.13 — Exams UI
- **Status:** implemented, awaiting user verification
- **Notes:** `ExamsSection` (`src/components/syllabus/exams-section.tsx`) sits under the tracker on the tutor student page and on `/student/syllabus`. It's a table of date, exam (with an "Upcoming" pill from today on), topic pills, score %, IB grade pill (6–7 green, 4–5 yellow, 1–3 red) and notes, latest first. "Add exam" or clicking a title opens a dialog with name, date, score, grade (native select, "Not marked" allowed), topics (the 9.5 `TopicPicker`) and notes; delete asks for confirmation. Actions `saveExam`/`deleteExam` are in `src/lib/syllabus/actions.ts`: the tutor may manage anyone's exams and a student only their own (RLS enforces the same). Saving replaces the exam's topics with exactly the chosen set.
- **Changes:** Adds an Exams table + dialog (topics multi-select) under the tracker for both roles.
- **Verify by:** Add, edit and delete an exam as student and as tutor.

### Phase 9.14 — Exams on the calendar
- **Status:** implemented, awaiting user verification
- **Notes:** Exams are a third calendar item type (`ExamItem`), all day on their date and sorted before deadlines and events. In the month grid they're an ink (inverse) bar so they stand out from grey all-day events; on phones they're an ink dot. The day panel row shows "Exam · student" (tutor), the result ("78% · Grade 6") once marked, and topic pills, and links to the tracker page. The tutor's student filter narrows exams too. ICS: an all-day event "Exam: title (student)" with topics, result and notes in the description. Students get an alarm at 18:00 the evening before an upcoming exam.
- **Verify by:** Exams appear on their date for both roles and in the ICS feed.

### Phase 9.15 — CSV export
- **Status:** implemented, awaiting user verification
- **Notes:** `papaparse` added. `trackerToCsv` (`src/lib/syllabus/csv.ts`) writes one quoted row per subtopic in syllabus order, with status as its stored value (`to_see`/`in_progress`/`seen`), dates as `YYYY-MM-DD` and blanks for unset values, so a file round-trips. The download is built in the browser with a UTF-8 BOM (for Excel) and named like `syllabus-ana-garcia-aa-hl-2026-09-25.csv`. "Export CSV" is in the tracker toolbar for the tutor and for the student (read-only data, so harmless). Caveat: Sheets/Excel turn code `1.10` into `1.1` on open; 9.16's import falls back to the title in that case.
- **Changes:** Adds an Export button that downloads `code,title,level,status,stars,planned_start,planned_end,notes`.
- **Verify by:** The file opens in Sheets with one row per topic.

### Phase 9.16 — CSV import with preview
- **Status:** implemented, awaiting user verification
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
- **Status:** pending
- **Changes:** Copies a prompt with the CSV schema, the student's topic codes and the date range.
- **Verify by:** Paste it into an LLM, import the result, and the preview is valid.

## 6. Working Agreement

- Implementation proceeds **one phase at a time**. Each phase is announced before it starts (what will and won't change).
- After each phase, report what changed and the verification checklist, then **stop and wait** for the user to test and confirm before continuing.
- The user owns functional/manual testing. Builds, linters, and type-checks may be run to confirm structural correctness, but that is not a substitute for the user's verification.
- Ambiguity is surfaced immediately — named explicitly, with concrete interpretations offered — and never resolved silently, during planning or mid-build.
- Once a phase begins, its scope is fixed. New ideas or unrelated fixes are logged as future phases (or as a flagged, explicitly-approved addendum), not folded in silently.
