import { getLang, type Lang } from "./language";

/**
 * Dizionario di un'area del sito: l'inglese deve avere esattamente le chiavi
 * dell'italiano, altrimenti TypeScript segnala la traduzione mancante.
 * Ogni area (componente, pagina, libreria) tiene il suo file `*.messages.ts`
 * accanto al codice che lo usa.
 */
export type Messages<K extends string> = { it: Record<K, string>; en: Record<K, string> };

export const defineMessages = <K extends string>(messages: Messages<K>): Messages<K> => messages;

export type Vars = Record<string, string | number>;

/** Sostituisce i segnaposto `{nome}` con i valori dati. */
export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/**
 * Traduzione fuori da React (funzioni pure, messaggi d'errore dei servizi).
 * Senza `lang` usa la lingua attiva.
 */
export function translate<K extends string>(
  messages: Messages<K>,
  key: K,
  vars?: Vars,
  lang: Lang = getLang(),
): string {
  return interpolate(messages[lang][key] ?? messages.it[key], vars);
}
