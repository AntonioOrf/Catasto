# Code review

🇮🇹 [Italiano](../revisione-codice.md) · 🇬🇧 **English**

| Field | Value |
|---|---|
| Identifier | `CAT-DOC-06` |
| Version | 2.0 |
| Date | 2026-10-29 |
| Status | Approved |
| Classification | Internal |
| Owners | Antonio Orfitelli, Pasquale Ruotolo |
| Language | English (translation; the Italian text prevails) |
| Original | [Revisione del codice](../revisione-codice.md) |
| Related documents | [Documentation standard](../standard-documentale.md) (`CAT-DOC-00`) · [Installation and deployment](installation.md) (`CAT-DOC-01`) · [Architecture and data model](architecture.md) (`CAT-DOC-02`) · [Backend and API](backend.md) (`CAT-DOC-03`) · [Frontend](frontend.md) (`CAT-DOC-04`) · [Use cases](use-cases.md) (`CAT-DOC-05`) · [README](../../README.en.md) |

## 1. Purpose and audience

This document is meant for the project team (developers and maintainers of the portal of the Florentine Catasto of 1427/30). It reports the outcome of the September 2026 code review of the backend, frontend, shared package, CI and deployment, carried out on commit `bb2e93a`, and the closure of the items left open, completed in October 2026 (issue #38). Only problems verified by reading the code are reported (some were also reproduced); each one comes with a concrete scenario and the fix adopted.

## 2. Summary

### 2.1 Pipeline status

`npm ci`, `npm run build`, frontend lint, `tsc --noEmit` for backend and frontend, and `npm test` all pass. Tests at the time of the review: 59 in the backend, 14 in the frontend, all green.

### 2.2 Outcome

All the problems listed were fixed in the same round of work, each with its own tests (now 73 in the backend and 42 in the frontend). The details (§4) describe the original problem and, at the end of each item, the fix. The items left open in R-16 and in "Other observations" (§5) were closed in October 2026 (issue #38): see [§6 October 2026 update](#6-october-2026-update).

### 2.3 SQL injection

None found. Columns, joins and orderings come from whitelists; all values are parameterised; non-scalar parameters (`?x[]=`) are rejected.

## 3. Priorities

| Severity | # | Area | Problem | Status |
|---|---|---|---|---|
| High | R-1 | Advanced search | Merged geographic options (`"3,7"`) compared as a string: partial results | fixed |
| Medium | R-2 | Deployment | Migrations neither documented nor automatic: without `fuoco_segnature` the table returns 500 | fixed |
| Medium | R-3 | Pagination | Ordering without a unique key: rows repeated or skipped across pages | fixed |
| Medium | R-4 | Frontend | No loading indicator after the first load | fixed |
| Medium | R-5 | Frontend | Clicking in the index on a household on another page: the row does not open | fixed |
| Medium | R-6 | Folio viewer | Touch gestures lost when reopening the same volume | fixed |
| Medium | R-7 | Shelfmarks | Revoking the latest shelfmark does not restore the previous one | fixed |
| Medium-low | R-8 | Frontend | Malformed `#q=` link or corrupted saved query: blank screen | fixed |
| Medium-low | R-9 | User reports | "Occupation relation" (`rapporto mestiere`): current value always empty | fixed |
| Low | R-10 | Frontend | "Save filter" does not work over plain HTTP | fixed |
| Low | R-11 | Backend | AST nested beyond ~1000 levels: 500 instead of 400 | fixed |
| Low | R-12 | Config | `TRUST_PROXY=true` prevents startup | fixed |
| Low | R-13 | Frontend | Missing values shown as "0 fiorini"; age 0 shown as "-" | fixed |
| Low | R-14 | Frontend | Technical error messages in English ("Failed to fetch") | fixed |
| Low | R-15 | Shelfmarks | Shelfmark without `id_fuoco` accepted but not published | fixed |
| Low | R-16 | Accessibility | Insufficient contrast and messages not announced | fixed |

## 4. Details

### 4.1 R-1 · Advanced search on territorial series, quarter, *piviere* and *popolo*

`/api/filters` merges partitions with the same name and returns ids such as `"3,7"` (`backend-catasto/src/models/common.model.ts:18-21`). The QueryBuilder sends them as they are (`QueryBuilder.tsx:324,338`) and the AST compiler uses them as a single string (`query-ast-builder.ts:86-90`). MySQL converts `'3,7'` to `3`.

Here "series" means the territorial series of the data model (city, *contado*, district), not an archival series (see [CAT-DOC-00 §5.2](../standard-documentale.md#52-livelli-di-descrizione--levels-of-description)). The *piviere* is the pieve district and the *popolo* the parish.

*Scenario*: "Quarter equals San Giovanni" returns only the *fuochi* (households) of San Giovanni (I). With `neq` / `not_in` only the first partition is excluded.

**Fix**: the id lists of geographic fields are expanded in the AST compiler (`eq` → `IN`, `neq` → `NOT IN`, lists inside `in`/`not_in` flattened), with validation as in simple search.

### 4.2 R-2 · Migrations

`findAll` always does `LEFT JOIN fuoco_segnature` (`fuoco.model.ts:23`). The compose file only imports `init/Catasto.sql` and the documentation did not mention `db:migrate`.

*Scenario*: fresh installation following the guide → `GET /api/catasto` returns 500 "Table doesn't exist".

**Fix**: the backend container runs the migration runner before the server (`backend-catasto/Dockerfile`); the manual procedure remains documented for development (see [Installation and deployment](installation.md)).

### 4.3 R-3 · Non-deterministic pagination

`buildOrderBy` (`query-builder.ts:188-211`) orders on a single non-unique column, without `f.ID_Fuochi` as a secondary key.

*Scenario*: `sort_by=fortune` with many values equal to 0 → while paging, some households appear twice and others never. The same problem can make a click in the side index land on the wrong page, since the index uses blocks of 1000.

**Fix**: every `ORDER BY` ends with `f.ID_Fuochi ASC`.

### 4.4 R-4 · Loading indicators

With `placeholderData: keepPreviousData`, React Query 5 reports `isLoading = false` during subsequent changes (`useCatastoData.ts:21,28`). Skeleton, `aria-busy`, the Refresh icon and disabling of pagination never activate after the first load.

**Fix**: `useCatastoData` exposes `fetching` and `stale`: during subsequent requests the table has `aria-busy`, old rows are dimmed, Refresh spins and pagination is disabled.

### 4.5 R-5 · Index click towards another page

For the same reason as R-4, the effect in `HomePage.tsx:85-92` runs immediately with the previous page's data, does not find the row and resets `targetScrolledId`.

*Scenario*: click on the 120th index entry → the table moves to page 3 but the row is neither opened nor highlighted.

**Fix**: the effect waits until the new page's data are no longer the placeholder data; on error it gives up.

### 4.6 R-6 · Touch gestures in the folio viewer

The effect that registers touch listeners depends only on `[imageUrl]` (`ArchivioViewerModal.tsx:118-172`), while the container is recreated on every opening. When the same household is reopened, `imageUrl` does not change and the new container is left without listeners.

*Scenario*: on a phone, open the viewer, close it and reopen it on the same row → pinch, drag and swipe do not work.

**Fix**: the viewer container is a piece of state (callback ref) and the listeners' effect depends on it.

### 4.7 R-7 · Revoking a shelfmark

The *portata* (declaration) shelfmark is a contributed datum: proposed through a user report, it is published only after editorial verification (see [CAT-DOC-00 §5.6](../standard-documentale.md#56-provenienza-e-integrità-del-dato--provenance-and-data-integrity)).

A accepted (published), then B accepted on the same household (overwrites), then B set to `respinta` (rejected): B's row is deleted (`segnalazione.service.ts:130-134`) and the household is left without a shelfmark, even though A is still `accettata` (accepted).

**Fix**: on revocation, the most recent other shelfmark still accepted on the same household is published again; the row is deleted only if there is none.

### 4.8 R-8 · Malformed shared link

`decodeAst` only checks the root (`query-share.ts:40`). `pruneAst` fails during render on `null` children or groups without `children` (`query-ast-utils.ts:34-37`) and there is no error boundary. The same happens with a saved query tampered with in `localStorage`.

**Fix**: deep structural validator (`query-ast-validate.ts`) used by `decodeAst` and by saved queries, tolerant `pruneAst`, error boundary on the routes.

### 4.9 R-9 · "Occupation relation" in user reports

`currentValue(row, campo)` reads `row["rapporto"]` (`SegnalazioneModal.tsx:38-41`), but the household property is called `rapporto_mestiere`: the form shows "empty" and sends `valore_attuale: null`.

**Fix**: map from field key → household property (`rapporto` → `rapporto_mestiere`).

### 4.10 R-10 · "Save filter" over HTTP

`crypto.randomUUID()` (`saved-queries.ts:48`) exists only in secure contexts. On `http://<ip>:1427` the click raises an unhandled error and nothing is saved.

**Fix**: `generateId()` with a fallback when `crypto.randomUUID` is not available.

### 4.11 R-11 · Deeply nested AST

The recursive zod schema does not limit depth: the check on the 5-level limit happens after parsing. A body of about 49 kB with ~1200 nested groups exhausts the stack and produces a 500 (reproduced).

**Fix**: iterative depth check on the raw input before the zod schema: response `400 Query troppo annidata` ("query too deeply nested").

### 4.12 R-12 · `TRUST_PROXY=true`

`server.ts:28` passes the string `"true"` to Express, which treats it as an IP address and throws `invalid IP address: true` (reproduced). Only numbers or names such as `loopback` work.

**Fix**: `parseTrustProxy` converts `true`/`false` to booleans and digits to a number.

### 4.13 R-13 · Missing data

`fiorini(value || 0)` shows "0 fiorini" for a null value and `parente.eta || "-"` shows "-" for newborns (`CatastoRow.tsx:38,352`); the locality shows " » " when *piviere* and *popolo* are missing (`CatastoRow.tsx:246`). This contradicts the principle "missing data stay missing" (`frontend-catasto/PRODUCT.md`; see also [CAT-DOC-00 §5.6](../standard-documentale.md#56-provenienza-e-integrità-del-dato--provenance-and-data-integrity)): a datum missing from the source is neither estimated nor reconstructed, and a value in florins is never replaced with 0.

**Fix**: `lib/formato.ts`: null values are shown as "Non indicato" (not stated), 0 stays 0, the locality shows only the parts present.

### 4.14 R-14 · Error messages

- The user report form shows `error.message` without going through `userMessage` (`SegnalazioneModal.tsx:294`): a network error appears as "Failed to fetch".
- `apiRequest` parses as JSON even 200 responses that are not JSON (`client.ts:40`). On Vercel without `VITE_API_URL` the user sees "Unexpected token '<'".

**Fix**: the form uses `userMessage`; `apiRequest` turns a non-JSON 200 response into a message in Italian.

### 4.15 R-15 · Shelfmark without a household

`tipo: "segnatura"` with `id_fuoco: null` is accepted on creation (`segnalazione.controller.ts:25,47`). Accepting it publishes nothing, but the moderation page says "accettata e pubblicata" (accepted and published).

**Fix**: creating a `segnatura` (shelfmark) user report requires `id_fuoco`.

### 4.16 R-16 · Accessibility

- The orange "link troppo lungo" (link too long) text has a contrast of about 2.7:1 on the light theme and has no live region (`AdvancedSearchPanel.tsx:98`).
- The index on mobile does not close with Esc.
- The `<tr tabIndex=0>` rows contain buttons (nested interactive elements).
- The page title does not change between routes.

**Fix**: text in `amber-800`/`amber-300` (AA in both themes) inside a live region, Esc closes the index on mobile, per-page tab title. Nested interactive elements (October 2026): rows and cards are no longer focusable; they open from a dedicated button with `aria-expanded` and `aria-controls` pointing to the detail, while clicking the rest of the row remains as a mouse shortcut.

## 5. Other observations

- **Security**
  - The Accept/Reject links go through FormSubmit: anyone with access to the editorial team's mailbox can moderate for 14 days. This is a project choice, now documented.
  - `docker.yml` triggered manually can publish `:latest` from any branch without going through CI.
- **Cache** (closed in October 2026): filter options never expired (`common.model.ts:58-68`); after re-importing the dump the backend had to be restarted.
- **Unused code**
  - `importQuery` in `saved-queries.ts`;
  - the `defaultCampo` prop of `SegnalazioneModal`;
  - the Vite alias `@`;
  - the `/mappa` route, not linked;
  - the `/api/mestieri` endpoint, which the frontend does not use.
- **Build**
  - An `engines` field (Node ≥ 20 is required) and backend lint are missing.
  - The `@eslint/js` and `globals` dependencies, imported by `eslint.config.js`, are not declared.
  - `backend-catasto/.dockerignore` and `frontend-catasto/.dockerignore` are never read: the build context is the root.
- **Missing tests**
  - search controller, middleware (admin auth, errors), `validation.ts`;
  - React components and hooks;
  - integration tests on MySQL.

## 6. October 2026 update

Closure of the open items (issue #38).

| Item | Outcome |
|---|---|
| Filter options cache | Configurable TTL `FILTERS_CACHE_TTL` (seconds, default 3600, `0` = no expiry) and admin route `POST /api/filters/cache/invalidate`, which also clears the translation cache |
| R-16, nested interactive elements | Dedicated button to open and close the record, `tabIndex` removed from rows and cards |
| `importQuery` | Removed |
| `defaultCampo` prop of `SegnalazioneModal` | Removed |
| Vite alias `@` | Removed, together with the `@/*` path in `tsconfig` and the unused dependency `vite-plugin-tsconfig-paths` |
| `/api/mestieri` | Kept and documented as a public API in [`docs/backend.md`](backend.md) |
| Unlinked `/mappa` route | Not touched: outside the scope of the issue |
| `engines` | `node >= 20` in every `package.json` |
| Backend lint | ESLint with the shared configuration `eslint.config.base.mjs`; CI runs `npm run lint` on every workspace |
| `@eslint/js` and `globals` | Declared in `devDependencies` |
| Workspace `.dockerignore` files | Deleted; the valid rules live in the root `.dockerignore`, the only one read |
| `docker.yml` triggered manually | `:latest` only from `main`; from any other branch only the `:sha` tag is published |
| Missing tests | Unit tests for the search controller, `admin.middleware.ts`, `error.middleware.ts`, `validation.ts` and the filters cache; Testing Library for `CatastoRow`, `Pagination` and `useCatastoFilters`; integration tests on MySQL 8 (CI `integration` job, test dump and migrations) |

## 7. Change log

| Version | Date | Author | Description |
|---|---|---|---|
| 1.x | — | — | Earlier versions, no change log |
| 2.0 | 2026-10-29 | Pasquale Ruotolo | Rewritten according to CAT-DOC-00 and translated into English |
