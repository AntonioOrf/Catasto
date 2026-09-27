import { getLang, type Lang } from "../i18n/language";
import { translate } from "../i18n/messages";
import { clientMessages as messages } from "./client.messages";

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "" : "http://localhost:3005");

/**
 * Errore già tradotto per l'utente. Un fetch fallito per rete lancia invece
 * TypeError("Failed to fetch"): tecnico e in inglese, va sostituito.
 */
export const userMessage = (error: unknown, fallback: string, lang: Lang = getLang()): string => {
  if (error instanceof TypeError || !(error instanceof Error) || !error.message) {
    return translate(messages, "serverUnreachable", undefined, lang);
  }
  return error.message || fallback;
};

/**
 * Unico punto di accesso all'API: su risposta non 2xx usa il messaggio
 * `error` del backend (i 4xx sono scritti per l'utente) o il fallback dato.
 */
export async function apiRequest<T>(
  path: string,
  fallbackError: string,
  init?: RequestInit,
): Promise<T> {
  // Le etichette delle tabelle di lookup (mestieri, casa, ...) il backend le
  // traduce se chiesto; l'italiano è il default e non serve dichiararlo.
  const lang = getLang();
  const url = lang === "it" ? path : `${path}${path.includes("?") ? "&" : "?"}lang=${lang}`;
  const response = await fetch(`${API_URL}${url}`, init);

  if (!response.ok) {
    let message = translate(messages, "withStatus", { message: fallbackError, status: response.status }, lang);
    try {
      const body = await response.json();
      // Nei 5xx il backend in produzione risponde con un generico
      // "Internal Server Error": meglio il nostro testo tradotto.
      if (body?.error && response.status < 500) message = body.error;
    } catch {
      // il body non è JSON: teniamo il messaggio generico
    }
    throw new Error(message);
  }

  // Un 200 non JSON è quasi sempre l'index.html servito al posto dell'API
  // (es. deploy senza VITE_API_URL): il SyntaxError del parse non va mostrato.
  try {
    return (await response.json()) as T;
  } catch (error) {
    // l'annullamento della richiesta resta tale: lo gestisce TanStack Query
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new Error(translate(messages, "invalidResponse", { message: fallbackError }, lang));
  }
}
