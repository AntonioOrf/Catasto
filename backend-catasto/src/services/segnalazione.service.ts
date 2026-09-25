import { createHash } from "node:crypto";
import { SegnalazioneModel } from "../models/segnalazione.model.js";
import { ValidationError } from "../utils/validation.js";
import type { SegnalazioneInput, Segnalazione, StatoSegnalazione } from "@catasto/shared";

/** Finestra e soglia del limite applicativo (il rate limit HTTP è la prima barriera). */
const ABUSE_WINDOW_MINUTES = 60;
const ABUSE_MAX_PER_WINDOW = 10;

export class SegnalazioneService {
  /**
   * L'IP non viene mai persistito in chiaro: serve solo a correlare invii dello
   * stesso mittente. Senza SEGNALAZIONI_SALT l'hash sarebbe una rainbow table
   * dello spazio IPv4, quindi in produzione il salt è obbligatorio.
   */
  static hashIp(ip: string | undefined): string | null {
    if (!ip) return null;

    const salt = process.env.SEGNALAZIONI_SALT;
    if (!salt) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("SEGNALAZIONI_SALT non configurato");
      }
      return createHash("sha256").update(`dev:${ip}`).digest("hex");
    }

    return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
  }

  static async create(input: SegnalazioneInput, ip: string | undefined): Promise<number> {
    // Honeypot: un campo invisibile all'utente e compilato dai bot. Rispondiamo
    // come se fosse andata a buon fine, senza scrivere nulla.
    if (input.website && input.website.trim() !== "") {
      return -1;
    }

    if (input.id_fuoco !== null) {
      const exists = await SegnalazioneModel.fuocoExists(input.id_fuoco);
      if (!exists) {
        throw new ValidationError(`Il fuoco ${input.id_fuoco} non esiste`);
      }
    }

    const ipHash = this.hashIp(ip);
    if (ipHash) {
      const recent = await SegnalazioneModel.countRecentByIp(ipHash, ABUSE_WINDOW_MINUTES);
      if (recent >= ABUSE_MAX_PER_WINDOW) {
        const error = new ValidationError(
          "Troppe segnalazioni inviate di recente. Riprova più tardi.",
        );
        error.status = 429;
        throw error;
      }
    }

    return await SegnalazioneModel.create({
      id_fuoco: input.id_fuoco,
      tipo: input.tipo,
      campo: input.campo ?? null,
      valore_attuale: input.valore_attuale ?? null,
      valore_proposto: input.valore_proposto ?? null,
      note: input.note ?? null,
      email: input.email ?? null,
      ip_hash: ipHash,
    });
  }

  static async list(
    stato: StatoSegnalazione | undefined,
    page: number,
    limit: number,
  ): Promise<Segnalazione[]> {
    return await SegnalazioneModel.findAll(stato, limit, (page - 1) * limit);
  }

  /**
   * Cambio di stato con effetto sui dati pubblicati: accettare una segnalazione
   * di tipo `segnatura` pubblica il valore proposto sulla scheda del fuoco,
   * revocarla lo ritira. È l'unico percorso di scrittura su fuoco_segnature.
   */
  static async updateStato(id: number, stato: StatoSegnalazione): Promise<Segnalazione> {
    const segnalazione = await SegnalazioneModel.findById(id);
    if (!segnalazione) {
      const error = new ValidationError(`Segnalazione ${id} non trovata`);
      error.status = 404;
      throw error;
    }

    const publishesSegnatura = segnalazione.tipo === "segnatura" && segnalazione.id_fuoco;

    // Validazione prima di qualunque scrittura: altrimenti la segnalazione
    // resterebbe "accettata" senza che la segnatura sia pubblicata.
    if (publishesSegnatura && stato === "accettata" && !segnalazione.valore_proposto) {
      throw new ValidationError("Impossibile accettare una segnatura senza valore proposto");
    }

    await SegnalazioneModel.updateStato(id, stato);

    if (publishesSegnatura && segnalazione.id_fuoco) {
      if (stato === "accettata" && segnalazione.valore_proposto) {
        await SegnalazioneModel.upsertSegnatura(
          segnalazione.id_fuoco,
          segnalazione.valore_proposto,
          id,
        );
      } else if (segnalazione.stato === "accettata") {
        // Era pubblicata e non lo è più: ritiriamo il dato dalla scheda.
        await SegnalazioneModel.deleteSegnatura(segnalazione.id_fuoco);
      }
    }

    return { ...segnalazione, stato };
  }
}
