import { createHmac, timingSafeEqual } from "node:crypto";
import { HttpError } from "./validation.js";

/** Le sole decisioni che un link nell'email può prendere. */
export const AZIONI_LINK = ["accettata", "respinta"] as const;
export type AzioneLink = (typeof AZIONI_LINK)[number];

const TTL_GIORNI = 14;

const secret = (): string | null => process.env.MODERAZIONE_SECRET || null;

const firma = (payload: string, key: string) =>
  createHmac("sha256", key).update(payload).digest("base64url");

/**
 * Token dei link "Accetta" / "Respingi" inviati alla redazione: id, azione e
 * scadenza firmati con MODERAZIONE_SECRET. Chi ha il link può prendere quella
 * sola decisione su quella sola segnalazione, e solo finché non scade.
 */
export const ModerazioneToken = {
  isConfigured(): boolean {
    return secret() !== null;
  },

  sign(id: number, azione: AzioneLink, now = Date.now()): string {
    const key = secret();
    if (!key) throw new Error("MODERAZIONE_SECRET non configurato");
    const exp = Math.floor(now / 1000) + TTL_GIORNI * 24 * 60 * 60;
    const payload = `${id}.${azione}.${exp}`;
    return `${payload}.${firma(payload, key)}`;
  },

  verify(token: unknown, now = Date.now()): { id: number; azione: AzioneLink } {
    const key = secret();
    if (!key) throw new HttpError(403, "Moderazione via link non configurata");

    const match = typeof token === "string" && /^(\d{1,10})\.([a-z]+)\.(\d{1,12})\.([\w-]{43})$/.exec(token);
    if (!match) throw new HttpError(400, "Link di moderazione non valido");

    const [, id, azione, exp, sig] = match;
    const atteso = Buffer.from(firma(`${id}.${azione}.${exp}`, key));
    const ricevuto = Buffer.from(sig);
    if (atteso.length !== ricevuto.length || !timingSafeEqual(atteso, ricevuto)) {
      throw new HttpError(400, "Link di moderazione non valido");
    }
    if (!(AZIONI_LINK as readonly string[]).includes(azione)) {
      throw new HttpError(400, "Link di moderazione non valido");
    }
    if (Number(exp) * 1000 < now) {
      throw new HttpError(410, "Link scaduto: modera la segnalazione dall'area di moderazione");
    }

    return { id: Number(id), azione: azione as AzioneLink };
  },
};
