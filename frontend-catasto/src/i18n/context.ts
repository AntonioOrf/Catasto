import { createContext } from "react";
import type { Lang } from "./language";

export interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Locale Intl della lingua attiva ("it-IT" / "en-GB"). */
  locale: string;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
