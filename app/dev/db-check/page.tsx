/**
 * app/dev/db-check/page.tsx
 *
 * TEMPORARY DEV PAGE — verifies that the database layer (lib/db/) works
 * end-to-end for the logged-in user.
 *
 * TODO: DELETE THIS FILE (and the entire app/dev/ directory) after
 *       Stage 3 is complete.
 *
 * What it shows:
 *   • The current user's profile row from `public.profiles`
 *   • A button to add a test expense (calls addTestExpenseAction)
 *   • A list of all the user's expenses with per-row delete buttons
 *
 * PRODUCTION GUARD:
 *   The very first thing this page does is call notFound() when
 *   NODE_ENV === 'production'. This means the route simply returns a 404
 *   in production — no data is ever fetched or rendered.
 *   The Server Actions in ./actions.ts have the same guard.
 */

import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/db/profiles';
import { listExpenses } from '@/lib/db/expenses';
import {
  addTestExpenseAction,
  deleteExpenseAction,
} from './actions';
import type { Expense } from '@/lib/db/types';

// ---------------------------------------------------------------------------
// Category emoji map — purely cosmetic for the dev view
// ---------------------------------------------------------------------------
const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍜',
  transport: '🚌',
  shopping: '🛒',
  entertainment: '🎮',
  bills: '🧾',
  health: '💊',
  education: '📚',
  other: '📦',
};

// ---------------------------------------------------------------------------
// Sub-component: a single expense row with a delete button
// ---------------------------------------------------------------------------
function ExpenseRow({ expense }: { expense: Expense }) {
  const emoji = CATEGORY_EMOJI[expense.category] ?? '📦';
  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(expense.amount);

  const formattedDate = new Date(expense.spent_at).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Wrapper that satisfies the `action: (formData: FormData) => Promise<void>` type.
  async function handleDelete(): Promise<void> {
    'use server';
    await deleteExpenseAction(expense.id);
  }

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px',
        border: '1px solid #333',
        borderRadius: '8px',
        marginBottom: '8px',
        background: '#1a1a1a',
      }}
    >
      <span style={{ fontSize: '1.5rem' }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: '#4ade80' }}>{formattedAmount}</div>
        <div style={{ fontSize: '0.85rem', color: '#888' }}>
          {expense.category} · {formattedDate}
        </div>
        {expense.note && (
          <div style={{ fontSize: '0.85rem', color: '#ccc', marginTop: '2px' }}>
            {expense.note}
          </div>
        )}
        {expense.rating && (
          <div style={{ fontSize: '0.75rem', color: '#a78bfa', marginTop: '4px' }}>
            Rated: {expense.rating}
            {expense.rated_at
              ? ` · ${new Date(expense.rated_at).toLocaleString('id-ID')}`
              : ''}
          </div>
        )}
        <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '4px' }}>
          id: {expense.id}
        </div>
      </div>
      {/* Delete button — calls handleDelete server action with this row's id */}
      <form action={handleDelete}>
        <button
          type="submit"
          style={{
            background: '#7f1d1d',
            color: '#fca5a5',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 10px',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          Delete
        </button>
      </form>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function DbCheckPage() {
  // ── PRODUCTION GUARD ──────────────────────────────────────────────────────
  // Returns a 404 immediately in production. Nothing below runs.
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  // ── Auth check ────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // ── Fetch data ────────────────────────────────────────────────────────────
  const [profileResult, expensesResult] = await Promise.all([
    getProfile(),
    listExpenses(),
  ]);

  // Narrow the expenses result for rendering — data is null when error is set.
  const expenses: Expense[] = expensesResult.error ? [] : (expensesResult.data ?? []);

  return (
    <div
      style={{
        fontFamily: 'monospace',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '32px 16px',
        color: '#e5e7eb',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: '#78350f',
          color: '#fde68a',
          padding: '10px 16px',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '0.85rem',
        }}
      >
        ⚠️ <strong>DEV ONLY</strong> — This page returns 404 in production.
        Delete <code>app/dev/</code> after Stage 3.
      </div>

      <h1 style={{ fontSize: '1.5rem', marginBottom: '24px', color: '#4ade80' }}>
        🗄️ DB Check — /dev/db-check
      </h1>

      {/* ── Auth user ── */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '8px' }}>
          🔐 Authenticated as
        </h2>
        <pre
          style={{
            background: '#111',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            overflow: 'auto',
            color: '#86efac',
          }}
        >
          {JSON.stringify({ id: user.id, email: user.email }, null, 2)}
        </pre>
      </section>

      {/* ── Profile ── */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '8px' }}>
          👤 Profile row (public.profiles)
        </h2>
        {profileResult.error ? (
          <p style={{ color: '#f87171' }}>❌ Error: {profileResult.error}</p>
        ) : (
          <pre
            style={{
              background: '#111',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              overflow: 'auto',
              color: '#86efac',
            }}
          >
            {JSON.stringify(profileResult.data, null, 2)}
          </pre>
        )}
      </section>

      {/* ── Add test expense ── */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '8px' }}>
          ➕ Add Test Expense
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '12px' }}>
          Inserts: Rp 25,000 · category: food · note: &quot;Dev test expense&quot;
        </p>
        <form action={async () => { 'use server'; await addTestExpenseAction(); }}>
          <button
            id="add-test-expense-btn"
            type="submit"
            style={{
              background: '#166534',
              color: '#86efac',
              border: '1px solid #4ade80',
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontFamily: 'monospace',
            }}
          >
            + Add Test Expense (Rp 25,000)
          </button>
        </form>
        {expensesResult.error && (
          <p style={{ color: '#f87171', marginTop: '8px' }}>
            ❌ Expenses error: {expensesResult.error}
          </p>
        )}
      </section>

      {/* ── Expense list ── */}
      <section>
        <h2 style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '8px' }}>
          📋 Expenses (public.expenses) — {expenses.length} rows
        </h2>

        {expenses.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
            {expensesResult.error
              ? `Error loading expenses: ${expensesResult.error}`
              : 'No expenses yet. Click "Add Test Expense" above.'}
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {expenses.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
