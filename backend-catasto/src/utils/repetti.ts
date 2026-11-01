/**
 * Estrazione dei luoghi dal Dizionario geografico fisico storico della Toscana
 * di Emanuele Repetti (1833-1846), nei dati CC0 di
 * https://github.com/joeyates/repetti_data.
 *
 * Ogni voce comincia con un'intestazione di forma ricorrente, per esempio:
 *
 *   – Villata che dà il suo nome al popolo di S. Maria [...] nel piviere di
 *   S. Pietro in Bossolo, Comunità e circa 4 miglia toscane a grecale di
 *   Certaldo, Giurisdizione di Castel Fiorentino, Diocesi e Compartimento di
 *   Firenze.
 *
 * Da qui si ricavano tipo di luogo, dedicazione, piviere, comunità,
 * giurisdizione, diocesi e la distanza da un luogo di riferimento. Quando la
 * voce non ha coordinate e il riferimento sì, la posizione si calcola dalla
 * distanza e dalla direzione (rosa dei venti a otto punte). Le espressioni
 * regolari coprono le forme più frequenti: il risultato è una proposta da
 * rivedere, non un dato certo.
 */

/** Un miglio toscano in chilometri. */
export const MIGLIO_TOSCANO_KM = 1.6537;

/** Oltre questa distanza fra coordinate note e posizione calcolata dal testo, la voce va rivista. */
export const SOGLIA_INCOERENZA_KM = 10;

const KM_PER_GRADO_LAT = 111.32;

export interface ArticoloRepetti {
  title: string;
  context?: string;
  body: string;
  slug?: string;
}

export interface CoordinataRepetti {
  title: string;
  type: string;
  point_source: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Distanza {
  miglia: number;
  direzione: string;
  gradi: number;
  riferimento: string;
}

export interface LuogoRepetti {
  titolo: string;
  volume: string;
  slug: string;
  contesto: string;
  tipo: string;
  dedicazione: string;
  piviere: string;
  comunita: string;
  giurisdizione: string;
  diocesi: string;
  compartimento: string;
  distanza: Distanza | null;
  riferimento_titolo: string;
  lat: number | null;
  lng: number | null;
  /** `manual`, `text`, `later` (da coordinates.json), `distanza` (calcolata) o vuoto. */
  fonte_coordinate: string;
  note: string[];
  intestazione: string;
}

/* ------------------------------------------------------------------------ */
/* Testo                                                                     */
/* ------------------------------------------------------------------------ */

/** Toglie HTML e correzioni editoriali "(ERRATA: ...)", uniforma apostrofi e spazi. */
export function pulisciTesto(testo: string): string {
  return testo
    .replace(/<[^>]*>/g, " ")
    .replace(/\(\s*ERRATA\s*:[^)]*\)/gi, " ")
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Primo paragrafo della voce, ripulito e senza il trattino iniziale. */
export function intestazione(body: string): string {
  const primo = body.trim().split(/\n\s*\n/)[0] ?? "";
  return pulisciTesto(primo).replace(/^[–—-]\s*/, "");
}

/** Voce di solo rinvio ("Vedere ..."). */
export function eRinvio(testa: string): boolean {
  return /^(?:Vedere|Vedi|V\.)\s/i.test(testa);
}

/* ------------------------------------------------------------------------ */
/* Direzioni e distanze                                                      */
/* ------------------------------------------------------------------------ */

const VENTI: Record<string, number> = {
  settentrione: 0,
  tramontana: 0,
  grecale: 45,
  greco: 45,
  levante: 90,
  oriente: 90,
  scirocco: 135,
  scilocco: 135,
  ostro: 180,
  austro: 180,
  mezzodì: 180,
  mezzodi: 180,
  mezzogiorno: 180,
  libeccio: 225,
  ponente: 270,
  occidente: 270,
  maestro: 315,
  maestrale: 315,
};

const VENTO = Object.keys(VENTI)
  .sort((a, b) => b.length - a.length)
  .join("|");

/** Gradi (0 = nord, in senso orario) di una direzione semplice o composta ("grecale-levante"). */
export function gradiDirezione(direzione: string): number | null {
  const parti = direzione
    .toLowerCase()
    .split(/[\s-]+/)
    .map((p) => VENTI[p])
    .filter((g): g is number => g !== undefined);
  if (parti.length === 0) return null;
  if (parti.length === 1) return parti[0];
  // Media circolare: "maestro-tramontana" (315 e 0) deve dare 337,5, non 157,5.
  const x = parti.reduce((s, g) => s + Math.cos((g * Math.PI) / 180), 0);
  const y = parti.reduce((s, g) => s + Math.sin((g * Math.PI) / 180), 0);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const NUMERI_IN_LETTERE: Record<string, number> = {
  un: 1,
  uno: 1,
  mezzo: 0.5,
  due: 2,
  tre: 3,
  quattro: 4,
  cinque: 5,
  sei: 6,
  sette: 7,
  otto: 8,
  nove: 9,
  dieci: 10,
};

/** "4", "2 1/2", "3 e mezzo", "un", "mezzo", "un quarto di" -> miglia. */
export function leggiMiglia(testo: string): number | null {
  const t = testo.toLowerCase().trim();
  const intervallo = t.match(/^(\d+(?:[.,]\d+)?)\s+(?:in|a|o)\s+(\d+(?:[.,]\d+)?)$/);
  if (intervallo) return (Number(intervallo[1].replace(",", ".")) + Number(intervallo[2].replace(",", "."))) / 2;
  if (/^un quarto( di)?$/.test(t)) return 0.25;
  if (/^(?:un |mezzo )?terzo( di)?$/.test(t)) return 1 / 3;
  const m = t.match(/^(\d+(?:[.,]\d+)?|[a-zì]+)(?:\s*(?:e\s+)?(?:(\d)\s*\/\s*(\d)|mezzo|un quarto))?$/);
  if (!m) return null;
  const base = /^\d/.test(m[1]) ? Number(m[1].replace(",", ".")) : NUMERI_IN_LETTERE[m[1]];
  if (base === undefined || Number.isNaN(base)) return null;
  let frazione = 0;
  if (m[2] && m[3]) frazione = Number(m[2]) / Number(m[3]);
  else if (/mezzo$/.test(t) && m[1] !== "mezzo") frazione = 0.5;
  else if (/un quarto$/.test(t)) frazione = 0.25;
  return base + frazione;
}

const PREPOSIZIONE = "(?:di|del|della|dello|delle|dei|degli|de'|da|dal|dalla|dai)";
const FINE_NOME =
  "(?=\\s*(?:[,;:()]|(?<!\\b(?:S|SS|Ss|Sant|B))\\.|$|\\s(?:Diocesi|Giurisdizione|Compartimento|Comunità|nella|nel|nei|sulla|sul|presso|dove|da cui|alla|al|e\\s+\\d)(?=[\\s,.;:]|$)))";
// Nome proprio: si ferma alla punteggiatura, ma non al punto delle abbreviazioni "S." e "SS.".
const NOME = "((?:SS?\\.\\s*|[A-ZÀ-Ý])(?:[^,.;:()]|(?<=\\b(?:S|SS|Ss|Sant|B))\\.)*?)";

const QUANTITA =
  "(\\d+(?:[.,]\\d+)?\\s+(?:in|a|o)\\s+\\d+(?:[.,]\\d+)?|\\d+(?:[.,]\\d+)?(?:\\s*(?:e\\s+)?(?:\\d\\s*\\/\\s*\\d|mezzo|un quarto))?|un quarto di|un terzo di|un|mezzo|[a-z]+)";
const VERSO = `(?:a|al|verso)(?:\\s+(?:loro|suo|sua))?\\s+((?:${VENTO})(?:[\\s-]+(?:${VENTO}))?)`;
const RIFERIMENTO = `(?:\\s+${PREPOSIZIONE}\\s+(?:là\\s+)?(?:${PREPOSIZIONE}\\s+)?(?:stesso\\s+)?${NOME}${FINE_NOME})?`;
/** "4 miglia toscane a grecale di Certaldo", "un miglio o poco più a ponente di Empoli". */
const RE_DISTANZA = new RegExp(
  `(?:circa\\s+)?${QUANTITA}\\s+migli[ao](?:\\s+(?:toscan[aeio]|circa))*(?:\\s+e\\s+mezzo)?(?:\\s+o\\s+poco\\s+(?:più|meno))?\\s+${VERSO}${RIFERIMENTO}`,
  "gi",
);
/** Forma inversa: "a circa miglia 2 e 1/2 a levante del Bagno di Ripoli". */
const RE_DISTANZA_INVERSA = new RegExp(`migli[ao]\\s+(?:toscan[aeio]\\s+)?${QUANTITA}\\s+${VERSO}${RIFERIMENTO}`, "gi");
const RE_DA_CUI = /\b(?:di|da)\s+([A-ZÀ-Ý][^,.;:()]*?)\s*,?\s*(?:da cui|dalla quale|dal quale)\b[^,.;]*$/;

/**
 * Prima distanza dell'intestazione con un riferimento esplicito ("4 miglia
 * toscane a grecale di Certaldo") o implicito ("Diocesi di Siena, da cui
 * trovasi circa 4 miglia toscane a ostro").
 */
export function estraiDistanza(testa: string): Distanza | null {
  const trovate = [...testa.matchAll(RE_DISTANZA), ...testa.matchAll(RE_DISTANZA_INVERSA)].sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0),
  );
  for (const m of trovate) {
    const miglia = leggiMiglia(m[1]);
    const gradi = gradiDirezione(m[2]);
    if (miglia === null || gradi === null) continue;
    let riferimento = m[3]?.trim() ?? "";
    if (!riferimento) {
      // "... di Siena, da cui trovasi circa 4 miglia": il riferimento precede.
      const daCui = testa.slice(0, m.index).match(RE_DA_CUI);
      if (daCui) riferimento = daCui[1].trim();
    }
    if (!riferimento) continue;
    return { miglia, direzione: m[2].toLowerCase(), gradi, riferimento: ripulisciNome(riferimento) };
  }
  return null;
}

/** Punto a `km` chilometri da (lat, lng) nella direzione `gradi`. */
export function spostaPunto(lat: number, lng: number, km: number, gradi: number): { lat: number; lng: number } {
  const rad = (gradi * Math.PI) / 180;
  const dLat = (km * Math.cos(rad)) / KM_PER_GRADO_LAT;
  const dLng = (km * Math.sin(rad)) / (KM_PER_GRADO_LAT * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

/** Distanza in km fra due punti (formula dell'emisenoverso). */
export function distanzaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const r = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

/* ------------------------------------------------------------------------ */
/* Attributi dell'intestazione                                              */
/* ------------------------------------------------------------------------ */

// "\b" non funziona dopo una lettera accentata ("Comunità"): fine parola esplicita.
const FINE_PAROLA = "(?=[\\s,.;:]|$)";
const PAROLE_AMMINISTRATIVE = new RegExp(
  `^(?:[,\\s]|e\\s|(?:Comunità|Giurisdizione|Diocesi|Compartimento|Potesteria|Vicariato)${FINE_PAROLA})+`,
);

function ripulisciNome(nome: string): string {
  return nome.replace(/\s+/g, " ").replace(/\s+stess[oa]\b/g, "").replace(/\s+(?:e|ed)$/, "").trim();
}

/**
 * Nome che segue una parola chiave ("Comunità", "Diocesi", ...), saltando le
 * altre parole amministrative e la distanza: "Comunità Giurisdizione e circa
 * 6 miglia toscane a maestrale di Asinalunga" -> "Asinalunga".
 */
export function nomeDopo(testa: string, chiave: string): string {
  const re = new RegExp(`\\b${chiave}${FINE_PAROLA}`, "g");
  for (const m of testa.matchAll(re)) {
    let resto = testa.slice((m.index ?? 0) + m[0].length);
    resto = resto.replace(PAROLE_AMMINISTRATIVE, "");
    const dist = resto.match(
      new RegExp(`^(?:e\\s+|a\\s+)?(?:circa\\s+)?(?:${QUANTITA}\\s+migli[ao]|migli[ao]\\s+${QUANTITA})(?:\\s+(?:toscan[aeio]|circa))*(?:\\s+e\\s+mezzo)?(?:\\s+o\\s+poco\\s+(?:più|meno))?\\s+${VERSO}\\s+`, "i"),
    );
    if (dist) resto = resto.slice(dist[0].length);
    const nome = resto.match(new RegExp(`^${PREPOSIZIONE}\\s+(?:${PREPOSIZIONE}\\s+)?${NOME}${FINE_NOME}`));
    if (nome) return ripulisciNome(nome[1]);
    // "Comunità delle Masse di Città": la preposizione fa parte del nome.
    const articolato = resto.match(/^(dell[ae']\s*[A-ZÀ-Ý][^,.;:()]*?)(?=\s*(?:[,.;:()]|$|\s(?:Giurisdizione|Diocesi|Compartimento)\b))/);
    if (articolato) return ripulisciNome(articolato[1]);
  }
  return "";
}

/** Piviere: "nel piviere di S. Pietro in Bossolo"; "nel piviere, Comunità ... di Rignano" -> Rignano. */
export function estraiPiviere(testa: string): string {
  const esplicito = testa.match(new RegExp(`\\bpiviere\\s+(?:di|del|della|dell')\\s*${NOME}${FINE_NOME}`, "i"));
  if (esplicito) return ripulisciNome(esplicito[1]);
  // "nel piviere, Comunità ... di Rignano": piviere del capoluogo.
  if (/\bnel piviere\s*(?:,|e\s|Comunità)/i.test(testa)) return nomeDopo(testa, "Comunità");
  return "";
}

const RE_DEDICAZIONE = new RegExp(
  "\\b(?:popolo|chiesa(?:\\s+parrocchiale)?|prioria|pieve|parrocchia|cura|canonica|titolo)\\s+(?:di|de'|dei)\\s+" +
    "((?:SS?\\.|Santa|Santo|San|Sant'|Santi)\\s*[^,;:()]+?)" +
    "(?=\\s*(?:[,;:()]|$|\\.(?!\\s*[A-Z][a-z]*\\.)|\\s(?:nel|nella|nei|presso|sotto|sopra|della|del|dove|cui|che|con)\\b))",
);

const PAROLE_DEDICAZIONE = new Set(["a", "al", "alla", "in", "di", "de'", "del", "della", "dei", "delle", "e", "ed", "sopra", "sotto"]);

/** Taglia la dedicazione al primo segno che non è nome: "S. Lucia in Barbiano nell'anno 1551" -> "S. Lucia in Barbiano". */
function tagliaDedicazione(testo: string): string {
  const parole = testo.split(/\s+/);
  const tenute: string[] = [];
  for (const p of parole) {
    if (/\d/.test(p)) break;
    if (/^[a-zà-ÿ]/.test(p) && !PAROLE_DEDICAZIONE.has(p)) break;
    tenute.push(p);
  }
  while (tenute.length > 1 && PAROLE_DEDICAZIONE.has(tenute[tenute.length - 1])) tenute.pop();
  return tenute.join(" ");
}

/** Dedicazione della chiesa: "popolo di S. Maria", "chiesa parrocchiale (S. Martino)", "BOSSOLO (S. PIETRO IN)". */
export function estraiDedicazione(testa: string, titolo = ""): string {
  const m = testa.match(RE_DEDICAZIONE);
  if (m) return tagliaDedicazione(ripulisciNome(m[1]));
  const parentesi = testa.match(/\((SS?\.\s*[^)]+)\)/);
  if (parentesi) return tagliaDedicazione(ripulisciNome(parentesi[1].split(",")[0]));
  const delTitolo = titolo.match(/\((SS?\.\s*[^)]*)\)/i);
  if (delTitolo) return ripulisciNome(delTitolo[1]);
  return "";
}

/** Tipo di luogo: le prime parole dell'intestazione ("Villata", "Antica pieve", "Casale con parrocchia"). */
export function estraiTipo(testa: string): string {
  const m = testa.match(/^([A-Za-zÀ-ÿ' ]+?)(?=\s+(?:che|nel|nella|nei|dove|sotto|presso|di|del|della|già|ora|detto|detta|in|a|sulla|sul|situat[oa]|posto|posta|fra|tra)\b|[,.;:(]|$)/);
  return m ? m[1].trim().slice(0, 60) : "";
}

/* ------------------------------------------------------------------------ */
/* Nomi e indice dei titoli                                                  */
/* ------------------------------------------------------------------------ */

/** Nome confrontabile: maiuscolo, senza accenti e punteggiatura, "S." -> "SAN". */
export function normalizzaNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\bSS\.\s*/g, "SANTI ")
    .replace(/\bS\.\s*/g, "SAN ")
    .replace(/\bSANT'\s*/g, "SAN ")
    .replace(/\b(?:SANTO|SANTA)\b/g, "SAN")
    .replace(/[^A-Z0-9' ]+/g, " ")
    .replace(/'\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Varianti di un titolo per l'indice: "MONTAGUTO, o MONTAGUTOLO DI VICCHIO,
 * ossia dell'ALPE DI VITIGLIANO" -> MONTAGUTO, MONTAGUTOLO DI VICCHIO, ...;
 * "BOSSOLO (S. PIETRO IN)" -> BOSSOLO, S. PIETRO IN BOSSOLO.
 */
export function variantiTitolo(titolo: string): string[] {
  const t = pulisciTesto(titolo);
  const varianti = new Set<string>();
  const parentesi = t.match(/^([^(]+?)\s*\(([^)]+)\)(.*)$/);
  if (parentesi) {
    // "CASCIANO (S.) DI MODIGLIANA" -> "S. CASCIANO DI MODIGLIANA"
    const coda = parentesi[3].replace(/\s+(?:nella|nel|nello|in|sopra|sotto|presso|fra|tra)\s+.*$/i, "").split(/\s*,/)[0];
    varianti.add(normalizzaNome(`${parentesi[2]} ${parentesi[1]}${coda}`));
    // "PISA (CERTOSA DI)": il luogo è la Certosa, "PISA" non è un suo nome.
    if (/\b(?:IN|A|AL|ALLA|ALLE|DI|DEL|DELLA|DELLO|DELL'|DE'|DEI|DEGLI|SU|SUL|SULLA|SOPRA|SOTTO|PRESSO)\s*$/i.test(parentesi[2])) {
      return [...varianti].filter(Boolean);
    }
  }
  const base = t.replace(/\([^)]*\)/g, " ").replace(/\s+(?:nella|nel|nello|in|sopra|sotto|presso|fra|tra)\s+.*$/i, "");
  const parti: string[] = [];
  for (const parte of base.split(/\s*,\s*|\s+(?:o|ossia|ora|e|oppure|altrimenti|oggi|dett[oa] (?:anche|ancora))\s+/i)) {
    // ", o MONTAGUTOLO": il connettivo dopo la virgola non fa parte del nome.
    const p = parte.trim().replace(/^(?:o|ossia|ora|e|oppure|altrimenti|oggi|dett[oa] (?:anche|ancora))\s+/i, "");
    if (p && /[A-ZÀ-Ý]/.test(p[0])) parti.push(normalizzaNome(p));
  }
  // Prima il nome principale del titolo, poi le varianti.
  return [...new Set([...parti, ...varianti])].filter(Boolean);
}

/* ------------------------------------------------------------------------ */
/* Costruzione della tabella                                                */
/* ------------------------------------------------------------------------ */

interface Punto {
  lat: number;
  lng: number;
  titolo: string;
  /** Contesto e titolo normalizzati, per cercare la valle della voce che cita il riferimento. */
  contesto: string;
  /** Lunghezza della voce: fra omonimi, la voce molto più lunga è il luogo principale. */
  peso: number;
  /** Titolo normalizzato senza parentesi né qualificazioni. */
  base: string;
  diocesi: string;
}

/**
 * Indice dei luoghi con coordinate per nome: `nomi` dalle varianti dei
 * titoli e dai rinvii, `compatti` senza spazi ("PRATO VECCHIO" = "PRATOVECCHIO"),
 * `ripieghi` con il solo nome prima della qualificazione ("VICCHIO DEL
 * MUGELLO" -> "VICCHIO").
 */
export interface IndiceLuoghi {
  nomi: Map<string, Punto[]>;
  compatti: Map<string, Punto[]>;
  ripieghi: Map<string, Punto[]>;
}

function aggiungi(mappa: Map<string, Punto[]>, chiave: string, punto: Punto): void {
  if (!chiave) return;
  const lista = mappa.get(chiave) ?? [];
  if (!lista.some((p) => p.titolo === punto.titolo)) lista.push(punto);
  mappa.set(chiave, lista);
}

function indicizza(indice: IndiceLuoghi, varianti: string[], punto: Punto): void {
  for (const v of varianti) {
    aggiungi(indice.nomi, v, punto);
    aggiungi(indice.compatti, v.replace(/ /g, ""), punto);
    const ripiego = v.split(/ (?:DI|DEL|DELLA|DELLO|DELLE|DEI|DEGLI|DE|IN|A|AL|ALLA|SUL|SULLA|SOPRA|SOTTO) /)[0];
    if (ripiego !== v) aggiungi(indice.ripieghi, ripiego, punto);
  }
}

/** Valle o regione della voce: "in Val di Pesa." -> "VAL DI PESA"; vuoto se manca. */
export function contestoNorm(contesto: string): string {
  // "(Jampereta) nel Val d'Arno casentinese." -> "VAL D ARNO CASENTINESE"
  const primo = contesto.replace(/\([^)]*\)/g, " ").split(/[.;]|\s[–—-]\s/)[0] ?? "";
  return normalizzaNome(primo).replace(/^(?:IN|NEL|NELLA|NELLO|NEI|FRA|TRA|SUL|SULLA|PRESSO)\s+/, "");
}

const PAROLE_VUOTE_CONTESTO = new Set([
  "VAL", "VALLE", "VALLI", "VALLECOLA", "DI", "DEL", "DELLA", "DELLO", "DELLE", "DEI", "IN", "NEL", "NELLA", "E", "LA",
  "IL", "FRA", "TRA", "SOPRA", "SOTTO", "PRESSO", "GIA", "DETTO", "DETTA", "O", "SUL", "SULLA", "ALTA", "BASSA",
]);

/** Parole significative di un contesto ("VALLE DEL SENIO IN ROMAGNA" -> SENIO, ROMAGNA). */
function paroleContesto(contesto: string): string[] {
  return contesto.split(" ").filter((p) => p.length > 2 && !PAROLE_VUOTE_CONTESTO.has(p));
}

/** Contesto dal campo `context` o, se vuoto, dalla qualificazione del titolo ("SAN CASCIANO in Val di Pesa"). */
function contestoVoce(titolo: string, contesto: string): string {
  const daContesto = contestoNorm(pulisciTesto(contesto));
  if (daContesto) return daContesto;
  const qualifica = pulisciTesto(titolo).match(/\s(?:nella|nel|in|nello|fra|tra)\s+(.*)$/i);
  return qualifica ? contestoNorm(qualifica[1]) : "";
}

/** Riferimenti che sono nomi comuni ("del Borgo", "di questa città"): non si risolvono. */
const RIFERIMENTI_GENERICI = new Set([
  "BORGO", "PORTA", "BAGNO", "BAGNI", "PIEVE", "CASTELLO", "PIAZZA", "PONTE", "VILLA", "BADIA", "CHIESA",
  "CITTA", "TERRA", "CAPOLUOGO", "CAPITALE", "PAESE", "QUESTA CITTA", "DETTA CITTA", "ESSA", "ESSO", "QUESTA",
]);

function scegli(
  candidati: Punto[],
  chiave: string,
  contesto: string,
  diocesi: string,
): { punto: Punto | null; ambiguo: boolean } {
  if (candidati.length === 1) return { punto: candidati[0], ambiguo: false };
  let scelti = candidati;
  // Ogni criterio restringe la scelta solo se lascia almeno un candidato.
  const restringi = (filtro: (c: Punto) => boolean) => {
    const rimasti = scelti.filter(filtro);
    if (rimasti.length > 0) scelti = rimasti;
  };
  if (contesto) {
    const parole = paroleContesto(contesto);
    const punteggio = (c: Punto) => paroleContesto(c.contesto).filter((p) => parole.includes(p)).length;
    const massimo = Math.max(...scelti.map(punteggio));
    if (massimo > 0) restringi((c) => punteggio(c) === massimo);
  }
  restringi((c) => c.base === chiave);
  if (diocesi) restringi((c) => normalizzaNome(c.diocesi) === normalizzaNome(diocesi));
  if (scelti.length === 1) return { punto: scelti[0], ambiguo: false };
  const perPeso = [...scelti].sort((a, b) => b.peso - a.peso);
  if (perPeso[0].peso >= 3 * perPeso[1].peso) return { punto: perPeso[0], ambiguo: false };
  const vicini = scelti.every((c) => distanzaKm(c, scelti[0]) <= 3);
  return vicini ? { punto: scelti[0], ambiguo: false } : { punto: null, ambiguo: true };
}

/**
 * Risolve il nome di un luogo di riferimento in un punto con coordinate. Fra
 * omonimi preferisce, nell'ordine: lo stesso contesto (valle, cercata nel
 * contesto e nel titolo del candidato), il titolo identico, la stessa diocesi, la voce di gran lunga più lunga; se restano
 * candidati lontani fra loro (più di 3 km) il riferimento è ambiguo.
 * `contesto` è già normalizzato (vedi `contestoNorm`).
 */
export function risolviRiferimento(
  nome: string,
  indice: IndiceLuoghi,
  contesto = "",
  diocesi = "",
): { punto: Punto | null; ambiguo: boolean } {
  const chiave = normalizzaNome(nome);
  if (RIFERIMENTI_GENERICI.has(chiave)) return { punto: null, ambiguo: false };
  // Tutti gli omonimi, anche per nome compatto o abbreviato ("PALAZZUOLO" ->
  // "PALAZZUOLO DI ROMAGNA"): la scelta la fa il contesto, poi il titolo identico.
  const candidati = [
    ...new Set([
      ...(indice.nomi.get(chiave) ?? []),
      ...(indice.compatti.get(chiave.replace(/ /g, "")) ?? []),
      ...(indice.ripieghi.get(chiave) ?? []),
    ]),
  ];
  if (candidati.length === 0) return { punto: null, ambiguo: false };
  return scegli(candidati, chiave, contesto, diocesi);
}

/** Destinazione di un rinvio: "Vedere BERARDENGA (CASTELNUOVO DELLA)." -> titolo con coordinate. */
function destinazioneRinvio(testa: string, perTitoloNorm: Map<string, Punto>): Punto | null {
  const destinazione = normalizzaNome(testa.replace(/^(?:Vedere|Vedi|V\.)\s+/i, ""));
  const parole = destinazione.split(" ");
  for (let n = parole.length; n > 0; n--) {
    const punto = perTitoloNorm.get(parole.slice(0, n).join(" "));
    if (punto) return punto;
  }
  return null;
}

export interface RisultatoRepetti {
  luoghi: LuogoRepetti[];
  statistiche: {
    voci: number;
    rinvii: number;
    luoghi: number;
    con_coordinate: number;
    calcolate: number;
    riferimento_non_trovato: number;
    riferimento_ambiguo: number;
    coordinate_incoerenti: number;
    /** Errore della posizione calcolata dove le coordinate sono note (km). */
    verifica: { campioni: number; mediana_km: number | null; p90_km: number | null };
  };
}

function percentile(valori: number[], p: number): number | null {
  if (valori.length === 0) return null;
  const ordinati = [...valori].sort((a, b) => a - b);
  return ordinati[Math.min(ordinati.length - 1, Math.floor((p / 100) * ordinati.length))];
}

/** Tabella dei luoghi del Repetti, con coordinate note o calcolate dalla distanza. */
export function costruisciLuoghi(
  volumi: { volume: string; articoli: ArticoloRepetti[] }[],
  coordinate: CoordinataRepetti[],
): RisultatoRepetti {
  const perTitolo = new Map<string, CoordinataRepetti>();
  for (const c of coordinate) perTitolo.set(c.title, c);

  const indice: IndiceLuoghi = { nomi: new Map(), compatti: new Map(), ripieghi: new Map() };
  const perTitoloNorm = new Map<string, Punto>();
  for (const { articoli } of volumi) {
    for (const a of articoli) {
      const c = perTitolo.get(a.title);
      if (!c || c.latitude === null || c.longitude === null || c.type !== "place") continue;
      const varianti = variantiTitolo(a.title);
      const punto: Punto = {
        lat: c.latitude,
        lng: c.longitude,
        titolo: a.title,
        contesto: normalizzaNome(`${pulisciTesto(a.context ?? "")} ${pulisciTesto(a.title)}`),
        peso: a.body.length,
        base: varianti[0] ?? "",
        diocesi: nomeDopo(intestazione(a.body), "Diocesi"),
      };
      indicizza(indice, varianti, punto);
      perTitoloNorm.set(normalizzaNome(pulisciTesto(a.title)), punto);
    }
  }
  // I rinvii ("CASTELNUOVO BERARDENGA – Vedere BERARDENGA (CASTELNUOVO DELLA)")
  // sono nomi alternativi del luogo di destinazione.
  for (const { articoli } of volumi) {
    for (const a of articoli) {
      const testa = intestazione(a.body);
      if (!eRinvio(testa)) continue;
      const punto = destinazioneRinvio(testa, perTitoloNorm);
      const varianti = variantiTitolo(a.title);
      if (punto) indicizza(indice, varianti, { ...punto, base: varianti[0] ?? "" });
    }
  }

  const luoghi: LuogoRepetti[] = [];
  const errori: number[] = [];
  let voci = 0;
  let rinvii = 0;
  for (const { volume, articoli } of volumi) {
    for (const a of articoli) {
      voci++;
      const c = perTitolo.get(a.title);
      const testa = intestazione(a.body);
      if (c?.type === "reference" || c?.type === "group" || eRinvio(testa)) {
        rinvii++;
        continue;
      }
      const contesto = pulisciTesto(a.context ?? "");
      const diocesi = nomeDopo(testa, "Diocesi");
      const distanza = estraiDistanza(testa);
      const note: string[] = [];
      let lat = c?.latitude ?? null;
      let lng = c?.longitude ?? null;
      let fonte = lat !== null && lng !== null ? (c?.point_source ?? "") : "";
      let riferimentoTitolo = "";

      if (distanza) {
        const { punto, ambiguo } = risolviRiferimento(
          distanza.riferimento,
          indice,
          contestoVoce(a.title, a.context ?? ""),
          diocesi,
        );
        if (punto && punto.titolo !== a.title) {
          riferimentoTitolo = punto.titolo;
          const calcolato = spostaPunto(punto.lat, punto.lng, distanza.miglia * MIGLIO_TOSCANO_KM, distanza.gradi);
          if (lat !== null && lng !== null) {
            const errore = distanzaKm({ lat, lng }, calcolato);
            errori.push(errore);
            // Coordinate note e testo del Repetti in disaccordo: una delle due è sbagliata.
            if (errore > SOGLIA_INCOERENZA_KM) note.push("coordinate_incoerenti");
          } else {
            lat = calcolato.lat;
            lng = calcolato.lng;
            fonte = "distanza";
          }
        } else if (ambiguo) {
          note.push("riferimento_ambiguo");
        } else if (!punto) {
          note.push("riferimento_non_trovato");
        }
      }

      luoghi.push({
        titolo: a.title,
        volume,
        slug: a.slug ?? "",
        contesto,
        tipo: estraiTipo(testa),
        dedicazione: estraiDedicazione(testa, a.title),
        piviere: estraiPiviere(testa),
        comunita: nomeDopo(testa, "Comunità"),
        giurisdizione: nomeDopo(testa, "Giurisdizione"),
        diocesi,
        compartimento: nomeDopo(testa, "Compartimento"),
        distanza,
        riferimento_titolo: riferimentoTitolo,
        lat,
        lng,
        fonte_coordinate: fonte,
        note,
        intestazione: testa.length > 500 ? `${testa.slice(0, 500)}…` : testa,
      });
    }
  }

  return {
    luoghi,
    statistiche: {
      voci,
      rinvii,
      luoghi: luoghi.length,
      con_coordinate: luoghi.filter((l) => l.lat !== null).length,
      calcolate: luoghi.filter((l) => l.fonte_coordinate === "distanza").length,
      riferimento_non_trovato: luoghi.filter((l) => l.note.includes("riferimento_non_trovato")).length,
      riferimento_ambiguo: luoghi.filter((l) => l.note.includes("riferimento_ambiguo")).length,
      coordinate_incoerenti: luoghi.filter((l) => l.note.includes("coordinate_incoerenti")).length,
      verifica: { campioni: errori.length, mediana_km: percentile(errori, 50), p90_km: percentile(errori, 90) },
    },
  };
}
