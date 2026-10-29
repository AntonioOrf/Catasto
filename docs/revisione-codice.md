# Revisione del codice

🇮🇹 **Italiano** · 🇬🇧 [English](en/code-review.md)

| Campo | Valore |
|---|---|
| Identificativo | `CAT-DOC-06` |
| Versione | 2.0 |
| Data | 2026-10-29 |
| Stato | Approvato |
| Classificazione | Interno |
| Responsabili | Antonio Orfitelli, Pasquale Ruotolo |
| Lingua | Italiano (testo di riferimento) |
| Traduzione | [Code review](en/code-review.md) |
| Documenti collegati | [Standard documentale](standard-documentale.md) (`CAT-DOC-00`) · [Installazione e deployment](guides.md) (`CAT-DOC-01`) · [Architettura e modello dati](architettura.md) (`CAT-DOC-02`) · [Backend e API](backend.md) (`CAT-DOC-03`) · [Frontend](frontend.md) (`CAT-DOC-04`) · [Casi d'uso](casi-d-uso.md) (`CAT-DOC-05`) · [README](../readme.md) |

## 1. Scopo e destinatari

Il documento è destinato al gruppo di progetto (sviluppatori e manutentori del portale del Catasto fiorentino del 1427/30). Riporta l'esito della revisione del codice di settembre 2026 su backend, frontend, pacchetto condiviso, CI e deploy, eseguita sul commit `bb2e93a`, e la chiusura dei punti rimasti aperti avvenuta a ottobre 2026 (issue #38). Sono riportati solo i problemi verificati leggendo il codice (alcuni anche riprodotti); per ciascuno c'è uno scenario concreto e la correzione adottata.

## 2. Sintesi

### 2.1 Stato della pipeline

`npm ci`, `npm run build`, lint del frontend, `tsc --noEmit` di backend e frontend e `npm test` passano. Test al momento della revisione: 59 nel backend, 14 nel frontend, tutti verdi.

### 2.2 Esito

Tutti i problemi elencati sono stati corretti nella stessa tornata di lavoro, ciascuno con i test relativi (ora 73 nel backend e 42 nel frontend). Il dettaglio (§4) descrive il problema originale e, in fondo a ogni voce, la correzione. I punti rimasti aperti in R-16 e in "Altre osservazioni" (§5) sono stati chiusi a ottobre 2026 (issue #38): vedi [§6 Aggiornamento di ottobre 2026](#6-aggiornamento-di-ottobre-2026).

### 2.3 SQL injection

Nessuna trovata. Colonne, join e ordinamenti arrivano da whitelist; tutti i valori sono parametrizzati; i parametri non scalari (`?x[]=`) sono rifiutati.

## 3. Priorità

| Severità | # | Area | Problema | Stato |
|---|---|---|---|---|
| Alta | R-1 | Ricerca avanzata | Opzioni geografiche unite (`"3,7"`) confrontate come stringa: risultati parziali | corretto |
| Media | R-2 | Deploy | Migrazioni non documentate né automatiche: senza `fuoco_segnature` la tabella risponde 500 | corretto |
| Media | R-3 | Paginazione | Ordinamento senza chiave univoca: righe ripetute o saltate fra le pagine | corretto |
| Media | R-4 | Frontend | Nessun indicatore di caricamento dopo il primo | corretto |
| Media | R-5 | Frontend | Clic nell'indice su un fuoco di un'altra pagina: la riga non si apre | corretto |
| Media | R-6 | Visore delle carte | Gesti touch persi riaprendo lo stesso volume | corretto |
| Media | R-7 | Segnature | Revocare l'ultima segnatura non ripristina la precedente | corretto |
| Media-bassa | R-8 | Frontend | Link `#q=` malformato o query salvata corrotta: schermata bianca | corretto |
| Media-bassa | R-9 | Segnalazioni | "Rapporto mestiere": valore attuale sempre vuoto | corretto |
| Bassa | R-10 | Frontend | "Salva filtro" non funziona in HTTP semplice | corretto |
| Bassa | R-11 | Backend | AST annidato oltre ~1000 livelli: 500 invece di 400 | corretto |
| Bassa | R-12 | Config | `TRUST_PROXY=true` blocca l'avvio | corretto |
| Bassa | R-13 | Frontend | Valori assenti mostrati come "0 fiorini"; età 0 mostrata come "-" | corretto |
| Bassa | R-14 | Frontend | Messaggi d'errore tecnici in inglese ("Failed to fetch") | corretto |
| Bassa | R-15 | Segnature | Segnatura senza `id_fuoco` accettabile ma non pubblicata | corretto |
| Bassa | R-16 | Accessibilità | Contrasto insufficiente e messaggi non annunciati | corretto |

## 4. Dettaglio

### 4.1 R-1 · Ricerca avanzata su serie territoriale, quartiere, piviere e popolo

`/api/filters` unisce le partizioni omonime e restituisce id come `"3,7"` (`backend-catasto/src/models/common.model.ts:18-21`). Il QueryBuilder li invia così come sono (`QueryBuilder.tsx:324,338`) e il compilatore dell'AST li usa come stringa singola (`query-ast-builder.ts:86-90`). MySQL converte `'3,7'` in `3`.

Qui "serie" indica la serie territoriale del modello dati (città, contado, distretto), non una serie archivistica (vedi [CAT-DOC-00 §5.2](standard-documentale.md#52-livelli-di-descrizione--levels-of-description)).

*Scenario*: "Quartiere è uguale a San Giovanni" restituisce solo i fuochi di San Giovanni (I). Con `neq` / `not_in` viene esclusa solo la prima partizione.

**Correzione**: le liste di id dei campi geografici vengono espanse nel compilatore dell'AST (`eq` → `IN`, `neq` → `NOT IN`, liste dentro `in`/`not_in` appiattite), con validazione come nella ricerca semplice.

### 4.2 R-2 · Migrazioni

`findAll` fa sempre `LEFT JOIN fuoco_segnature` (`fuoco.model.ts:23`). Il compose importa solo `init/Catasto.sql` e la documentazione non citava `db:migrate`.

*Scenario*: installazione nuova seguendo la guida → `GET /api/catasto` risponde 500 "Table doesn't exist".

**Correzione**: il container del backend esegue il runner delle migrazioni prima del server (`backend-catasto/Dockerfile`); la procedura manuale resta documentata per lo sviluppo (vedi [Installazione e deployment](guides.md)).

### 4.3 R-3 · Paginazione non deterministica

`buildOrderBy` (`query-builder.ts:188-211`) ordina su una sola colonna non univoca, senza `f.ID_Fuochi` come secondo criterio.

*Scenario*: `sort_by=fortune` con molti valori uguali a 0 → scorrendo le pagine alcuni fuochi compaiono due volte e altri mai. Lo stesso problema può far cadere su una pagina sbagliata il clic nell'indice laterale, che usa blocchi da 1000.

**Correzione**: ogni `ORDER BY` termina con `f.ID_Fuochi ASC`.

### 4.4 R-4 · Indicatori di caricamento

Con `placeholderData: keepPreviousData` React Query 5 riporta `isLoading = false` durante i cambi successivi (`useCatastoData.ts:21,28`). Skeleton, `aria-busy`, icona di Aggiorna e disabilitazione della paginazione non si attivano mai dopo il primo caricamento.

**Correzione**: `useCatastoData` espone `fetching` e `stale`: durante le richieste successive la tabella ha `aria-busy`, le righe vecchie sono attenuate, Aggiorna gira e la paginazione è disabilitata.

### 4.5 R-5 · Clic nell'indice verso un'altra pagina

Per lo stesso motivo di R-4, l'effetto in `HomePage.tsx:85-92` gira subito con i dati della pagina precedente, non trova la riga e azzera `targetScrolledId`.

*Scenario*: clic sulla 120ª voce dell'indice → la tabella passa a pagina 3 ma la riga non viene aperta né evidenziata.

**Correzione**: l'effetto attende che i dati della nuova pagina non siano più quelli segnaposto; con un errore rinuncia.

### 4.6 R-6 · Gesti touch nel visore delle carte

L'effetto che registra i listener touch dipende solo da `[imageUrl]` (`ArchivioViewerModal.tsx:118-172`), mentre il contenitore viene ricreato a ogni apertura. Riaprendo lo stesso fuoco `imageUrl` non cambia e il nuovo contenitore resta senza listener.

*Scenario*: su telefono si apre il visore, lo si chiude e lo si riapre sulla stessa riga → pinch, trascinamento e swipe non funzionano.

**Correzione**: il contenitore del visore è uno stato (callback ref) e l'effetto dei listener dipende da esso.

### 4.7 R-7 · Revoca di una segnatura

La segnatura della portata è un dato contribuito: proposta con una segnalazione, è pubblicata solo dopo la verifica della redazione (vedi [CAT-DOC-00 §5.6](standard-documentale.md#56-provenienza-e-integrità-del-dato--provenance-and-data-integrity)).

A accettata (pubblicata), poi B accettata sullo stesso fuoco (sovrascrive), poi B portata a `respinta`: la riga di B viene cancellata (`segnalazione.service.ts:130-134`) e il fuoco resta senza segnatura, anche se A risulta ancora `accettata`.

**Correzione**: alla revoca torna pubblicata l'ultima altra segnatura ancora accettata sullo stesso fuoco; si cancella solo se non ce ne sono.

### 4.8 R-8 · Link condiviso malformato

`decodeAst` controlla solo la radice (`query-share.ts:40`). `pruneAst` va in errore durante il render su figli `null` o gruppi senza `children` (`query-ast-utils.ts:34-37`) e non c'è un error boundary. Lo stesso accade con una query salvata alterata in `localStorage`.

**Correzione**: validatore strutturale profondo (`query-ast-validate.ts`) usato da `decodeAst` e dalle query salvate, `pruneAst` tollerante, error boundary sulle route.

### 4.9 R-9 · "Rapporto mestiere" nelle segnalazioni

`currentValue(row, campo)` legge `row["rapporto"]` (`SegnalazioneModal.tsx:38-41`), ma la proprietà del fuoco si chiama `rapporto_mestiere`: il modulo mostra "vuoto" e invia `valore_attuale: null`.

**Correzione**: mappa chiave del campo → proprietà del fuoco (`rapporto` → `rapporto_mestiere`).

### 4.10 R-10 · "Salva filtro" in HTTP

`crypto.randomUUID()` (`saved-queries.ts:48`) esiste solo nei contesti sicuri. Su `http://<ip>:1427` il clic genera un errore non gestito e non salva nulla.

**Correzione**: `generateId()` con ripiego quando `crypto.randomUUID` non è disponibile.

### 4.11 R-11 · AST molto annidato

Lo schema zod ricorsivo non limita la profondità: il controllo sul limite di 5 livelli avviene dopo il parse. Un corpo di circa 49 kB con ~1200 gruppi annidati esaurisce lo stack e produce un 500 (riprodotto).

**Correzione**: controllo iterativo della profondità sull'input grezzo prima dello schema zod: risposta `400 Query troppo annidata`.

### 4.12 R-12 · `TRUST_PROXY=true`

`server.ts:28` passa la stringa `"true"` a Express, che la tratta come indirizzo IP e lancia `invalid IP address: true` (riprodotto). Funzionano solo numeri o nomi come `loopback`.

**Correzione**: `parseTrustProxy` converte `true`/`false` in booleani e le cifre in numero.

### 4.13 R-13 · Dati assenti

`fiorini(value || 0)` mostra "0 fiorini" per un valore nullo e `parente.eta || "-"` mostra "-" per i neonati (`CatastoRow.tsx:38,352`); la località mostra " » " quando mancano piviere e popolo (`CatastoRow.tsx:246`). Questo contraddice il principio "i dati assenti restano assenti" (`frontend-catasto/PRODUCT.md`; vedi anche [CAT-DOC-00 §5.6](standard-documentale.md#56-provenienza-e-integrità-del-dato--provenance-and-data-integrity)): un dato assente nella fonte non si stima e non si ricostruisce, e un valore in fiorini non si sostituisce con 0.

**Correzione**: `lib/formato.ts`: i valori nulli sono mostrati come "Non indicato", 0 resta 0, la località mostra solo le parti presenti.

### 4.14 R-14 · Messaggi d'errore

- Il modulo di segnalazione mostra `error.message` senza passare da `userMessage` (`SegnalazioneModal.tsx:294`): un errore di rete appare come "Failed to fetch".
- `apiRequest` legge come JSON anche le risposte 200 non JSON (`client.ts:40`). Su Vercel senza `VITE_API_URL` l'utente vede "Unexpected token '<'".

**Correzione**: il modulo usa `userMessage`; `apiRequest` trasforma una risposta 200 non JSON in un messaggio in italiano.

### 4.15 R-15 · Segnatura senza fuoco

`tipo: "segnatura"` con `id_fuoco: null` è accettato in creazione (`segnalazione.controller.ts:25,47`). Accettandola non viene pubblicato nulla, ma la pagina di moderazione dice "accettata e pubblicata".

**Correzione**: la creazione di una segnalazione `segnatura` richiede `id_fuoco`.

### 4.16 R-16 · Accessibilità

- Il testo arancione "link troppo lungo" ha un contrasto di circa 2,7:1 sul tema chiaro e non ha una live region (`AdvancedSearchPanel.tsx:98`).
- L'indice su mobile non si chiude con Esc.
- Le righe `<tr tabIndex=0>` contengono pulsanti (interattivi annidati).
- Il titolo della pagina non cambia tra le route.

**Correzione**: testo in `amber-800`/`amber-300` (AA in entrambi i temi) dentro una live region, Esc chiude l'indice su mobile, titolo della scheda per pagina. Interattivi annidati (ottobre 2026): righe e card non sono più focalizzabili; si aprono da un pulsante dedicato con `aria-expanded` e `aria-controls` verso il dettaglio, mentre il clic sul resto della riga resta come scorciatoia col mouse.

## 5. Altre osservazioni

- **Sicurezza**
  - I link Accetta/Respingi transitano per FormSubmit: chi accede alla casella della redazione può moderare per 14 giorni. È una scelta di progetto, ora documentata.
  - `docker.yml` avviato a mano può pubblicare `:latest` da un ramo qualsiasi senza passare dalla CI.
- **Cache** (chiuso a ottobre 2026): le opzioni dei filtri non scadevano mai (`common.model.ts:58-68`); dopo un reimport del dump serviva riavviare il backend.
- **Codice inutilizzato**
  - `importQuery` in `saved-queries.ts`;
  - la prop `defaultCampo` di `SegnalazioneModal`;
  - l'alias Vite `@`;
  - la route `/mappa`, non collegata;
  - l'endpoint `/api/mestieri`, che il frontend non usa.
- **Build**
  - Mancano un campo `engines` (serve Node ≥ 20) e il lint del backend.
  - Le dipendenze `@eslint/js` e `globals`, importate da `eslint.config.js`, non sono dichiarate.
  - `backend-catasto/.dockerignore` e `frontend-catasto/.dockerignore` non sono mai letti: il contesto di build è la root.
- **Test assenti**
  - controller di ricerca, middleware (auth admin, errori), `validation.ts`;
  - componenti e hook React;
  - test di integrazione su MySQL.

## 6. Aggiornamento di ottobre 2026

Chiusura dei punti aperti (issue #38).

| Punto | Esito |
|---|---|
| Cache delle opzioni dei filtri | TTL configurabile `FILTERS_CACHE_TTL` (secondi, default 3600, `0` = senza scadenza) e rotta admin `POST /api/filters/cache/invalidate`, che svuota anche la cache delle traduzioni |
| R-16, interattivi annidati | Pulsante dedicato per aprire e chiudere la scheda, `tabIndex` tolto da righe e card |
| `importQuery` | Rimosso |
| Prop `defaultCampo` di `SegnalazioneModal` | Rimossa |
| Alias Vite `@` | Rimosso, insieme al path `@/*` del `tsconfig` e alla dipendenza inutilizzata `vite-plugin-tsconfig-paths` |
| `/api/mestieri` | Mantenuto e documentato come API pubblica in [`docs/backend.md`](backend.md) |
| Route `/mappa` non collegata | Non toccata: fuori dal perimetro della issue |
| `engines` | `node >= 20` in tutti i `package.json` |
| Lint del backend | ESLint con la configurazione condivisa `eslint.config.base.mjs`; la CI esegue `npm run lint` su tutti i workspace |
| `@eslint/js` e `globals` | Dichiarate nelle `devDependencies` |
| `.dockerignore` dei workspace | Eliminati; le regole valide stanno nel `.dockerignore` della root, l'unico letto |
| `docker.yml` avviato a mano | `:latest` solo dal `main`; da un altro ramo si pubblica solo il tag `:sha` |
| Test mancanti | Unitari per controller di ricerca, `admin.middleware.ts`, `error.middleware.ts`, `validation.ts` e cache dei filtri; Testing Library per `CatastoRow`, `Pagination` e `useCatastoFilters`; test di integrazione su MySQL 8 (job `integration` della CI, dump di prova e migrazioni) |

## 7. Registro delle modifiche

| Versione | Data | Autore | Descrizione |
|---|---|---|---|
| 1.x | — | — | Versioni precedenti, senza registro |
| 2.0 | 2026-10-29 | Pasquale Ruotolo | Riscrittura secondo CAT-DOC-00 e traduzione inglese |
