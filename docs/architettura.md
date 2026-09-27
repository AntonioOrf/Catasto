# Architettura e modello dati

Questo documento descrive come sono collegati i componenti del sistema, come sono organizzati i dati e come il progetto viene distribuito.

> Vedi anche: [Backend](backend.md) · [Frontend](frontend.md) · [Casi d'uso](casi-d-uso.md) · [Installazione](guides.md)

---

## Vista d'insieme

```mermaid
flowchart LR
    subgraph Client
      B[Browser<br/>React SPA]
    end

    subgraph Server["Server (docker compose)"]
      direction LR
      N["catasto-frontend<br/>nginx :80 → host :1427"]
      A["catasto-backend<br/>Node 20 / Express :3005<br/>(solo 127.0.0.1)"]
      D[("catasto-db<br/>MySQL 8 :3306<br/>(solo 127.0.0.1)")]
    end

    subgraph Esterni["Servizi esterni"]
      I["Archivio digitale ICAR / ASFi<br/>manifest e immagini IIIF"]
      F["FormSubmit<br/>email alla redazione"]
    end

    B -- "HTML, JS, CSS" --> N
    B -- "/api/*" --> N
    N -- "proxy_pass" --> A
    A -- "SQL parametrico" --> D
    A -- "manifest.json (cache 24 h)" --> I
    B -- "immagini IIIF (img-src https:)" --> I
    A -. "notifica segnalazione" .-> F
```

- Il browser parla **solo con nginx**: stessa origine per sito e API, quindi CSP `connect-src 'self'` e nessun problema di CORS.
- Il backend scarica dall'Archivio solo il **manifest** del volume; le **immagini** le carica direttamente il browser dal server IIIF.
- Backend e database sono esposti solo su loopback: dall'esterno si raggiunge unicamente la porta 1427 (da mettere dietro un terminatore TLS).

### Monorepo

```mermaid
flowchart TB
    R["catasto-monorepo (npm workspaces)"]
    S["packages/shared<br/>@catasto/shared"]
    FE["frontend-catasto<br/>catasto-frontend"]
    BE["backend-catasto<br/>catasto-backend"]
    R --> S & FE & BE
    S -- "tipi, FIELD_REGISTRY, limiti AST,<br/>parser segnatura (sorgente via alias Vite)" --> FE
    S -- "stesso codice (dist compilata)" --> BE
```

Il pacchetto condiviso garantisce che frontend e backend usino le stesse regole: se un campo viene aggiunto a `FIELD_REGISTRY`, compare nel QueryBuilder e diventa interrogabile dal backend senza altre modifiche.

---

## Modello dati

I dati storici arrivano dal dump `init/Catasto.sql` (ricerca Klapisch-Zuber / ACRH: circa 61.000 fuochi e 270.000 parenti), che **non è incluso nel repository**. Le tabelle applicative sono create dalle [migrazioni](backend.md#migrazioni).

```mermaid
erDiagram
    fuochi ||--o{ parenti : "ID_Fuochi = ID_FUOCO"
    fuochi }o--o| mestieri : Mestiere_Fuoco
    fuochi }o--o| casa : Casa_Fuoco
    fuochi }o--o| bestiame : Bestiame_Fuoco
    fuochi }o--o| immigrazione : Immigrazione_Fuoco
    fuochi }o--o| rapporto_mestiere : RapportoMestiere_Fuoco
    fuochi }o--o| particolarita_fuoco : Particolarita_Fuoco
    fuochi }o--o| t_struttura_catastale : id_registrazione
    t_struttura_catastale }o--o| t_serie : id_serie
    t_struttura_catastale }o--o| t_quartieri : id_quartiere
    t_struttura_catastale }o--o| t_pivieri : id_piviere
    t_struttura_catastale }o--o| t_popoli : id_popolo
    fuochi }o--o| t_archivio_volumi : "Volume_Fuoco = volume"
    parenti }o--o| rapporti_parentela : Parentela
    parenti }o--o| sesso_parenti : Sesso
    parenti }o--o| statocivile_parenti : StatoCivile
    parenti }o--o| particolarita_parenti : Particolarita
    fuochi ||--o| fuoco_segnature : "segnatura pubblicata"
    fuochi ||--o{ segnalazioni : "id_fuoco (senza FK)"
    segnalazioni ||--o| fuoco_segnature : id_segnalazione

    fuochi {
        int ID_Fuochi PK
        varchar Nome_Fuoco
        decimal Fortune_Fuoco
        decimal Credito_Fuoco
        decimal CreditoM_Fuoco
        decimal Imponibile_Fuoco
        decimal Deduzioni_Fuoco
        varchar Volume_Fuoco
        varchar Foglio_Fuoco
        int id_registrazione FK
    }
    parenti {
        int ID_FUOCO FK
        int Eta
        int Parentela FK
        int Sesso FK
        int StatoCivile FK
        int Particolarita FK
    }
    t_archivio_volumi {
        varchar volume
        varchar codice_archivio
    }
    segnalazioni {
        int id PK
        int id_fuoco
        enum tipo "dato_errato | segnatura | altro"
        varchar campo
        varchar valore_attuale
        varchar valore_proposto
        text note
        varchar email
        enum stato "nuova | in_esame | accettata | respinta"
        char ip_hash "SHA-256 con salt"
        timestamp created_at
    }
    fuoco_segnature {
        int id_fuoco PK
        varchar segnatura
        int id_segnalazione
        timestamp updated_at
    }
```

I tipi delle colonne del dump sono indicativi (dedotti dalle query); fanno fede quelli di `Catasto.sql`.

### Glossario

| Termine | Significato |
|---|---|
| **Fuoco** | Nucleo familiare censito: l'unità del catasto, intestata al capofamiglia |
| **Portata** | Dichiarazione presentata dal contribuente; la sua segnatura non è nei dati ACRH e viene raccolta con le segnalazioni |
| **Campione** | Registro ufficiale redatto dagli ufficiali del catasto: `Volume_Fuoco` / `Foglio_Fuoco` si riferiscono a questo |
| **Carta (c.)** | Foglio del registro, con recto (`r`) e verso (`v`) |
| **Fortune / Credito / Credito ai Monti** | Componenti del patrimonio in fiorini (beni, crediti privati, crediti sul debito pubblico) |
| **Deduzioni** | Detrazioni (bocche a carico, debiti, abitazione) |
| **Imponibile** | Base tassabile risultante |
| **Serie** | Città, contado o distretto |
| **Quartiere / Gonfalone** | Suddivisione urbana di Firenze (Santo Spirito, Santa Croce, Santa Maria Novella, San Giovanni) |
| **Piviere / Popolo** | Circoscrizioni ecclesiastiche usate come unità territoriali |
| **ASFi** | Archivio di Stato di Firenze |

---

## Deploy

```mermaid
flowchart LR
    Dev[Push / PR] --> CI["GitHub Actions: CI<br/>npm ci · build · lint · tsc · test"]
    CI -- "push su main, CI verde" --> DK["Docker images<br/>build matrix backend/frontend"]
    DK --> HUB[("Docker Hub<br/>ipavon/catasto1427-*:latest e :sha")]
    HUB -- "pull (manuale o polling)" --> SRV["Server<br/>docker compose"]
```

| Servizio | Immagine | Porta host | Note |
|---|---|---|---|
| `catasto-db` | `mysql:8.0` | `127.0.0.1:3306` | dati in `./mysql_data` (bind mount), import iniziale da `./init/Catasto.sql` |
| `catasto-backend` | `ipavon/catasto1427-backend` | `127.0.0.1:3005` | parte quando il DB è `healthy` |
| `catasto-frontend` | `ipavon/catasto1427-frontend` | `1427` | nginx: sito statico e proxy `/api` |

### Sicurezza, in sintesi

- **SQL**: tutti i valori sono parametrizzati; colonne, join e ordinamenti arrivano da whitelist.
- **Input**: validazione zod, body JSON max 64 kB, limiti sui valori della ricerca (lunghezza, numero di id, profondità dell'AST).
- **Abuso**: rate limit per IP su tutta l'API, sul manifest e sulle segnalazioni; honeypot nel modulo; IP salvati solo come hash con salt.
- **Moderazione**: token admin confrontato in tempo costante; link email firmati con HMAC, a scadenza, legati a id e azione; il `GET` non modifica nulla.
- **Header**: helmet sul backend, CSP restrittiva e `frame-ancestors 'none'` sul frontend; container con utente non privilegiato.
