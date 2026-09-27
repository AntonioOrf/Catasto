import { getField, TIPO_SEGNALAZIONE_LABELS, type SegnalazioneInput } from "@catasto/shared";
import { ModerazioneToken, type AzioneLink } from "../utils/moderazione-token.js";

const FORMSUBMIT_URL = "https://formsubmit.co/ajax";
const TIMEOUT_MS = 8000;

/**
 * Inoltro via email di ogni segnalazione (dato errato, segnatura della
 * portata, altro) tramite FormSubmit. È solo un avviso alla redazione: la segnalazione è già salvata
 * nel DB e resta l'unica fonte di verità per la moderazione, quindi un invio
 * fallito viene loggato ma non fa fallire la richiesta dell'utente.
 *
 * La chiamata parte dal backend e non dal browser: l'indirizzo di destinazione
 * resta fuori dal bundle del frontend, e honeypot e limiti anti-abuso valgono
 * anche per le email.
 */
export class NotificaService {
  static async invia(id: number, input: SegnalazioneInput): Promise<void> {
    // FORMSUBMIT_EMAIL può essere l'indirizzo o l'alias casuale che FormSubmit
    // fornisce dopo l'attivazione (consigliato: non espone l'email).
    const destinatario = process.env.FORMSUBMIT_EMAIL;
    if (!destinatario) return;

    // FormSubmit lega il form al dominio di provenienza (Referer/Origin): da
    // server li impostiamo esplicitamente con l'URL pubblico del portale.
    const origin = process.env.FORMSUBMIT_ORIGIN || process.env.CORS_ORIGIN?.split(",")[0]?.trim();

    const tipo = TIPO_SEGNALAZIONE_LABELS[input.tipo];
    const body: Record<string, string> = {
      _subject: `${tipo} · segnalazione #${id}`,
      _template: "table",
      Segnalazione: `#${id}`,
      Tipo: tipo,
      Fuoco: input.id_fuoco !== null ? String(input.id_fuoco) : "non indicato",
    };
    if (input.tipo === "segnatura") {
      body["Segnatura proposta"] = input.valore_proposto ?? "";
    } else {
      if (input.campo) body.Campo = getField(input.campo)?.label ?? input.campo;
      if (input.tipo === "dato_errato") body["Valore attuale"] = input.valore_attuale ?? "vuoto";
      body["Valore proposto"] = input.valore_proposto ?? "non indicato";
    }
    body.Note = input.note ?? "";
    body["Email segnalatore"] = input.email ?? "non indicata";

    // Link di moderazione: aprono una pagina di conferma sul backend, che è
    // l'unico a cambiare lo stato. FormSubmit si limita a recapitarli.
    const apiBase = (process.env.PUBLIC_API_URL || origin)?.replace(/\/$/, "");
    if (apiBase && ModerazioneToken.isConfigured()) {
      const link = (azione: AzioneLink) =>
        `${apiBase}/api/segnalazioni/moderazione?t=${ModerazioneToken.sign(id, azione)}`;
      body.Accetta = link("accettata");
      body.Respingi = link("respinta");
    }

    // Rispondendo all'email si scrive direttamente a chi ha segnalato.
    if (input.email) body._replyto = input.email;

    try {
      const res = await fetch(`${FORMSUBMIT_URL}/${encodeURIComponent(destinatario)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(origin ? { Origin: origin, Referer: `${origin.replace(/\/$/, "")}/` } : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      // FormSubmit risponde 200 anche per alcuni errori logici: conta il campo success.
      const data = (await res.json().catch(() => null)) as { success?: string | boolean; message?: string } | null;
      if (!res.ok || String(data?.success) !== "true") {
        console.warn(`⚠️  FormSubmit: invio segnalazione #${id} non riuscito (${res.status}): ${data?.message ?? "risposta inattesa"}`);
      }
    } catch (err) {
      console.warn(`⚠️  FormSubmit: invio segnalazione #${id} non riuscito: ${(err as Error).message}`);
    }
  }
}
