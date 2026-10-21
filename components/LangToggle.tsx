/**
 * Language toggle — switches between ID 🇮🇩 and EN 🇬🇧
 *
 * Sets the "rupie-lang" cookie and reloads the page so the
 * server re-renders with the new dictionary.
 */
"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/dictionaries";

interface LangToggleProps {
  currentLocale: Locale;
}

export default function LangToggle({ currentLocale }: LangToggleProps) {
  const router = useRouter();

  function toggle() {
    const next: Locale = currentLocale === "id" ? "en" : "id";

    // Save cookie (1 year)
    document.cookie = `rupie-lang=${next};path=/;max-age=31536000;SameSite=Lax`;

    // Refresh the page so the server loads the new dictionary
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${currentLocale === "id" ? "English" : "Indonesian"}`}
      className="
        flex items-center justify-center gap-1.5
        h-9 px-3
        rounded-full bg-surface-raised border border-border
        text-sm font-medium text-text-muted hover:text-text
        transition-all duration-200
        hover:scale-105 active:scale-95
        cursor-pointer
      "
    >
      <span>{currentLocale === "id" ? "🇮🇩" : "🇬🇧"}</span>
      <span className="uppercase">{currentLocale}</span>
    </button>
  );
}
