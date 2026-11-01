import { CERTEZZE_LUOGO, type CertezzaLuogo } from "@catasto/shared";
import { parseCsv } from "./csv.js";

/**
 * Righe della tabella `luoghi_geo` (migrazione 005) dal CSV degli
 * abbinamenti (`repetti:abbina`) o da una sua copia rivista a mano. Colonne
 * usate: id_registrazione, lat, lng, certezza; facoltative repetti_titolo o
 * nome_moderno, fonte, motivo o note, nome_serie/nome_quartiere/
 * nome_piviere/nome_popolo (per `chiave_nomi`).
 */
export interface RigaLuogoGeo {
  id_registrazione: number;
  lat: number | null;
  lng: number | null;
  certezza: CertezzaLuogo;
  nome_moderno: string | null;
  fonte: string | null;
  chiave_nomi: string | null;
  note: string | null;
}

export class ErroreCsvLuoghi extends Error {}

const testo = (v: string | undefined): string | null => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

function coordinata(v: string | undefined, min: number, max: number, riga: number, campo: string): number | null {
  const t = testo(v);
  if (t === null) return null;
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n) || n < min || n > max) throw new ErroreCsvLuoghi(`Riga ${riga}: ${campo} non valida (${t})`);
  return n;
}

/** Legge il CSV; righe senza id o con valori fuori dominio sono errori, non righe saltate. */
export function leggiCsvLuoghi(contenuto: string): RigaLuogoGeo[] {
  const [intestazione, ...righe] = parseCsv(contenuto);
  if (!intestazione) return [];
  const col = (nome: string) => intestazione.indexOf(nome);
  for (const obbligatoria of ["id_registrazione", "certezza"]) {
    if (col(obbligatoria) < 0) throw new ErroreCsvLuoghi(`Colonna mancante: ${obbligatoria}`);
  }
  const valore = (r: string[], nome: string) => (col(nome) >= 0 ? r[col(nome)] : undefined);

  return righe.map((r, i) => {
    const n = i + 2;
    const id = Number(valore(r, "id_registrazione"));
    if (!Number.isInteger(id) || id <= 0) throw new ErroreCsvLuoghi(`Riga ${n}: id_registrazione non valido`);
    const certezza = (valore(r, "certezza") ?? "").trim() as CertezzaLuogo;
    if (!CERTEZZE_LUOGO.includes(certezza)) throw new ErroreCsvLuoghi(`Riga ${n}: certezza non valida (${certezza})`);
    const lat = coordinata(valore(r, "lat"), -90, 90, n, "lat");
    const lng = coordinata(valore(r, "lng"), -180, 180, n, "lng");
    if ((lat === null) !== (lng === null)) throw new ErroreCsvLuoghi(`Riga ${n}: servono sia lat sia lng`);
    if (certezza !== "non_trovata" && lat === null) throw new ErroreCsvLuoghi(`Riga ${n}: certezza ${certezza} senza coordinate`);

    const nomi = ["nome_serie", "nome_quartiere", "nome_piviere", "nome_popolo"].map((c) => (valore(r, c) ?? "").trim());
    const repetti = testo(valore(r, "repetti_titolo"));
    return {
      id_registrazione: id,
      lat: certezza === "non_trovata" ? null : lat,
      lng: certezza === "non_trovata" ? null : lng,
      certezza,
      nome_moderno: testo(valore(r, "nome_moderno")) ?? repetti,
      fonte: testo(valore(r, "fonte")) ?? (repetti ? `Repetti: ${repetti}` : testo(valore(r, "pieve_titolo")) ? `Repetti (pieve): ${valore(r, "pieve_titolo")}` : null),
      chiave_nomi: nomi.some(Boolean) ? nomi.join("|") : null,
      note: testo(valore(r, "note")) ?? testo(valore(r, "motivo")),
    };
  });
}

const COLONNE = ["id_registrazione", "lat", "lng", "certezza", "nome_moderno", "fonte", "chiave_nomi", "note", "revisionato"] as const;

/**
 * Upsert: le righe gia' revisionate a mano (revisionato = 1) si aggiornano
 * solo da un import a sua volta revisionato.
 */
export function upsertLuoghiSql(righe: number, revisionato: boolean): string {
  const segnaposti = Array.from({ length: righe }, () => `(${COLONNE.map(() => "?").join(", ")})`).join(",\n  ");
  const aggiorna = COLONNE.filter((c) => c !== "id_registrazione")
    .map((c) => (revisionato ? `${c} = VALUES(${c})` : `${c} = IF(revisionato = 1, ${c}, VALUES(${c}))`))
    // `revisionato` per ultimo: le IF precedenti leggono il valore ancora non aggiornato.
    .sort((a, b) => Number(a.startsWith("revisionato")) - Number(b.startsWith("revisionato")));
  return `INSERT INTO luoghi_geo (${COLONNE.join(", ")}) VALUES\n  ${segnaposti}\nON DUPLICATE KEY UPDATE ${aggiorna.join(", ")}`;
}

export function parametriUpsert(righe: RigaLuogoGeo[], revisionato: boolean): unknown[] {
  return righe.flatMap((r) => [
    r.id_registrazione,
    r.lat,
    r.lng,
    r.certezza,
    r.nome_moderno,
    r.fonte,
    r.chiave_nomi,
    r.note,
    revisionato ? 1 : 0,
  ]);
}

/** Letterale SQL (per generare la migrazione 006): apici raddoppiati, nessun `;` (il runner divide sui `;`). */
function letterale(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  return `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "''").replace(/;/g, ",")}'`;
}

/** Migrazione SQL con gli abbinamenti automatici, a blocchi di `blocco` righe. */
export function migrazioneSeedSql(righe: RigaLuogoGeo[], intestazione: string, blocco = 200): string {
  const parti = [intestazione.trim(), ""];
  for (let i = 0; i < righe.length; i += blocco) {
    const pezzo = righe.slice(i, i + blocco);
    const valori = parametriUpsert(pezzo, false);
    let k = 0;
    const sql = upsertLuoghiSql(pezzo.length, false).replace(/\?/g, () => letterale(valori[k++]));
    parti.push(`${sql};`, "");
  }
  return parti.join("\n");
}
