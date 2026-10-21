/**
 * i18n utilities — dictionary-based, no heavy library.
 *
 * How it works:
 * - We keep two JSON files (en.json, id.json) with all UI strings.
 * - getLocale() reads the "rupie-lang" cookie; defaults to "id" (Indonesian).
 * - getDictionary() dynamically imports the right JSON file.
 *
 * This runs on the server only — the JSON never bloats the client bundle.
 */
import "server-only";

import type en from "./en.json";

// The Dictionary type is inferred from the English file shape
export type Dictionary = typeof en;
export type Locale = "en" | "id";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./en.json").then((m) => m.default),
  id: () => import("./id.json").then((m) => m.default),
};

/** Check if a string is a supported locale */
export function isLocale(value: string): value is Locale {
  return value === "en" || value === "id";
}

/** Read the current locale from cookies. Defaults to "id". */
export async function getLocale(): Promise<Locale> {
  // Dynamic import so this file stays server-only
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const raw = cookieStore.get("rupie-lang")?.value;
  return raw && isLocale(raw) ? raw : "id";
}

/** Load the dictionary for the given (or current) locale */
export async function getDictionary(locale?: Locale): Promise<Dictionary> {
  const lang = locale ?? (await getLocale());
  return dictionaries[lang]();
}
