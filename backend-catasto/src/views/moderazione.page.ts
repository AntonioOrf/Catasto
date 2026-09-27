import { getField, STATO_SEGNALAZIONE_LABELS, TIPO_SEGNALAZIONE_LABELS, type Segnalazione } from "@catasto/shared";
import type { AzioneLink } from "../utils/moderazione-token.js";

/**
 * Pagine della moderazione via link: HTML statico reso dal backend, senza
 * JavaScript, perché si aprono dall'email e non dall'applicazione React.
 */

const escape = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const layout = (title: string, body: string) => `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escape(title)} · Catasto 1427</title>
<style>
  :root { color-scheme: light dark; --bg:#f6f4ef; --card:#fff; --text:#1f2933; --muted:#5f6b76; --border:#d9d4c7; --ok:#1f7a4d; --ko:#a3312b; }
  @media (prefers-color-scheme: dark) { :root { --bg:#12161b; --card:#1b2128; --text:#e6e8eb; --muted:#9aa5b1; --border:#2e3742; --ok:#3fb27f; --ko:#e06c62; } }
  body { margin:0; background:var(--bg); color:var(--text); font:16px/1.5 system-ui, sans-serif; }
  main { max-width:560px; margin:40px auto; padding:0 16px; }
  .card { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:24px; }
  h1 { font-family:Georgia, serif; font-size:1.4rem; margin:0 0 16px; }
  dl { display:grid; grid-template-columns:max-content 1fr; gap:6px 16px; margin:0 0 24px; }
  dt { color:var(--muted); font-size:.85rem; text-transform:uppercase; letter-spacing:.04em; }
  dd { margin:0; overflow-wrap:anywhere; }
  .mono { font-family:ui-monospace, monospace; }
  button { font:inherit; font-weight:700; color:#fff; border:0; border-radius:6px; padding:12px 20px; min-height:44px; cursor:pointer; }
  .accettata { background:var(--ok); } .respinta { background:var(--ko); }
  p.muted { color:var(--muted); font-size:.9rem; }
</style>
</head>
<body><main><div class="card">${body}</div></main></body>
</html>`;

const VERBO: Record<AzioneLink, string> = { accettata: "Accetta", respinta: "Respingi" };

const dettagli = (s: Segnalazione) => `<dl>
  <dt>Segnalazione</dt><dd>#${escape(s.id)}</dd>
  <dt>Fuoco</dt><dd>${s.id_fuoco ? `${escape(s.nome_fuoco ?? "")} (id ${escape(s.id_fuoco)})` : "non indicato"}</dd>
  <dt>Tipo</dt><dd>${escape(TIPO_SEGNALAZIONE_LABELS[s.tipo])}</dd>
  ${s.campo ? `<dt>Campo</dt><dd>${escape(getField(s.campo)?.label ?? s.campo)}</dd>` : ""}
  ${s.tipo === "dato_errato" ? `<dt>Valore attuale</dt><dd>${escape(s.valore_attuale ?? "vuoto")}</dd>` : ""}
  ${s.valore_proposto ? `<dt>${s.tipo === "segnatura" ? "Segnatura" : "Valore proposto"}</dt><dd class="mono">${escape(s.valore_proposto)}</dd>` : ""}
  ${s.note ? `<dt>Note</dt><dd>${escape(s.note)}</dd>` : ""}
  ${s.email ? `<dt>Email</dt><dd>${escape(s.email)}</dd>` : ""}
  <dt>Stato</dt><dd>${escape(STATO_SEGNALAZIONE_LABELS[s.stato])}</dd>
</dl>`;

/** Cosa comporta la decisione: solo le segnature vengono pubblicate in automatico. */
const effetto = (s: Segnalazione, azione: AzioneLink): string => {
  if (s.tipo === "segnatura") {
    return azione === "accettata"
      ? "Accettando, la segnatura viene pubblicata sulla scheda del fuoco."
      : "Respingendo, la segnatura non viene pubblicata.";
  }
  return azione === "accettata"
    ? "Accettando, la segnalazione viene segnata come accettata. La correzione del dato non è automatica: va applicata a mano nella base dati."
    : "Respingendo, la segnalazione viene archiviata come respinta.";
};

export const ModerazionePage = {
  /**
   * Conferma esplicita: il GET non cambia nulla. I filtri antispam dei client
   * di posta aprono i link da soli, e non devono poter pubblicare una segnatura.
   */
  conferma(s: Segnalazione, azione: AzioneLink, token: string, daModerare: boolean): string {
    const oggetto = s.tipo === "segnatura" ? "la segnatura" : "la segnalazione";
    const azioneBody = daModerare
      ? `<form method="post">
  <input type="hidden" name="t" value="${escape(token)}">
  <button type="submit" class="${azione}">${VERBO[azione]} ${oggetto}</button>
</form>
<p class="muted">${escape(effetto(s, azione))}</p>`
      : `<p>Questa segnalazione è già stata moderata: il link non è più utilizzabile.</p>`;

    return layout(
      `${VERBO[azione]} ${oggetto}`,
      `<h1>${VERBO[azione]} ${s.tipo === "segnatura" ? "la proposta di segnatura" : "la segnalazione"}?</h1>${dettagli(s)}${azioneBody}`,
    );
  },

  esito(s: Segnalazione): string {
    const testo =
      s.tipo === "segnatura"
        ? s.stato === "accettata"
          ? "Segnatura accettata e pubblicata sulla scheda del fuoco."
          : "Segnatura respinta."
        : s.stato === "accettata"
          ? "Segnalazione accettata."
          : "Segnalazione respinta.";
    return layout("Moderazione registrata", `<h1>${escape(testo)}</h1>${dettagli(s)}`);
  },

  errore(status: number, message: string): string {
    return layout("Moderazione non riuscita", `<h1>Operazione non riuscita</h1><p>${escape(message)}</p><p class="muted">Codice ${escape(status)}</p>`);
  },
};
