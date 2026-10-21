/**
 * proxy.ts — Next.js 16 route protection (replaces middleware.ts).
 *
 * Runs before every matched request:
 *   1. Refreshes the Supabase auth session (updates cookies).
 *   2. If NOT logged in + trying to access a protected page → redirect to /login.
 *   3. If logged in + trying to access /login or /signup → redirect to /.
 *
 * The matcher skips static files, images, and favicon.
 */
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Pages that don't require authentication
const publicPaths = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublicPath = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Not logged in → redirect to /login (unless already on a public page)
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in → redirect away from login/signup
  if (user && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Otherwise, pass through (with refreshed cookies)
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - files with extensions (e.g. .png, .svg)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
