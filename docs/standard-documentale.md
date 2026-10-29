# Standard documentale · Documentation standard

| Campo · Field | Valore · Value |
|---|---|
| Identificativo · Identifier | `CAT-DOC-00` |
| Titolo · Title | Standard documentale del progetto Catasto Fiorentino 1427/30 · Documentation standard of the Catasto Fiorentino 1427/30 project |
| Versione · Version | 1.0 |
| Data · Date | 2026-10-29 |
| Stato · Status | Approvato · Approved |
| Classificazione · Classification | Pubblico · Public |
| Responsabili · Owners | Antonio Orfitelli, Pasquale Ruotolo |
| Lingua · Language | Italiano e inglese (testo unico bilingue) · Italian and English (single bilingual text) |

> **IT** — Questo documento fissa le regole che tutta la documentazione del progetto segue: struttura dei documenti, metadati di controllo, gestione delle due lingue, terminologia storica e archivistica, citazione delle fonti.
>
> **EN** — This document sets the rules followed by all project documentation: document structure, control metadata, handling of the two languages, historical and archival terminology, citation of sources.

---

## 1. Ambito e riferimenti · Scope and references

**IT.** Lo standard si applica a tutti i documenti in `docs/`, al `readme.md` del repository e alle loro traduzioni. Non si applica ai commenti nel codice né ai testi dell'interfaccia (che seguono `frontend-catasto/src/i18n/`).

I documenti si ispirano ai seguenti riferimenti, adattati alla natura del progetto (un portale che pubblica dati derivati da una fonte archivistica):

| Riferimento | Uso nel progetto |
|---|---|
| ISO 8601 | Date e orari contemporanei (`AAAA-MM-GG`) |
| ISO 639-1 | Codici di lingua (`it`, `en`) |
| Semantic Versioning 2.0.0 | Numerazione delle versioni dei documenti |
| ICA, *ISAD(G): General International Standard Archival Description*, 2ª ed., 2000 | Livelli di descrizione della fonte (fondo, serie, unità, carta) |
| ICA, *ISAAR(CPF)*, 2ª ed., 2004 | Indicazione dei soggetti produttori (ufficiali del catasto, contribuenti) |
| WCAG 2.1 | Requisito di accessibilità richiamato nei documenti di prodotto |

**EN.** The standard applies to every document in `docs/`, to the repository `readme.md` and to their translations. It does not apply to code comments or to interface text (which follows `frontend-catasto/src/i18n/`).

The documents draw on the following references, adapted to the nature of the project (a portal publishing data derived from an archival source):

| Reference | Use in the project |
|---|---|
| ISO 8601 | Modern dates and times (`YYYY-MM-DD`) |
| ISO 639-1 | Language codes (`it`, `en`) |
| Semantic Versioning 2.0.0 | Version numbering of documents |
| ICA, *ISAD(G): General International Standard Archival Description*, 2nd ed., 2000 | Levels of description of the source (fonds, series, file, folio) |
| ICA, *ISAAR(CPF)*, 2nd ed., 2004 | Naming of record creators (catasto officials, taxpayers) |
| WCAG 2.1 | Accessibility requirement referred to in product documents |

---

## 2. Registro dei documenti · Document register

| ID | Italiano (testo di riferimento) | English (translation) | Classificazione · Classification |
|---|---|---|---|
| CAT-README | [readme.md](../readme.md) | [README.en.md](../README.en.md) | Pubblico · Public |
| CAT-DOC-00 | [Standard documentale](standard-documentale.md) | (bilingue · bilingual) | Pubblico · Public |
| CAT-DOC-01 | [Installazione e deployment](guides.md) | [Installation and deployment](en/installation.md) | Pubblico · Public |
| CAT-DOC-02 | [Architettura e modello dati](architettura.md) | [Architecture and data model](en/architecture.md) | Pubblico · Public |
| CAT-DOC-03 | [Backend e API](backend.md) | [Backend and API](en/backend.md) | Pubblico · Public |
| CAT-DOC-04 | [Frontend](frontend.md) | [Frontend](en/frontend.md) | Pubblico · Public |
| CAT-DOC-05 | [Casi d'uso](casi-d-uso.md) | [Use cases](en/use-cases.md) | Pubblico · Public |
| CAT-DOC-06 | [Revisione del codice](revisione-codice.md) | [Code review](en/code-review.md) | Interno · Internal |

**IT.** Il testo italiano è il **testo di riferimento**: in caso di divergenza prevale. Ogni modifica a un documento va riportata nella traduzione nello stesso commit, con lo stesso numero di versione.

**EN.** The Italian text is the **reference text**: it prevails in case of discrepancy. Every change to a document must be carried over to its translation in the same commit, with the same version number.

---

## 3. Struttura di ogni documento · Structure of every document

**IT.** Ogni documento contiene, nell'ordine:

1. **Titolo** di primo livello, seguito da un collegamento alla versione nell'altra lingua (`🇮🇹 Italiano · 🇬🇧 English`).
2. **Scheda di controllo**: tabella con identificativo, versione, data, stato, classificazione, responsabili, lingua, documenti collegati.
3. **Scopo e destinatari**: un paragrafo che dice a chi serve il documento e cosa contiene.
4. **Corpo**, in sezioni numerate (`## 1.`, `### 1.1`).
5. **Riferimenti e fonti**, quando il documento cita dati o fonti storiche.
6. **Registro delle modifiche**: tabella con versione, data, autore, descrizione.

**EN.** Every document contains, in this order:

1. A first-level **title**, followed by a link to the version in the other language (`🇮🇹 Italiano · 🇬🇧 English`).
2. A **control sheet**: a table with identifier, version, date, status, classification, owners, language, related documents.
3. **Purpose and audience**: one paragraph stating who the document is for and what it contains.
4. **Body**, in numbered sections (`## 1.`, `### 1.1`).
5. **References and sources**, when the document cites data or historical sources.
6. **Change log**: a table with version, date, author, description.

### 3.1 Valori ammessi · Allowed values

| Campo · Field | Valori · Values |
|---|---|
| Stato · Status | Bozza · Draft — In revisione · Under review — Approvato · Approved — Superato · Superseded |
| Classificazione · Classification | **Pubblico · Public**: pubblicabile senza limiti · may be published freely. **Interno · Internal**: destinato al gruppo di progetto, non contiene segreti · meant for the project team, contains no secrets. **Riservato · Confidential**: non va mai nel repository · never goes into the repository. |
| Versione · Version | `MAGGIORE.MINORE` · `MAJOR.MINOR`: la minore per correzioni e aggiunte, la maggiore per riorganizzazioni · minor for fixes and additions, major for reorganisations |

**IT.** Nessun documento del repository può contenere credenziali, token, indirizzi interni o dati personali degli utenti: i valori di esempio sono sempre fittizi e dichiarati tali.

**EN.** No document in the repository may contain credentials, tokens, internal addresses or users' personal data: example values are always fictitious and stated as such.

---

## 4. Convenzioni di scrittura · Writing conventions

| | Italiano | English |
|---|---|---|
| Registro · Register | Impersonale o seconda persona singolare nelle procedure | Imperative mood in procedures, neutral third person elsewhere |
| Date contemporanee · Modern dates | `2026-10-29` (ISO 8601) | `2026-10-29` (ISO 8601) |
| Numeri · Numbers | `61.000`, `12,5` | `61,000`, `12.5` |
| Identificatori di codice · Code identifiers | In `monospazio`, mai tradotti | In `monospace`, never translated |
| Termini storici · Historical terms | In tondo | In *italics*, untranslated, with a gloss at first use: *fuoco* (household) |
| Diagrammi · Diagrams | Mermaid; le etichette seguono la lingua del documento | Mermaid; labels follow the document's language |
| Esempi · Examples | Dichiarati illustrativi quando contengono nomi o valori | Stated as illustrative when they contain names or values |

---

## 5. Convenzioni storiche e archivistiche · Historical and archival conventions

### 5.1 Denominazione della fonte · Naming the source

**IT.** La fonte si indica come **Catasto fiorentino del 1427/30**: la barra indica l'arco della campagna di rilevazione (1427–1430), non un'alternativa tra due anni. Forma breve ammessa: *Catasto 1427*.

**EN.** The source is referred to as the **Florentine Catasto of 1427/30**: the slash indicates the span of the survey campaign (1427–1430), not an alternative between two years. Accepted short form: *Catasto 1427*.

### 5.2 Livelli di descrizione · Levels of description

**IT.** I documenti usano i livelli di ISAD(G) per collocare il dato nella fonte. Il termine *serie* ha due significati e va sempre qualificato.

**EN.** Documents use the ISAD(G) levels to place each datum in the source. The term *serie* has two meanings and must always be qualified.

| Livello ISAD(G) · ISAD(G) level | Nel progetto · In the project | Esempio · Example |
|---|---|---|
| Istituto conservatore · Repository | Archivio di Stato di Firenze (ASFi) | — |
| Fondo · Fonds | Catasto | `ASFi, Catasto` |
| Serie archivistica · Archival series | *Campioni* (registri ufficiali) e *portate* (dichiarazioni) · *campioni* (official registers) and *portate* (declarations) | — |
| Unità · File | Volume del campione (`Volume_Fuoco`) · Volume of the *campione* | `vol. 80` (illustrativo · illustrative) |
| Componente · Item | Carta, recto/verso (`Foglio_Fuoco`) · Folio, recto/verso | `c. 12r` (illustrativo · illustrative) |

> **IT** — Nel modello dati, il campo **Serie** (città, contado, distretto) è una **ripartizione territoriale** dei fuochi, non una serie archivistica. Nei documenti si scrive "serie territoriale" quando c'è rischio di ambiguità.
>
> **EN** — In the data model, the **Serie** field (city, contado, district) is a **territorial division** of the households, not an archival series. Documents write "territorial series" whenever ambiguity may arise.

### 5.3 Segnature · Shelfmarks

**IT.** Forma: `ASFi, Catasto, <volume>, c. <n><r|v>` (più carte: `cc. 12r-14v`). Il portale aggiunge in automatico il prefisso `ASFi, Catasto` alle segnature della portata raccolte con le segnalazioni. Le segnature non verificate dalla redazione non si citano come certe.

**EN.** Form: `ASFi, Catasto, <volume>, c. <n><r|v>` (several folios: `cc. 12r-14v`). The portal automatically adds the prefix `ASFi, Catasto` to the *portata* shelfmarks collected through user reports. Shelfmarks not verified by the editors are never cited as certain.

### 5.4 Date storiche · Historical dates

**IT.** A Firenze l'anno iniziava il 25 marzo (stile fiorentino, *ab incarnatione*). Una data storica tra il 1° gennaio e il 24 marzo si scrive con la doppia indicazione e la sigla dello stile: `12 febbraio 1427/28 (st. fior.)`. Le date contemporanee seguono ISO 8601 (§4).

**EN.** In Florence the year began on 25 March (Florentine style, *ab incarnatione*). A historical date between 1 January and 24 March is written with the double year and the style abbreviation: `12 February 1427/28 (Flor. style)`. Modern dates follow ISO 8601 (§4).

### 5.5 Valori monetari · Monetary values

**IT.** I valori economici (fortune, credito, credito ai Monti, deduzioni, imponibile) sono espressi in **fiorini**, come nei dati di origine; i documenti non li convertono e non li arrotondano. Abbreviazione: `fl.`

**EN.** Economic values (*fortune*, credit, credit in the Monte, deductions, taxable assets) are expressed in **florins**, as in the source data; documents neither convert nor round them. Abbreviation: `fl.`

### 5.6 Provenienza e integrità del dato · Provenance and data integrity

**IT.** Ogni documento che descrive dati distingue tre livelli di provenienza:

1. **dato della fonte**: trascritto dalla ricerca Herlihy–Klapisch-Zuber e digitalizzato da ACRH;
2. **dato contribuito**: proposto da un utente con una segnalazione e pubblicato solo dopo la verifica della redazione (es. segnatura della portata);
3. **dato derivato**: calcolato dal portale (statistiche, traduzioni dei valori, ordinamenti).

Un dato assente nella fonte resta assente: non si stima e non si ricostruisce.

**EN.** Every document describing data distinguishes three levels of provenance:

1. **source datum**: transcribed by the Herlihy–Klapisch-Zuber research and digitised by ACRH;
2. **contributed datum**: proposed by a user through a report and published only after editorial verification (e.g. the *portata* shelfmark);
3. **derived datum**: computed by the portal (statistics, value translations, orderings).

A datum missing from the source stays missing: it is neither estimated nor reconstructed.

### 5.7 Citazione delle fonti · Citing sources

**IT.** Le opere si citano per esteso nella sezione *Riferimenti e fonti* con la forma `Cognome, Nome. *Titolo*. Luogo: Editore, anno.`; nel testo basta la forma breve `Cognome, *Titolo breve*`. Riferimenti di base del progetto:

- Herlihy, David, e Christiane Klapisch-Zuber. *Les Toscans et leurs familles. Une étude du catasto florentin de 1427*. Paris: Presses de la Fondation nationale des sciences politiques – Éditions de l'EHESS, 1978.
- Dati digitalizzati: ACRH, <https://journals.openedition.org/acrh/7458>.
- Immagini: Archivio di Stato di Firenze, Archivio digitale ICAR, servizio IIIF.

**EN.** Works are cited in full in the *References and sources* section in the form `Surname, Name. *Title*. Place: Publisher, year.`; the short form `Surname, *Short title*` is enough in the text. Core references of the project:

- Herlihy, David, and Christiane Klapisch-Zuber. *Les Toscans et leurs familles. Une étude du catasto florentin de 1427*. Paris: Presses de la Fondation nationale des sciences politiques – Éditions de l'EHESS, 1978.
- Digitised data: ACRH, <https://journals.openedition.org/acrh/7458>.
- Images: Archivio di Stato di Firenze, ICAR digital archive, IIIF service.

---

## 6. Terminologia controllata · Controlled terminology

**IT.** Le traduzioni inglesi devono usare questi equivalenti, gli stessi del glossario dell'interfaccia (`frontend-catasto/src/i18n/glossary.ts`). Una modifica qui va riportata là, e viceversa.

**EN.** English translations must use these equivalents, the same as the interface glossary (`frontend-catasto/src/i18n/glossary.ts`). A change here must be carried over there, and vice versa.

| Italiano | English | Nota · Note |
|---|---|---|
| Catasto | *catasto* | Non tradurre con "land registry" · Do not translate as "land registry" |
| Fuoco | *fuoco* (household) | Unità del catasto · Unit of the catasto |
| Capofamiglia | head of household | |
| Parente | family member | Tabella `parenti` · `parenti` table |
| Portata | *portata* (declaration) | Dichiarazione del contribuente · Taxpayer's declaration |
| Campione | *campione* (official register) | |
| Carta (c.), recto, verso | folio (c.), recto, verso | |
| Segnatura | shelfmark | |
| Fortune | *fortune* (property) | |
| Credito | credit | |
| Credito ai Monti | credit in the Monte | Debito pubblico · Public debt |
| Deduzioni | deductions | |
| Imponibile | taxable assets | |
| Bocche | *bocche* (dependants) | |
| Serie (territoriale) | territorial series | Città, contado, distretto · City, *contado*, district |
| Quartiere / Gonfalone | quarter / *gonfalone* | |
| Piviere | *piviere* (pieve district) | |
| Popolo | *popolo* (parish) | |
| Mestiere | occupation | |
| Fiorino (fl.) | florin (fl.) | |
| Segnalazione | user report | |
| Redazione | editorial team (editors) | |
| Moderazione | moderation | |
| Ricerca semplice / avanzata | simple / advanced search | |
| Banco di lavoro | workbench | |
| Visore delle carte | folio viewer | |
| Scheda del fuoco | household record | |

---

## 7. Registro delle modifiche · Change log

| Versione · Version | Data · Date | Autore · Author | Descrizione · Description |
|---|---|---|---|
| 1.0 | 2026-10-29 | Pasquale Ruotolo | Prima emissione · First issue |
