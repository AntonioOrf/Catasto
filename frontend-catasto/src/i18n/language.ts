export type Lang = "it" | "en";

export const LANGS: readonly Lang[] = ["it", "en"];

const STORAGE_KEY = "lang";

// Come per il tema: localStorage può lanciare (storage bloccato, alcune
// modalità private) e qui gira durante il primo render.
const readStoredLang = (): Lang | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "it" || stored === "en" ? stored : null;
  } catch {
    return null;
  }
};

/** Il sito nasce in italiano: l'inglese solo se scelto o se il browser non è italiano. */
const browserLang = (): Lang =>
  typeof navigator !== "undefined" && navigator.language && !navigator.language.toLowerCase().startsWith("it")
    ? "en"
    : "it";

let current: Lang = typeof window === "undefined" ? "it" : readStoredLang() ?? browserLang();

/**
 * Lingua attiva fuori da React (client API, funzioni pure): il provider la
 * tiene allineata allo stato, così non serve passarla a ogni chiamata.
 */
export const getLang = (): Lang => current;

export function storeLang(lang: Lang): void {
  current = lang;
  document.documentElement.lang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // preferenza non persistita: la lingua resta valida per la sessione
  }
}

/** Locale per Intl/toLocaleString. */
export const LOCALES: Record<Lang, string> = { it: "it-IT", en: "en-GB" };
