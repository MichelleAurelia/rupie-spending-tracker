/**
 * Supabase client for the Next.js 16 proxy (formerly middleware).
 *
 * In the proxy we don't have access to next/headers cookies() — instead
 * we read cookies from the incoming NextRequest and write them onto
 * the NextResponse so the browser receives refreshed auth tokens.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Start with a "pass-through" response
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 1. Set cookies on the request (so downstream code sees them)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // 2. Recreate the response so it carries the updated request
          supabaseResponse = NextResponse.next({ request });
          // 3. Set cookies on the response (so the browser receives them)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Don't add code between createServerClient and getUser().
  // A subtle bug could cause random session logouts.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, supabaseResponse };
}
