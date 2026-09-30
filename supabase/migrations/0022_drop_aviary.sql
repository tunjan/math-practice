-- ============================================================================
-- 0022 — Drop the aviary
--
-- Removes what 0016 added for birds: the catalogue, the points ledger, the
-- unlocks, companions and outfits, the purchase functions and the trigger that
-- paid points on approval. Points earned and birds bought are deleted with
-- them.
--
-- Kept from 0016: the task_difficulty enum and the difficulty columns on
-- assignments and pending_assignments. Difficulty is still the tutor's rating
-- of a task; it just no longer pays anything.
--
-- Everything is `if exists`, so this is a no-op on a database without 0016.
-- ============================================================================

drop trigger if exists assignments_approval_awards_points on public.assignments;
drop function if exists private.approval_awards_points();

drop function if exists public.aviary_unlock(text);
drop function if exists public.aviary_choose_bird(text);
drop function if exists public.aviary_equip(text, text);
drop function if exists public.aviary_unequip(text, text);

-- Children before the catalogue they reference.
drop table if exists public.aviary_outfits;
drop table if exists public.aviary_companions;
drop table if exists public.aviary_unlocks;
drop table if exists public.point_awards;
drop table if exists public.aviary_items;

drop function if exists private.aviary_student();
drop function if exists private.owns_item(uuid, text);
drop function if exists private.points_balance(uuid);
drop function if exists private.difficulty_points(public.task_difficulty);

comment on column public.assignments.difficulty is
  'Set by the tutor: easy, medium, hard or ultra.';
