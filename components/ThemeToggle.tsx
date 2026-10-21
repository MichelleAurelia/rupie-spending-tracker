/**
 * Theme toggle — light ☀️ / dark 🌙
 *
 * On first visit (no cookie), it follows the system's prefers-color-scheme.
 * Only saves a "rupie-theme" cookie after the user explicitly toggles.
 * This avoids a flash of wrong theme because:
 *   1. The root layout injects a tiny <script> that sets data-theme
 *      before React hydrates (see layout.tsx).
 *   2. This component syncs with that attribute on mount.
 */
"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(() => {
    callback();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): boolean {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

function getServerSnapshot(): boolean | null {
  return null;
}

export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const next = !isDark;

    // Update DOM attribute
    document.documentElement.setAttribute(
      "data-theme",
      next ? "dark" : "light"
    );

    // Save cookie only after explicit toggle
    document.cookie = `rupie-theme=${next ? "dark" : "light"};path=/;max-age=31536000;SameSite=Lax`;
  }

  // Don't render until client has hydrated and read DOM theme
  if (dark === null) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="
        flex items-center justify-center w-9 h-9
        rounded-full bg-surface-raised border border-border
        text-text-muted hover:text-text
        transition-all duration-200
        hover:scale-110 active:scale-95
        cursor-pointer
      "
    >
      {dark ? (
        /* Sun icon */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        /* Moon icon */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  );
}
