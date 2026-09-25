import type { QueryGroup } from "@catasto/shared";

/**
 * Serializzazione dell'AST per l'URL condivisibile.
 *
 * Sta nel fragment (`#q=...`) e non in un query param: il fragment non viene
 * inviato al server, quindi la ricerca di un utente non finisce nei log di
 * accesso né nel referer verso siti esterni.
 */

const FRAGMENT_KEY = "q";

/** Oltre questa soglia l'URL rischia di essere troncato da client di posta e chat. */
export const MAX_SHARE_URL_LENGTH = 2000;

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (value: string): Uint8Array => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
};

export function encodeAst(ast: QueryGroup): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(ast)));
}

/**
 * Il payload arriva da un URL scritto da terzi: qualunque errore di formato
 * deve degradare a "nessuna query condivisa", mai propagarsi come eccezione.
 * La validazione vera resta lato server, che compila solo campi del registry.
 */
export function decodeAst(encoded: string): QueryGroup | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded)));
    if (parsed?.kind !== "group" || !Array.isArray(parsed.children)) return null;
    return parsed as QueryGroup;
  } catch {
    return null;
  }
}

export function buildShareUrl(ast: QueryGroup): string {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}#${FRAGMENT_KEY}=${encodeAst(ast)}`;
}

/** Legge l'AST dal fragment corrente, se presente e valido. */
export function readAstFromUrl(): QueryGroup | null {
  const fragment = window.location.hash.replace(/^#/, "");
  if (!fragment) return null;

  const encoded = new URLSearchParams(fragment).get(FRAGMENT_KEY);
  return encoded ? decodeAst(encoded) : null;
}

/** Rimuove il fragment senza ricaricare: l'AST condiviso è ormai nello stato dell'app. */
export function clearAstFromUrl(): void {
  const { origin, pathname, search } = window.location;
  window.history.replaceState(null, "", `${origin}${pathname}${search}`);
}
