/**
 * lib/db/types.ts
 *
 * Hand-written TypeScript types that mirror the SQL schema exactly.
 * These are the single source of truth for the shape of data coming
 * out of Supabase in the application layer.
 *
 * IMPORTANT: Keep these in sync with supabase/migrations/001_init.sql.
 * If you add a column to the DB, add it here too.
 */

// ---------------------------------------------------------------------------
// Primitive aliases
// ---------------------------------------------------------------------------

/**
 * All money amounts are stored as whole-number bigints in Indonesian Rupiah.
 * Supabase returns bigint columns as `number` in JavaScript (safe up to 2^53).
 */
export type Rupiah = number;

// ---------------------------------------------------------------------------
// Enum-style union types (must match SQL CHECK constraints exactly)
// ---------------------------------------------------------------------------

/** The eight spending categories allowed by the `expenses.category` column. */
export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'bills'
  | 'health'
  | 'education'
  | 'other';

/** The three rating values allowed by the `expenses.rating` column. */
export type ExpenseRating = 'worth_it' | 'meh' | 'regret';

// ---------------------------------------------------------------------------
// Row types (one interface per table)
// ---------------------------------------------------------------------------

/**
 * Matches a row in `public.profiles`.
 *
 * `id` is a UUID that matches `auth.users.id` exactly.
 * Nullable fields reflect columns that are optional in the DB.
 */
export interface Profile {
  id: string;
  display_name: string | null;
  /** Monthly income in whole Rupiah. null until the user sets it. */
  monthly_income: Rupiah | null;
  /** Day of month (1–31) the user gets paid. null until set. */
  payday_day: number | null;
  created_at: string; // ISO 8601 timestamp string from Supabase
}

/**
 * Matches a row in `public.expenses`.
 *
 * `user_id` is always set (NOT NULL in DB), so it is always a string here.
 * `rating` and `rated_at` are null until the user rates the expense.
 */
export interface Expense {
  id: string;
  user_id: string;
  amount: Rupiah;
  note: string | null;
  category: ExpenseCategory;
  spent_at: string; // ISO 8601 timestamp string
  rating: ExpenseRating | null;
  rated_at: string | null; // ISO 8601 timestamp string or null (set by DB trigger)
  created_at: string; // ISO 8601 timestamp string
}

// ---------------------------------------------------------------------------
// Input types (used by data-layer functions)
// ---------------------------------------------------------------------------

/**
 * Fields the caller must/can provide when adding a new expense.
 *
 * NOTE: `user_id` is intentionally omitted — the database column DEFAULT
 * `auth.uid()` fills it automatically, and the RLS WITH CHECK policy
 * enforces that no one can insert for another user.
 */
export interface AddExpenseInput {
  amount: Rupiah;
  category: ExpenseCategory;
  note?: string;
  /** ISO 8601 string. Defaults to now() in DB if omitted. */
  spent_at?: string;
}

/**
 * Fields that can be changed when editing an existing expense.
 *
 * `user_id` is excluded to prevent re-assignment attacks.
 * All fields are optional — only the ones provided will be updated.
 */
export type UpdateExpenseInput = Partial<
  Pick<Expense, 'amount' | 'category' | 'note' | 'spent_at'>
>;

/**
 * Fields the caller can update on a profile.
 *
 * `id` and `created_at` are immutable; `user_id` does not exist on profiles.
 */
export type UpdateProfileInput = Partial<
  Pick<Profile, 'display_name' | 'monthly_income' | 'payday_day'>
>;

// ---------------------------------------------------------------------------
// Result wrapper
// ---------------------------------------------------------------------------

/**
 * Every data-layer function returns a DbResult<T>.
 *
 * This is a discriminated union so call sites can pattern-match:
 *
 *   const result = await getProfile();
 *   if (result.error) {
 *     // result.data is null here
 *     console.error(result.error);
 *     return;
 *   }
 *   // result.data is Profile here — TypeScript knows it's non-null
 *   console.log(result.data.display_name);
 *
 * Keeping errors as plain strings (not Error objects) makes them safe to
 * pass across Server Action boundaries.
 */
export type DbResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };
