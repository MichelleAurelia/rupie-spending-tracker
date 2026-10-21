/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 *
 * Uses next/headers cookies() to read/write auth cookies on the server.
 * The try/catch in setAll handles the case where this is called from
 * a Server Component (where you can't set cookies) — that's fine because
 * the proxy will refresh the session before the page renders.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore.
            // The proxy refreshes the session on every request.
          }
        },
      },
    }
  );
}
