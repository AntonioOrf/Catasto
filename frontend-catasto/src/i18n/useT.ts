import { useCallback, useContext } from "react";
import { LanguageContext, type LanguageContextValue } from "./context";
import { translate, type Messages, type Vars } from "./messages";

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage va usato dentro LanguageProvider");
  return context;
}

/**
 * `const t = useT(messages)` e poi `t("chiave")` o `t("chiave", { n: 3 })`.
 * Il componente si ridisegna al cambio lingua.
 */
export function useT<K extends string>(messages: Messages<K>) {
  const { lang } = useLanguage();
  return useCallback((key: K, vars?: Vars) => translate(messages, key, vars, lang), [messages, lang]);
}
