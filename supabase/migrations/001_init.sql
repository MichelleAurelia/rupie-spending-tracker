-- =============================================================================
-- 001_init.sql — Rupie initial schema
--
-- HOW TO RUN: Paste this entire file into the Supabase SQL Editor and click
-- "Run". You do NOT need the Supabase CLI.
--
-- WHAT THIS DOES (overview):
--   1. Creates the `profiles` table (one row per user, mirrors auth.users).
--   2. Creates the `expenses` table (spending records).
--   3. Creates an index to speed up per-user expense lookups.
--   4. Creates a trigger that auto-inserts a profile when a user signs up.
--   5. Creates a trigger that auto-manages rated_at on rating change.
--   6. Backfills profiles for any users who already exist.
--   7. Enables Row Level Security so users can only see their own data.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. TABLE: public.profiles
--
-- One row per authenticated user. The `id` column mirrors `auth.users.id`
-- exactly, so joining is trivial.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  -- Same UUID as the user in auth.users. Deleting the auth user cascades
  -- the deletion here too (no orphaned profiles).
  id             uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Optional display name the user can set in their profile settings.
  display_name   text,

  -- Monthly income in Indonesian Rupiah, stored as whole numbers (no decimals).
  -- Must be 0 or positive — negative income makes no sense.
  monthly_income bigint      CHECK (monthly_income >= 0),

  -- Which day of the month the user gets paid (1–31).
  -- Used later to calculate "this pay period" spending windows.
  payday_day     smallint    CHECK (payday_day BETWEEN 1 AND 31),

  -- Automatically set to the current timestamp when the row is created.
  created_at     timestamptz DEFAULT now()
);

-- Friendly comment visible in the Supabase dashboard.
COMMENT ON TABLE public.profiles IS
  'One profile row per authenticated user. Created automatically on sign-up.';


-- ---------------------------------------------------------------------------
-- 2. TABLE: public.expenses
--
-- Each row is one spending event logged by a user.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
  -- Unique identifier for this expense. Generated automatically by Postgres.
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which user this expense belongs to. Defaults to the currently logged-in
  -- user via auth.uid() so the app never has to pass user_id explicitly.
  user_id    uuid        NOT NULL DEFAULT auth.uid()
                         REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Amount in Indonesian Rupiah (whole numbers, no decimals). Must be > 0.
  amount     bigint      NOT NULL CHECK (amount > 0),

  -- Optional free-text note, e.g. "lunch with team".
  note       text,

  -- Category tag. Must be one of the eight allowed values.
  -- Defaults to 'other' so the category field is never accidentally NULL.
  category   text        NOT NULL DEFAULT 'other'
                         CHECK (category IN (
                           'food', 'transport', 'shopping', 'entertainment',
                           'bills', 'health', 'education', 'other'
                         )),

  -- When the money was actually spent (not when the row was created).
  -- Defaults to now() but can be set to a past timestamp.
  spent_at   timestamptz NOT NULL DEFAULT now(),

  -- Optional user rating: was this purchase worth it?
  -- NULL means the user hasn't rated it yet.
  rating     text        CHECK (rating IN ('worth_it', 'meh', 'regret')),

  -- Timestamp of when the rating was last set. Updated automatically by
  -- the on_expense_rating_change trigger whenever rating changes.
  rated_at   timestamptz,

  -- When this row was inserted into the database.
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.expenses IS
  'One row per spending event. Linked to the user who created it.';


-- ---------------------------------------------------------------------------
-- 3. INDEX: fast per-user timeline lookups
--
-- Most queries will ask "give me user X's expenses, newest first", so we
-- index on (user_id, spent_at DESC) to make those queries instant even with
-- millions of rows.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS expenses_user_id_spent_at_idx
  ON public.expenses (user_id, spent_at DESC);


-- ---------------------------------------------------------------------------
-- 4. TRIGGER: auto-create a profile row when a new user signs up
--
-- SECURITY DEFINER  → the function runs with the privileges of its owner
--                     (the DB superuser), not the caller. Required so the
--                     trigger can insert into public.profiles from inside
--                     the auth schema where no anon access is allowed.
-- SET search_path = '' → explicitly qualify every table name (schema.table)
--                     so there is no risk of a malicious schema search-path
--                     injection attack.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert a blank profile for the newly signed-up user.
  -- ON CONFLICT DO NOTHING is a safety net in case this trigger fires twice.
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attach the function to the auth.users table so it fires after every INSERT
-- (i.e., every sign-up or admin-created user).
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ---------------------------------------------------------------------------
-- 5. TRIGGER: auto-manage rated_at timestamp on rating change
--
-- BEFORE UPDATE on public.expenses:
--   • When rating changes to non-null: sets rated_at = now()
--   • When rating is set back to null: resets rated_at = null
--   • If rating is unchanged: leaves rated_at untouched
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_expense_rating_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.rating IS DISTINCT FROM OLD.rating THEN
    IF NEW.rating IS NULL THEN
      NEW.rated_at := NULL;
    ELSE
      NEW.rated_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_expense_rating_change
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_expense_rating_change();


-- ---------------------------------------------------------------------------
-- 6. BACKFILL: create profiles for users who already exist
--
-- If you already have users in auth.users before running this migration,
-- the trigger above won't fire for them retroactively. This INSERT handles
-- those existing users. ON CONFLICT DO NOTHING is safe to run any number
-- of times.
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS)
--
-- RLS is the Supabase/Postgres feature that restricts which rows a query can
-- see or modify. Without it, any authenticated user could read everyone's data.
--
-- Key points:
--   • We ENABLE RLS — this blocks ALL access by default.
--   • Then we add ALLOW policies for the exact operations we want.
--   • (select auth.uid()) is wrapped in a subquery so Postgres can cache it
--     once per statement, which is a tiny performance win.
--   • No policy is created for anonymous (unauthenticated) users — they get
--     nothing.
-- ---------------------------------------------------------------------------

-- ── Enable RLS ──────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;


-- ── Policies for: public.profiles ───────────────────────────────────────────

-- SELECT: a user can read only their own profile row.
CREATE POLICY "profiles: select own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

-- INSERT: a user can only insert a row where id matches their own uid.
-- WITH CHECK prevents them from inserting a row for someone else.
CREATE POLICY "profiles: insert own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- UPDATE: USING restricts which rows they can target; WITH CHECK prevents
-- them from reassigning the row's id to a different user's uid after the fact.
CREATE POLICY "profiles: update own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- NOTE: No DELETE policy on profiles — account deletion is handled by
-- cascading from auth.users (deleting the auth user removes this row too).


-- ── Policies for: public.expenses ───────────────────────────────────────────

-- SELECT: users see only their own expenses.
CREATE POLICY "expenses: select own"
  ON public.expenses
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- INSERT: users can only insert expenses that belong to themselves.
CREATE POLICY "expenses: insert own"
  ON public.expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- UPDATE: USING prevents targeting another user's row; WITH CHECK prevents
-- reassigning user_id to a different uid after the fact.
CREATE POLICY "expenses: update own"
  ON public.expenses
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- DELETE: users can delete only their own expenses.
CREATE POLICY "expenses: delete own"
  ON public.expenses
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
