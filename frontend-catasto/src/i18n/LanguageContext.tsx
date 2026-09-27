import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getLang, storeLang, LOCALES, type Lang } from "./language";
import { LanguageContext } from "./context";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getLang);
  const queryClient = useQueryClient();

  useEffect(() => {
    storeLang(lang);
  }, [lang]);

  const setLang = useCallback(
    (next: Lang) => {
      if (next === getLang()) return;
      // Prima dello stato: le richieste rilanciate devono già portare la nuova lingua.
      storeLang(next);
      setLangState(next);
      // Le etichette delle tabelle di lookup (mestieri, casa, ...) arrivano
      // tradotte dal backend: i dati in cache sono nella lingua precedente.
      queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const value = useMemo(() => ({ lang, setLang, locale: LOCALES[lang] }), [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

