/**
 * app/dev/db-check/actions.ts
 *
 * Server Actions for the temporary dev DB check page.
 *
 * TODO: DELETE THIS FILE after Stage 3 is complete.
 *       This page and its actions exist only to verify the database layer
 *       works end-to-end during development.
 *
 * PRODUCTION GUARD: Every action below throws immediately when
 * NODE_ENV === 'production' so they are completely inert even if somehow
 * imported outside of the dev page.
 */
'use server';

import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { addExpense, deleteExpense } from '@/lib/db/expenses';

/** Shared production guard — call at the top of every action in this file. */
function guardDev() {
  if (process.env.NODE_ENV === 'production') {
    // notFound() throws a NEXT_HTTP_ERROR_FALLBACK;404 — completely stops
    // the action and renders a 404 response. Using it here (rather than a
    // plain throw) keeps behaviour consistent with the page guard.
    notFound();
  }
}

/**
 * Adds a hard-coded test expense row for the logged-in user.
 * Used by the "Add Test Expense" button on the dev check page.
 */
export async function addTestExpenseAction(): Promise<{ error: string | null }> {
  guardDev();

  const result = await addExpense({
    amount: 25000, // Rp 25,000
    category: 'food',
    note: 'Dev test expense — created from /dev/db-check',
  });

  if (result.error) {
    return { error: result.error };
  }

  // Refresh the page data so the new expense appears in the list instantly.
  revalidatePath('/dev/db-check');
  return { error: null };
}

/**
 * Deletes the expense with the given id.
 * Used by the per-row "Delete" button on the dev check page.
 */
export async function deleteExpenseAction(
  id: string,
): Promise<{ error: string | null }> {
  guardDev();

  const result = await deleteExpense(id);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath('/dev/db-check');
  return { error: null };
}
