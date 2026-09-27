import { useMutation } from "@tanstack/react-query";
import type { SegnalazioneInput } from "@catasto/shared";
import { apiRequest } from "../../../api/client";
import { translate } from "../../../i18n/messages";
import { createSegnalazioneMessages as messages } from "./create-segnalazione.messages";

export const createSegnalazione = (input: SegnalazioneInput, signal?: AbortSignal) =>
  apiRequest<{ id: number | null }>("/api/segnalazioni", translate(messages, "sendFailed"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

export const useCreateSegnalazione = () =>
  useMutation({
    mutationFn: (input: SegnalazioneInput) => createSegnalazione(input),
    // Nessuna invalidazione di cache: la segnalazione non cambia i dati
    // mostrati finché la redazione non la accetta.
    retry: false,
  });
