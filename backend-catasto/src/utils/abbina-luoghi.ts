import { distanzaKm, normalizzaNome, variantiTitolo } from "./repetti.js";

/**
 * Abbinamento automatico fra i luoghi del catasto (`db:export-luoghi`) e i
 * luoghi del Dizionario del Repetti (`repetti:luoghi`).
 *
 * Il nome del popolo ("Pop. S. Donato a Luciana") si scompone in dedicazione
 * ("S. Donato") e località ("Luciana"); i candidati del Repetti sono le voci
 * che portano quel nome (titolo o varianti, anche "LUCIANA (S. DONATO A)").
 * Il piviere del catasto fa da vincolo: si cerca la pieve nel Repetti e si
 * scartano i candidati lontani; a parità si preferisce chi ha lo stesso
 * piviere, la stessa dedicazione e coordinate note. Il risultato è una
 * proposta con un livello di certezza, da rivedere a mano.
 */

export type Certezza = "sicura" | "approssimata" | "solo_piviere" | "non_trovata";

/** Riga di `luoghi.csv` (solo i campi usati). */
export interface LuogoCatasto {
  id_registrazione: string;
  id_serie: string;
  nome_serie: string;
  nome_quartiere: string;
  nome_piviere: string;
  nome_popolo: string;
  fuochi: string;
  avvisi?: string;
}

/** Riga di `repetti-luoghi.csv` (solo i campi usati). */
export interface VoceRepetti {
  titolo: string;
  slug: string;
  contesto: string;
  tipo: string;
  dedicazione: string;
  piviere: string;
  comunita: string;
  giurisdizione: string;
  diocesi: string;
  lat: string;
  lng: string;
  fonte_coordinate: string;
  note: string;
}

export interface Abbinamento {
  luogo: LuogoCatasto;
  /** Nome cercato nel Repetti (località o nome completo). */
  cercato: string;
  certezza: Certezza;
  lat: number | null;
  lng: number | null;
  voce: VoceRepetti | null;
  /** Voce della pieve (o della città) usata come vincolo o come ripiego. */
  pieve: VoceRepetti | null;
  distanza_pieve_km: number | null;
  candidati: { voce: VoceRepetti; punteggio: number }[];
  motivo: string;
}

/* ------------------------------------------------------------------------ */
/* Nomi del catasto                                                          */
/* ------------------------------------------------------------------------ */

const PREFISSI_POPOLO = /^(?:Pop\.|Popolo|Com\.|Comune(?: di)?|Vil\.|Villa|Cap\.|Cappella|Contr\.|Contrada)\s*/i;
const PREFISSI_PIVIERE =
  /^(?:Piv\.|Pivier[ei]|Pod\.|Podesteria|Lega|Contado|Comune|Capitanato|Vicariato|Città(?:\s+e\s+(?:contado|sobborghi|distretto|corte))?)\s*(?:di|del|della|dello|dell'|d')?\s*/i;
const PREPOSIZIONI_LUOGO = new Set([
  "a", "al", "alla", "allo", "ai", "alle", "in", "di", "da", "de'", "del", "della", "dello", "dei", "delle", "sul",
  "sulla", "sopra", "sotto", "presso", "fra", "tra", "fuori",
]);

/** Toglie numeri romani e cifre finali ("Giogoli (IV)", "Levane1") e normalizza gli apostrofi. */
function ripulisci(nome: string): string {
  return nome
    .replace(/[’‘`]/g, "'")
    .replace(/\bS\s+\./g, "S.")
    .replace(/\s*\((?:[IVX]+)\)\s*$/, "")
    .replace(/\d+\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Nomi dei santi scritti in modo diverso nel catasto e nel Repetti. */
const SANTI_EQUIVALENTI: [RegExp, string][] = [
  [/\bPIERO\b/g, "PIETRO"],
  [/\bPIERINO\b/g, "PIETRO"],
  [/\bAGNOLO\b/g, "ANGELO"],
  [/\bJACOPO\b/g, "IACOPO"],
  [/\bGIACOMO\b/g, "IACOPO"],
  [/\bNICOLO\b/g, "NICCOLO"],
  [/\bBARTOLOMEO\b/g, "BARTOLOMMEO"],
  [/\bSTEFFANO\b/g, "STEFANO"],
  [/\bCRISTOFORO\b/g, "CRISTOFANO"],
  [/\bGIOVANBATISTA\b|\bGIOVANNI BATTISTA\b/g, "GIOVANNI BATISTA"],
  [/\bTOMME\b/g, "TOMMASO"],
  [/\bLORENZINO\b/g, "LORENZO"],
  // "S. Miniato a Monte" = "S. MINIATO AL MONTE": preposizioni articolate equivalenti.
  [/ (?:AL|ALLA|ALLO|AI|ALLE|ALL) /g, " A "],
];

/** Chiave di confronto: `normalizzaNome` più le grafie equivalenti dei santi. */
export function chiave(nome: string): string {
  // Il Repetti scrive "Fojano", "Pistoja": la J vale I.
  let k = normalizzaNome(ripulisci(nome)).replace(/J/g, "I");
  for (const [re, sost] of SANTI_EQUIVALENTI) k = k.replace(re, sost);
  return k;
}

export interface NomeScomposto {
  /** Nome senza prefisso ("S. Donato a Luciana"). */
  completo: string;
  /** "S. Donato" (vuoto se il nome non comincia con un santo). */
  dedicazione: string;
  /** Località alternative ("Luciana"; "Legnone", "Bagnolo"; "Vaiana", "Lavaiano"). */
  localita: string[];
}

/**
 * "Pop. S. Donato a Legnone e Bagnolo" -> dedicazione "S. Donato",
 * località ["Legnone e Bagnolo", "Legnone", "Bagnolo"]; "Com. la Vaiana (o
 * Lavaiano)" -> località ["Vaiana", "Lavaiano"].
 */
export function scomponiPopolo(nome: string): NomeScomposto {
  const senzaPrefisso = ripulisci(nome.replace(PREFISSI_POPOLO, "").replace(/^(?:di|del|della|dello|de')\s+/i, ""));
  // "Com. la Cornia, popolo di S. Agnolo": il resto dopo la virgola descrive il popolo.
  const [principale, ...resto] = senzaPrefisso.split(/\s*,\s*/);
  // Parentesi anche non chiuse: "Com. di Gangalandi (S. Michele a Gangalandi".
  const alternative = [...principale.matchAll(/\((?:o|ossia|detto|detta)?\s*([^)]+)(?:\)|$)/gi)].map((m) => m[1].trim());
  const completo = principale.replace(/\s*\([^)]*(?:\)|$)\s*/g, " ").trim();

  let dedicazione = "";
  let luogo = completo;
  const parole = completo.split(" ");
  if (/^(?:SS?\.|San|Santa|Santo|Sant'|Santi)$/i.test(parole[0]) || /^Sant'/i.test(parole[0])) {
    const i = parole.findIndex((p, j) => j > 0 && PREPOSIZIONI_LUOGO.has(p.toLowerCase()) && p === p.toLowerCase());
    if (i > 0) {
      dedicazione = parole.slice(0, i).join(" ");
      luogo = parole.slice(i + 1).join(" ");
    } else {
      dedicazione = completo;
      luogo = "";
    }
  }
  const localita = new Set<string>();
  const aggiungi = (l: string) => {
    // Articolo iniziale staccato ("la Cornia") o apostrofato ("l'Antella"), non l'inizio del nome ("Legnone").
    const pulita = l.replace(/^(?:(?:la|il|lo|le|i|gli)\s+|l')/i, "").trim();
    if (pulita && /[A-ZÀ-Ý]/.test(pulita[0])) localita.add(pulita);
  };
  if (luogo) {
    aggiungi(luogo);
    for (const parte of luogo.split(/\s+(?:e|ed|o)\s+/)) aggiungi(parte);
    // "Monteluco a Lecchi": anche il primo nome da solo.
    const primo = luogo.split(/\s+(?:a|al|alla|in|di|presso)\s+/)[0];
    if (primo !== luogo) aggiungi(primo);
  }
  for (const a of alternative) {
    // "(S. Michele a Gangalandi)": la località del popolo fra parentesi.
    const interna = a.match(/^(?:SS?\.|San|Santa|Santo|Sant'|Santi)\s.+?\s(?:a|in|al|alla|di)\s+(.+)$/i);
    aggiungi(interna ? interna[1] : a);
  }
  for (const r of resto) {
    const ded = r.match(/popolo di\s+(.+)$/i);
    if (ded && !dedicazione) dedicazione = ded[1].trim();
  }
  return { completo, dedicazione, localita: [...localita] };
}

/** "Piv. di San Piero in Bossolo" -> "San Piero in Bossolo"; "Contado di Prato" -> "Prato". */
export function nomePiviere(nome: string): string {
  if (/^(?:Gonf\.|Gonfalone|Circonstanze|Quart\.)/i.test(nome)) return "";
  return ripulisci(nome.replace(PREFISSI_PIVIERE, "")).replace(/^(?:(?:la|il|lo)\s+|l')/i, "");
}

/** Località di un nome di pieve o popolo, senza il santo: "S. Pietro in Bossolo" -> "BOSSOLO". */
export function localitaChiave(nome: string): string {
  const { localita, dedicazione, completo } = scomponiPopolo(nome);
  return chiave(localita[0] ?? (dedicazione ? "" : completo));
}

/** Nomi brevi delle città nel catasto e titolo corrispondente nel Repetti. */
const CITTA_ALIAS: Record<string, string> = {
  COLLE: "Colle di Val d'Elsa",
  CASTIGLIONE: "Castiglion Fiorentino",
};

/** Città della serie o del quartiere ("Città di Cortona" -> "Cortona"), vuoto per il contado. */
export function cittaDelLuogo(l: LuogoCatasto): string {
  const da = (s: string) => s.match(/^Citt[àa](?:\s+e\s+\w+)?\s+di\s+(.+)$/i)?.[1]?.trim() ?? "";
  const citta = da(l.nome_quartiere) || da(l.nome_serie) || da(l.nome_piviere) || (/^Firenze\b/.test(l.nome_serie) ? "Firenze" : "");
  return CITTA_ALIAS[chiave(citta)] ?? citta;
}

/* ------------------------------------------------------------------------ */
/* Indice del Repetti                                                        */
/* ------------------------------------------------------------------------ */

/**
 * `perNome`: titoli, varianti e popoli per chiave, anche senza spazi
 * ("CASTEL FIORENTINO" = "CASTELFIORENTINO"); `ripieghi`: il solo nome prima
 * della qualificazione ("PESCIA CITTA" -> "PESCIA"), usato solo se `perNome`
 * non trova nulla.
 */
export interface IndiceRepetti {
  perNome: Map<string, VoceRepetti[]>;
  ripieghi: Map<string, VoceRepetti[]>;
  /** Nomi senza la vocale finale ("CUTIGLIAN"), per le grafie che differiscono solo lì. */
  radici: Map<string, VoceRepetti[]>;
}

function radice(k: string): string {
  return k.length >= 6 ? k.replace(/[AEIO]$/, "") : "";
}

function haCoordinate(v: VoceRepetti): boolean {
  return v.lat !== "" && v.lng !== "";
}

function punto(v: VoceRepetti): { lat: number; lng: number } {
  return { lat: Number(v.lat), lng: Number(v.lng) };
}

function compatta(k: string): string {
  return k.replace(/ /g, "");
}

export function indicizzaRepetti(voci: VoceRepetti[]): IndiceRepetti {
  const perNome = new Map<string, VoceRepetti[]>();
  const ripieghi = new Map<string, VoceRepetti[]>();
  const radici = new Map<string, VoceRepetti[]>();
  const aggiungi = (mappa: Map<string, VoceRepetti[]>, k: string, v: VoceRepetti) => {
    if (!k) return;
    const lista = mappa.get(k) ?? [];
    if (!lista.includes(v)) lista.push(v);
    mappa.set(k, lista);
  };
  const nome = (k: string, v: VoceRepetti) => {
    aggiungi(perNome, k, v);
    aggiungi(perNome, compatta(k), v);
  };
  for (const v of voci) {
    for (const variante of variantiTitolo(v.titolo)) {
      const k = chiave(variante);
      nome(k, v);
      const ripiego = k.split(/ (?:DI|DEL|DELLA|DELLO|DEI|DE|IN|A|AL|ALLA|SUL|SULLA|CITTA) /)[0].replace(/ CITTA$/, "");
      if (ripiego !== k) {
        aggiungi(ripieghi, ripiego, v);
        aggiungi(ripieghi, compatta(ripiego), v);
      }
    }
    // "SIGNA (CASTEL DI)": anche "SIGNA", come ripiego.
    const primaDellaParentesi = v.titolo.match(/^([^(,]+?)\s*\(/)?.[1];
    if (primaDellaParentesi) aggiungi(ripieghi, chiave(primaDellaParentesi), v);
    // "CUTIGLIANO" per "Cutigliana": la radice senza vocale finale, ultimo ripiego.
    for (const variante of variantiTitolo(v.titolo)) aggiungi(radici, radice(chiave(variante)), v);
    // "SETTIMO (PIEVE DI S. GIULIANO A)": anche "S. GIULIANO A SETTIMO".
    for (const variante of variantiTitolo(v.titolo)) {
      const senzaChiesa = chiave(variante).replace(/^(?:PIEVE|BADIA|PRIORIA|CANONICA|CHIESA|ABAZIA) (?:DI|DE|DEI|A|IN) /, "");
      if (senzaChiesa !== chiave(variante)) nome(senzaChiesa, v);
    }
    // "LUCIANA" con popolo "S. Donato a Luciana": anche il nome completo del popolo.
    if (v.dedicazione && /\s(?:a|in|al|alla)\s/.test(v.dedicazione)) nome(chiave(v.dedicazione), v);
  }
  return { perNome, ripieghi, radici };
}

function cerca(indice: IndiceRepetti, chiavi: string[]): VoceRepetti[] {
  const trovati = new Set(chiavi.filter(Boolean).flatMap((k) => [...(indice.perNome.get(k) ?? []), ...(indice.perNome.get(compatta(k)) ?? [])]));
  if (trovati.size > 0) return [...trovati];
  const ripieghi = new Set(chiavi.filter(Boolean).flatMap((k) => [...(indice.ripieghi.get(k) ?? []), ...(indice.ripieghi.get(compatta(k)) ?? [])]));
  if (ripieghi.size > 0) return [...ripieghi];
  return [...new Set(chiavi.filter(Boolean).flatMap((k) => indice.radici.get(radice(k)) ?? []))];
}

/* ------------------------------------------------------------------------ */
/* Abbinamento                                                              */
/* ------------------------------------------------------------------------ */

/** Centro di Firenze: per il contado fiorentino si scartano i candidati oltre `RAGGIO_CONTADO_KM`. */
const FIRENZE = { lat: 43.7731, lng: 11.2558 };
const RAGGIO_CONTADO_KM = 75;
/** Distanza massima fra un popolo e la sua pieve. */
export const RAGGIO_PIEVE_KM = 15;
/** Distanza massima fra un comune o una podesteria e l'unità superiore del catasto. */
export const RAGGIO_COMUNE_KM = 30;
/** Cappelle e contrade di una città: entro la città. */
export const RAGGIO_CITTA_KM = 4;
/** Oltre questa distanza dalla pieve un candidato non si propone nemmeno come approssimato. */
export const RAGGIO_MASSIMO_KM = 40;

const SERIE_FIRENZE = new Set(["1", "2", "7"]);
const SERIE_CONTADO_FIORENTINO = new Set(["3", "4", "5", "6"]);

function stessaLocalita(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function santo(dedicazione: string): string {
  return chiave(dedicazione).replace(/^SAN(?:TI)?\s+/, "");
}

/** Pieve (o unità superiore) del luogo: la voce del Repetti con coordinate che meglio la rappresenta. */
export function trovaPieve(
  nome: string,
  indice: IndiceRepetti,
  contadoFiorentino: boolean,
  serie: string[] = [],
): VoceRepetti | null {
  if (!nome) return null;
  const base = [chiave(nome), localitaChiave(nome)].filter(Boolean);
  // "GROPINA (PIEVE DI)" è indicizzata come "PIEVE DI GROPINA".
  const chiavi = [...base, ...base.flatMap((k) => ["PIEVE DI", "PIEVE A", "PIEVE IN", "PIEVE AL"].map((p) => `${p} ${k}`))];
  const candidati = cerca(indice, chiavi).filter(haCoordinate);
  if (candidati.length === 0) return null;
  const voto = (v: VoceRepetti) =>
    (/pieve/i.test(v.tipo) || /\bPIEVE\b/.test(v.titolo) ? 3 : 0) +
    (/^(?:Città|Terra|Castello|Borgo)/i.test(v.tipo) ? 1 : 0) +
    (serie.some((p) => `${chiave(v.contesto)} ${chiave(v.diocesi)} ${chiave(v.titolo)}`.replace(/IA\b/g, "I").includes(p)) ? 2 : 0) +
    (v.fonte_coordinate !== "distanza" ? 1 : 0) +
    (contadoFiorentino && distanzaKm(punto(v), FIRENZE) <= RAGGIO_CONTADO_KM ? 2 : 0) -
    (v.note.includes("coordinate_incoerenti") ? 2 : 0);
  return [...candidati].sort((a, b) => voto(b) - voto(a))[0];
}

function cercaCandidati(nomi: string[], indice: IndiceRepetti): VoceRepetti[] {
  return cerca(indice, nomi.map(chiave));
}

const PAROLE_VUOTE_SERIE = new Set(["CONTADO", "CITTA", "DI", "DEL", "DELLA", "D", "VAL", "E", "FIORENTINO", "SOTTO", "SOPRA"]);

/** Parole distintive del nome della serie ("Val di Nievole" -> NIEVOLE), per scegliere fra omonimi. */
function paroleSerie(nomeSerie: string): string[] {
  return chiave(nomeSerie)
    .split(" ")
    .filter((p) => p.length > 3 && !PAROLE_VUOTE_SERIE.has(p))
    .map((p) => p.replace(/IA$/, "I"));
}

function punteggio(
  v: VoceRepetti,
  scomposto: NomeScomposto,
  piviereLuogo: string,
  pieve: VoceRepetti | null,
  serie: string[],
): number {
  let p = 0;
  const titoli = variantiTitolo(v.titolo).map(chiave);
  // Il titolo porta il nome del popolo o della località; altrimenti la voce lo cita soltanto.
  if (chiave(scomposto.completo) && titoli.includes(chiave(scomposto.completo))) p += 3;
  else if (scomposto.localita.some((l) => titoli.includes(chiave(l)))) p += 2;
  if (scomposto.dedicazione && v.dedicazione && santo(v.dedicazione).startsWith(santo(scomposto.dedicazione))) p += 2;
  const piviereVoce = localitaChiave(v.piviere) || chiave(v.comunita);
  if (piviereLuogo && (stessaLocalita(piviereVoce, piviereLuogo) || stessaLocalita(chiave(v.comunita), piviereLuogo))) p += 3;
  if (pieve && haCoordinate(v) && distanzaKm(punto(v), punto(pieve)) <= RAGGIO_PIEVE_KM) p += 2;
  const testo = `${chiave(v.contesto)} ${chiave(v.titolo)} ${chiave(v.diocesi)}`.replace(/IA\b/g, "I");
  if (serie.some((parola) => testo.includes(parola))) p += 2;
  if (haCoordinate(v)) p += v.fonte_coordinate === "distanza" ? 1 : 2;
  if (v.note.includes("coordinate_incoerenti")) p -= 2;
  return p;
}

function risultato(
  luogo: LuogoCatasto,
  cercato: string,
  certezza: Certezza,
  voce: VoceRepetti | null,
  pieve: VoceRepetti | null,
  candidati: Abbinamento["candidati"],
  motivo: string,
): Abbinamento {
  const fonte = certezza === "solo_piviere" ? pieve : voce;
  const coordinate = fonte && haCoordinate(fonte) && certezza !== "non_trovata" ? punto(fonte) : null;
  const distanza = voce && pieve && haCoordinate(voce) && haCoordinate(pieve) ? distanzaKm(punto(voce), punto(pieve)) : null;
  return {
    luogo,
    cercato,
    certezza,
    lat: coordinate?.lat ?? null,
    lng: coordinate?.lng ?? null,
    voce,
    pieve,
    distanza_pieve_km: distanza,
    candidati,
    motivo,
  };
}

/** Abbina un luogo del catasto alle voci del Repetti. */
export function abbinaLuogo(luogo: LuogoCatasto, indice: IndiceRepetti): Abbinamento {
  const contadoFiorentino = SERIE_CONTADO_FIORENTINO.has(luogo.id_serie);
  if (SERIE_FIRENZE.has(luogo.id_serie)) {
    return risultato(luogo, "", "non_trovata", null, null, [], "gonfalone_firenze");
  }

  const citta = cittaDelLuogo(luogo);
  const serie = paroleSerie(luogo.nome_serie);
  let nomePiv = nomePiviere(luogo.nome_piviere);
  // Nel contado fiorentino il "piviere di San Giovanni" è quello del battistero di Firenze.
  if (contadoFiorentino && chiave(nomePiv) === "SAN GIOVANNI") nomePiv = "Firenze";
  const pieve = trovaPieve(nomePiv, indice, contadoFiorentino, serie) ?? (citta ? trovaPieve(citta, indice, false) : null);
  // Cappelle e contrade di una città: si cercano solo dentro la città.
  const urbano = citta !== "" && !SERIE_FIRENZE.has(luogo.id_serie) && /^(?:Cap\.|Cappella|Contr\.|Contrada|Pop\.)/i.test(luogo.nome_popolo) && /^Citt/i.test(luogo.nome_serie);
  const piviereLuogo = localitaChiave(nomePiv) || chiave(nomePiv) || chiave(citta);

  // Senza popolo il luogo è la podesteria, il comune o la città stessa.
  const nomeLuogo = luogo.nome_popolo || (citta && !nomePiv ? `Com. ${citta}` : nomePiv ? `Com. ${nomePiv}` : "");
  if (!nomeLuogo) return risultato(luogo, "", "non_trovata", null, null, [], "nome_mancante");
  const scomposto = scomponiPopolo(nomeLuogo);
  const nomi = [scomposto.completo, ...scomposto.localita];
  const cercato = scomposto.localita[0] ?? scomposto.completo;

  let candidati = cercaCandidati(nomi, indice);
  if (contadoFiorentino) {
    candidati = candidati.filter((v) => !haCoordinate(v) || distanzaKm(punto(v), FIRENZE) <= RAGGIO_CONTADO_KM);
  }
  // Vincolo della pieve: i candidati con coordinate lontani dalla pieve non sono questo popolo.
  // I comuni e le podesterie sono raggruppamenti fiscali più ampi del piviere.
  const raggio = urbano
    ? RAGGIO_CITTA_KM
    : /^(?:Com\.|Comune|Pod\.)/i.test(luogo.nome_popolo) || !luogo.nome_popolo
      ? RAGGIO_COMUNE_KM
      : RAGGIO_PIEVE_KM;
  const lontani = (v: VoceRepetti) => pieve !== null && haCoordinate(v) && distanzaKm(punto(v), punto(pieve)) > raggio;
  // Se tutti i candidati con coordinate sono lontani si tengono (le unità
  // fiscali del catasto non coincidono sempre con il piviere), ma senza certezza.
  const scartati = candidati.filter(lontani);
  const tuttiLontani =
    !urbano &&
    scartati.length > 0 &&
    candidati.filter(haCoordinate).every(lontani) &&
    candidati.some((v) => haCoordinate(v) && distanzaKm(punto(v), punto(pieve!)) <= RAGGIO_MASSIMO_KM);
  candidati = tuttiLontani
    ? candidati.filter((v) => !haCoordinate(v) || distanzaKm(punto(v), punto(pieve!)) <= RAGGIO_MASSIMO_KM)
    : candidati.filter((v) => !lontani(v));

  const valutati = candidati
    .map((voce) => ({ voce, punteggio: punteggio(voce, scomposto, piviereLuogo, pieve, serie) }))
    .sort((a, b) => b.punteggio - a.punteggio);
  const conCoordinate = valutati.filter((c) => haCoordinate(c.voce));
  const migliore = conCoordinate[0] ?? null;
  const altri = valutati.filter((c) => c !== migliore).slice(0, 4);

  if (migliore) {
    const v = migliore.voce;
    const piviereConfermato =
      piviereLuogo !== "" &&
      (stessaLocalita(localitaChiave(v.piviere), piviereLuogo) || stessaLocalita(chiave(v.comunita), piviereLuogo));
    const vicinoPieve = pieve !== null && distanzaKm(punto(v), punto(pieve)) <= raggio;
    const pareggio = conCoordinate[1] && conCoordinate[1].punteggio === migliore.punteggio;
    const notaCoordinate = v.note.includes("coordinate_incoerenti");
    const confermato = piviereConfermato || vicinoPieve || (conCoordinate.length === 1 && !pieve && !nomePiv);
    if (v.fonte_coordinate !== "distanza" && confermato && !pareggio && !notaCoordinate && !tuttiLontani) {
      return risultato(luogo, cercato, "sicura", v, pieve, altri, piviereConfermato ? "piviere" : vicinoPieve ? "vicino_pieve" : "unico");
    }
    const motivo = [
      v.fonte_coordinate === "distanza" ? "coordinate_da_distanza" : "",
      !confermato ? "senza_conferma_piviere" : "",
      pareggio ? "candidati_a_pari_merito" : "",
      notaCoordinate ? "coordinate_incoerenti" : "",
      tuttiLontani ? "lontano_dalla_pieve" : "",
    ]
      .filter(Boolean)
      .join(";");
    return risultato(luogo, cercato, "approssimata", v, pieve, altri, motivo);
  }

  if (pieve) {
    const motivo = citta && (urbano || !nomePiv || /^(?:Terziere|Quart)/i.test(luogo.nome_piviere)) ? "citta" : valutati.length > 0 ? "candidati_senza_coordinate" : "luogo_non_nel_repetti";
    return risultato(luogo, cercato, "solo_piviere", null, pieve, altri, motivo);
  }
  return risultato(luogo, cercato, "non_trovata", null, null, altri, valutati.length > 0 ? "candidati_senza_coordinate" : "luogo_non_nel_repetti");
}
