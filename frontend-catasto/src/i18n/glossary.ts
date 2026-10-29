import { FIELD_REGISTRY } from "@catasto/shared";
import type { Lang } from "./language";

/**
 * Glossario: unica fonte dei termini tecnici mostrati nei suggerimenti
 * (tabella, scheda del fuoco, filtri, ricerca avanzata, statistiche) e nella
 * pagina /glossario.
 *
 * Nessuna definizione inventata: i testi italiani riprendono il glossario di
 * docs/architettura.md (sezione "Glossario"), quelli inglesi ne sono la
 * traduzione. Vanno rivisti dagli autori prima di aggiungere o ampliare voci;
 * un termine senza una definizione verificata non entra qui.
 */

type Text = Record<Lang, string>;

export interface GlossaryEntry {
  id: string;
  term: Text;
  /** Una riga: compare nel suggerimento accanto all'etichetta. */
  short: Text;
  /** Facoltativa: completa la voce nella pagina del glossario. */
  long?: Text;
}

export const GLOSSARY: readonly GlossaryEntry[] = [
  {
    id: "fuoco",
    term: { it: "Fuoco", en: "Fuoco (household)" },
    short: {
      it: "Nucleo familiare censito: l'unità del catasto, intestata al capofamiglia.",
      en: "A registered household: the unit of the catasto, recorded under the name of its head.",
    },
  },
  {
    id: "portata",
    term: { it: "Portata", en: "Portata" },
    short: {
      it: "Dichiarazione presentata dal contribuente.",
      en: "The declaration submitted by the taxpayer.",
    },
    long: {
      it: "La sua segnatura non è nei dati ACRH: viene raccolta con le segnalazioni degli utenti e pubblicata dopo la verifica della redazione.",
      en: "Its shelfmark is not in the ACRH data: it is collected through user reports and published after review by the editors.",
    },
  },
  {
    id: "campione",
    term: { it: "Campione", en: "Campione" },
    short: {
      it: "Registro ufficiale redatto dagli ufficiali del catasto.",
      en: "The official register compiled by the catasto officials.",
    },
    long: {
      it: "Volume e carta indicati per ogni fuoco si riferiscono al campione.",
      en: "The volume and folio given for each household refer to the campione.",
    },
  },
  {
    id: "carta",
    term: { it: "Carta (c.)", en: "Carta (folio, c.)" },
    short: {
      it: "Foglio del registro, con recto (r) e verso (v).",
      en: "A leaf of the register, with recto (r) and verso (v).",
    },
  },
  {
    id: "fortune",
    term: { it: "Fortune", en: "Fortune" },
    short: {
      it: "Componente del patrimonio in fiorini: i beni.",
      en: "A component of wealth in florins: property.",
    },
    long: {
      it: "Con credito e credito ai monti è una delle componenti del patrimonio registrate in fiorini.",
      en: "Together with credit and credit in the Monte, one of the components of wealth recorded in florins.",
    },
  },
  {
    id: "credito",
    term: { it: "Credito", en: "Credit" },
    short: {
      it: "Componente del patrimonio in fiorini: i crediti privati.",
      en: "A component of wealth in florins: private credits.",
    },
  },
  {
    id: "credito_m",
    term: { it: "Credito ai Monti", en: "Credit in the Monte" },
    short: {
      it: "Componente del patrimonio in fiorini: i crediti sul debito pubblico.",
      en: "A component of wealth in florins: credits on the public debt.",
    },
  },
  {
    id: "deduzioni",
    term: { it: "Deduzioni", en: "Deductions" },
    short: {
      it: "Detrazioni: bocche a carico, debiti, abitazione.",
      en: "Allowances: dependants (bocche), debts, dwelling.",
    },
  },
  {
    id: "imponibile",
    term: { it: "Imponibile", en: "Taxable assets" },
    short: {
      it: "Base tassabile risultante.",
      en: "The resulting taxable base.",
    },
  },
  {
    id: "serie",
    term: { it: "Serie", en: "Series" },
    short: {
      it: "Città, contado o distretto.",
      en: "City, contado (countryside) or district.",
    },
  },
  {
    id: "quartiere",
    term: { it: "Quartiere / Gonfalone", en: "Quarter / Gonfalone" },
    short: {
      it: "Suddivisione urbana di Firenze.",
      en: "An urban division of Florence.",
    },
    long: {
      it: "I quartieri sono Santo Spirito, Santa Croce, Santa Maria Novella e San Giovanni.",
      en: "The quarters are Santo Spirito, Santa Croce, Santa Maria Novella and San Giovanni.",
    },
  },
  {
    id: "piviere",
    term: { it: "Piviere", en: "Piviere (pieve)" },
    short: {
      it: "Circoscrizione ecclesiastica usata come unità territoriale.",
      en: "An ecclesiastical district used as a territorial unit.",
    },
  },
  {
    id: "popolo",
    term: { it: "Popolo", en: "Popolo (parish)" },
    short: {
      it: "Circoscrizione ecclesiastica usata come unità territoriale.",
      en: "An ecclesiastical district used as a territorial unit.",
    },
  },
  {
    id: "asfi",
    term: { it: "ASFi", en: "ASFi" },
    short: {
      it: "Archivio di Stato di Firenze.",
      en: "Archivio di Stato di Firenze (State Archives of Florence).",
    },
  },
];

export type GlossaryId = (typeof GLOSSARY)[number]["id"];

const INDEX = new Map(GLOSSARY.map((entry) => [entry.id, entry]));

export const getGlossaryEntry = (id: string): GlossaryEntry | undefined => INDEX.get(id);

/** Ancora della voce nella pagina /glossario. */
export const glossaryAnchor = (id: string) => `termine-${id}`;

/**
 * Termine del glossario di ogni campo interrogabile. Ogni chiave del
 * FIELD_REGISTRY deve comparire: `null` = nessun termine tecnico da spiegare
 * oppure nessuna definizione verificata. Un test lo controlla, così un campo
 * nuovo obbliga a decidere.
 */
export const FIELD_TERMS: Record<string, string | null> = {
  nome: "fuoco",
  volume: "campione",
  foglio: "carta",
  fortune: "fortune",
  credito: "credito",
  credito_m: "credito_m",
  imponibile: "imponibile",
  deduzioni: "deduzioni",
  mestiere: null,
  bestiame: null,
  immigrazione: null,
  rapporto: null,
  casa: null,
  serie: "serie",
  quartiere: "quartiere",
  piviere: "piviere",
  popolo: "popolo",
  particolarita_parente: null,
  eta_parente: null,
  segnatura_portata: "portata",
};

export const fieldTerm = (fieldKey: string): GlossaryEntry | undefined => {
  const id = FIELD_TERMS[fieldKey];
  return id ? getGlossaryEntry(id) : undefined;
};

/** Campi del registry senza una decisione nel glossario: deve restare vuoto. */
export const FIELDS_WITHOUT_GLOSSARY_DECISION = FIELD_REGISTRY.map((f) => f.key).filter((key) => !(key in FIELD_TERMS));
