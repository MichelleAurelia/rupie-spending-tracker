/**
 * Root layout — sets up font, theme, language, and global toolbar.
 *
 * Theme handling (no flash):
 *   1. We inject an inline <script> BEFORE React hydrates.
 *   2. That script checks the "rupie-theme" cookie.
 *      - If a cookie exists → use it.
 *      - If no cookie → check prefers-color-scheme → use system preference.
 *   3. It sets data-theme="light" or "dark" on <html> immediately.
 *   4. The ThemeToggle client component reads data-theme on mount.
 *
 * Language:
 *   - getLocale() reads the "rupie-lang" cookie (default: "id").
 *   - The <html lang> attribute is set accordingly.
 */
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { getLocale } from "@/lib/i18n/dictionaries";
import ThemeToggle from "@/components/ThemeToggle";
import LangToggle from "@/components/LangToggle";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rupie — Spending Tracker",
  description: "Track your daily spending with Rupie. Built for Gen Z in Indonesia.",
};

export const instant = false;

/**
 * Inline script that runs before paint to set the correct theme.
 * This prevents a flash of the wrong theme on first load.
 *
 * How it works:
 *   - Reads the "rupie-theme" cookie
 *   - If no cookie: checks window.matchMedia for system preference
 *   - Sets data-theme on <html> immediately
 */
const themeScript = `
(function(){
  try {
    var m = document.cookie.match(/rupie-theme=(light|dark)/);
    var t = m ? m[1] : (window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', t);
  } catch(e) {}
})();
`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Read locale on the server so we can set <html lang>
  const locale = await getLocale();

  // Read theme cookie (for the initial data-theme attribute as a fallback;
  // the inline script above handles the actual no-flash logic)
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("rupie-theme")?.value;
  // If no cookie, we don't set a data-theme — the inline script will handle it
  const initialTheme = themeCookie === "dark" || themeCookie === "light" ? themeCookie : undefined;

  return (
    <html
      lang={locale}
      className={`${plusJakarta.variable} h-full antialiased`}
      // Set data-theme if cookie exists; otherwise the script sets it
      {...(initialTheme ? { "data-theme": initialTheme } : {})}
      suppressHydrationWarning
    >
      <head>
        {/* Inline theme script — runs before paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        {/* ── Floating toolbar (theme + lang toggles) ── */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <LangToggle currentLocale={locale} />
          <ThemeToggle />
        </div>

        {children}
      </body>
    </html>
  );
}
