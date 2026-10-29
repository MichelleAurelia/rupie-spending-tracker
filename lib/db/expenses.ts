/**
 * lib/db/expenses.ts
 *
 * Data-layer functions for the `public.expenses` table.
 *
 * Rules:
 *   - `server-only` prevents this module from ever being imported in
 *     Client Components.
 *   - All functions use the anon-key server client — never a service role key.
 *   - RLS on the database is the authoritative guard; auth checks here are
 *     defense-in-depth only.
 *   - `user_id` is never accepted as a function argument — the DB column
 *     default `auth.uid()` fills it, and the RLS WITH CHECK policy ensures
 *     it matches the caller's identity.
 *   - Every function returns DbResult<T> — never throws.
 */
import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type {
  AddExpenseInput,
  DbResult,
  Expense,
  ExpenseRating,
  UpdateExpenseInput,
} from './types';

// ---------------------------------------------------------------------------
// listExpenses
// ---------------------------------------------------------------------------

/**
 * Returns all expenses for the current user, ordered newest-first.
 *
 * Optionally filter by a date range on `spent_at`:
 *   - `from` — ISO 8601 string, inclusive lower bound
 *   - `to`   — ISO 8601 string, inclusive upper bound
 *
 * Example (all expenses in October 2025, WIB):
 *   listExpenses({ from: '2025-10-01T00:00:00+07:00', to: '2025-10-31T23:59:59+07:00' })
 */
export async function listExpenses(opts?: {
  from?: string;
  to?: string;
}): Promise<DbResult<Expense[]>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: 'Not authenticated.' };
  }

  // Start building the query. RLS enforces user_id automatically.
  let query = supabase
    .from('expenses')
    .select('*')
    .order('spent_at', { ascending: false });

  // Apply optional date range filters on spent_at.
  if (opts?.from) {
    // gte = "greater than or equal to"
    query = query.gte('spent_at', opts.from);
  }
  if (opts?.to) {
    // lte = "less than or equal to"
    query = query.lte('spent_at', opts.to);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as Expense[], error: null };
}

// ---------------------------------------------------------------------------
// addExpense
// ---------------------------------------------------------------------------

/**
 * Inserts a new expense row for the current user.
 *
 * The database column `user_id` defaults to `auth.uid()`, so this function
 * does NOT accept `user_id` — it is filled automatically by the database.
 * The RLS WITH CHECK policy additionally enforces this at the DB level.
 *
 * Returns the newly created expense row on success.
 */
export async function addExpense(
  input: AddExpenseInput,
): Promise<DbResult<Expense>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: 'Not authenticated.' };
  }

  // Do NOT include user_id here — the DB default (auth.uid()) handles it.
  const payload: Record<string, unknown> = {
    amount: input.amount,
    category: input.category,
  };

  // Only include optional fields if the caller actually provided them.
  if (input.note !== undefined) payload.note = input.note;
  if (input.spent_at !== undefined) payload.spent_at = input.spent_at;

  const { data, error } = await supabase
    .from('expenses')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Expense, error: null };
}

// ---------------------------------------------------------------------------
// updateExpense
// ---------------------------------------------------------------------------

/**
 * Updates writable fields on an expense the current user owns.
 *
 * `user_id` is excluded from `UpdateExpenseInput` to prevent re-assignment.
 * The RLS WITH CHECK policy provides a second layer of enforcement.
 *
 * @param id      - UUID of the expense to update.
 * @param updates - Fields to change (only provided fields are updated).
 */
export async function updateExpense(
  id: string,
  updates: UpdateExpenseInput,
): Promise<DbResult<Expense>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: 'Not authenticated.' };
  }

  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    // RLS already restricts by user_id; the .eq('id', id) narrows to this row.
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Expense, error: null };
}

// ---------------------------------------------------------------------------
// deleteExpense
// ---------------------------------------------------------------------------

/**
 * Deletes an expense owned by the current user.
 *
 * RLS ensures only the row owner can delete it — passing someone else's id
 * will silently match zero rows (not an error, but nothing is deleted).
 *
 * Returns the deleted row's id on success so the caller can remove it from
 * local state without an extra fetch.
 */
export async function deleteExpense(
  id: string,
): Promise<DbResult<{ id: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: 'Not authenticated.' };
  }

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: { id }, error: null };
}

// ---------------------------------------------------------------------------
// rateExpense
// ---------------------------------------------------------------------------

/**
 * Sets (or updates) the rating on an expense the current user owns.
 *
 * `rated_at` is set to now() or cleared to null automatically by the
 * database trigger (`on_expense_rating_change`), so we only send `rating`.
 *
 * @param id     - UUID of the expense to rate.
 * @param rating - One of: 'worth_it' | 'meh' | 'regret'
 */
export async function rateExpense(
  id: string,
  rating: ExpenseRating,
): Promise<DbResult<Expense>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: 'Not authenticated.' };
  }

  const { data, error } = await supabase
    .from('expenses')
    .update({ rating })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Expense, error: null };
}
