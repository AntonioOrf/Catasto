export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "" : "http://localhost:3005");

/**
 * Errore già tradotto per l'utente. Un fetch fallito per rete lancia invece
 * TypeError("Failed to fetch"): tecnico e in inglese, va sostituito.
 */
export const userMessage = (error: unknown, fallback: string): string => {
  if (error instanceof TypeError || !(error instanceof Error) || !error.message) {
    return "Il server non risponde. Controlla la connessione e riprova.";
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
  const response = await fetch(`${API_URL}${path}`, init);

  if (!response.ok) {
    let message = `${fallbackError} (errore ${response.status})`;
    try {
      const body = await response.json();
      // Nei 5xx il backend in produzione risponde con un generico
      // "Internal Server Error": meglio il nostro testo in italiano.
      if (body?.error && response.status < 500) message = body.error;
    } catch {
      // il body non è JSON: teniamo il messaggio generico
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}
