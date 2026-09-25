import { useMutation } from "@tanstack/react-query";
import type { SegnalazioneInput } from "@catasto/shared";
import { API_URL } from "../../../api/client";

export const createSegnalazione = async (
  input: SegnalazioneInput,
  signal?: AbortSignal,
): Promise<{ id: number | null }> => {
  const response = await fetch(`${API_URL}/api/segnalazioni`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

  if (!response.ok) {
    let message =
      response.status === 429
        ? "Hai inviato troppe segnalazioni. Riprova più tardi."
        : "Invio non riuscito. Riprova.";
    try {
      const body = await response.json();
      if (body.error) message = body.error;
    } catch {
      // body non JSON: resta il messaggio per stato HTTP
    }
    throw new Error(message);
  }

  return await response.json();
};

export const useCreateSegnalazione = () =>
  useMutation({
    mutationFn: (input: SegnalazioneInput) => createSegnalazione(input),
    // Nessuna invalidazione di cache: la segnalazione non cambia i dati
    // mostrati finché la redazione non la accetta.
    retry: false,
  });
