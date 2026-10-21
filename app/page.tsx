/**
 * Home page — protected, server-rendered.
 *
 * Security: even though the proxy redirects unauthenticated users,
 * this page ALSO checks getUser() server-side. This is a defense-in-depth
 * pattern — if someone bypasses the proxy, they still can't see this page.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import Card from "@/components/Card";
import LogoutButton from "./logout-button";

export default async function HomePage() {
  // ── Auth check (defense-in-depth) ──
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ── Load translations ──
  const dict = await getDictionary();
  const t = dict.home;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center" glass>
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-primary-500 mb-2">
            {dict.app.name}
          </h1>
          <p className="text-xl font-semibold text-text">
            {t.greeting}{" "}
            <span className="text-primary-400">{user.email}</span>
          </p>
          <p className="text-text-muted mt-1">{t.subtitle}</p>
        </div>

        {/* Placeholder for future dashboard */}
        <div className="rounded-[var(--radius-input)] bg-surface-raised border border-border/50 py-10 px-6 mb-6">
          <p className="text-5xl mb-3">💰</p>
          <p className="text-text-muted">{t.placeholder}</p>
        </div>

        {/* Logout */}
        <LogoutButton label={t.logout} />
      </Card>
    </div>
  );
}
