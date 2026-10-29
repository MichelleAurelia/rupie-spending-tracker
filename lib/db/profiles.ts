/**
 * lib/db/profiles.ts
 *
 * Data-layer functions for the `public.profiles` table.
 *
 * Rules:
 *   - Import `server-only` so this module can never be bundled into the
 *     browser bundle (Next.js will throw a build error if it is imported
 *     from a Client Component).
 *   - All functions use the server Supabase client (anon key + session
 *     cookies). Never use a service role key here.
 *   - RLS on the database ensures users can only read/write their own row,
 *     even if a bug in this code tried to fetch someone else's profile.
 *   - Every function returns DbResult<T> — never throws.
 */
import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { DbResult, Profile, UpdateProfileInput } from './types';

// ---------------------------------------------------------------------------
// getProfile
// ---------------------------------------------------------------------------

/**
 * Fetches the profile row for the currently logged-in user.
 *
 * Returns `{ data: null, error: "..." }` when:
 *   - The user is not authenticated.
 *   - The profile row does not exist yet (shouldn't happen after the trigger
 *     runs, but handled defensively).
 *   - A Supabase/network error occurs.
 */
export async function getProfile(): Promise<DbResult<Profile>> {
  const supabase = await createClient();

  // First confirm there is a logged-in user (defense-in-depth).
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: 'Not authenticated.' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    // RLS already enforces this, but being explicit makes intent clear.
    .eq('id', user.id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Profile, error: null };
}

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------

/**
 * Updates writable fields on the current user's profile.
 *
 * Only the fields included in `updates` are changed; others stay the same.
 * Returns the updated profile row on success.
 *
 * @param updates - Partial profile fields to update. `id` and `created_at`
 *                  cannot be changed and are excluded from the input type.
 */
export async function updateProfile(
  updates: UpdateProfileInput,
): Promise<DbResult<Profile>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: 'Not authenticated.' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    // Return the full updated row so the caller doesn't need a second fetch.
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Profile, error: null };
}
