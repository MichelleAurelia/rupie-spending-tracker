/**
 * Supabase client for Client Components ("use client").
 *
 * createBrowserClient reads/writes the auth cookies automatically
 * so you don't need to pass any cookie helpers here.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
