# Portabilità e trasferimento all'ateneo

🇮🇹 **Italiano** · 🇬🇧 [English](en/portability.md)

| Campo | Valore |
|---|---|
| Identificativo | `CAT-DOC-07` |
| Titolo | Portabilità del portale Catasto fiorentino del 1427/30 e trasferimento sui server di un ateneo |
| Versione | 1.0 |
| Data | 2026-11-01 |
| Stato | Approvato |
| Classificazione | Pubblico |
| Responsabili | Antonio Orfitelli, Pasquale Ruotolo |
| Lingua | Italiano (testo di riferimento) |
| Traduzione | [English](en/portability.md) |
| Documenti collegati | [Standard documentale](standard-documentale.md) (`CAT-DOC-00`) · [Installazione e deployment](guides.md) (`CAT-DOC-01`) · [Architettura e modello dati](architettura.md) (`CAT-DOC-02`) · [Backend e API](backend.md) (`CAT-DOC-03`) · [Readme del repository](../readme.md) |

---

## 1. Scopo e destinatari

Il portale andrà trasferito sui server di un ateneo, con tecnologie non ancora note. Questo documento è rivolto al gruppo di progetto e al servizio informatico che lo ospiterà. Elenca ciò che il portale richiede a qualunque piattaforma (§2), come installarlo nei casi più probabili (§3), cosa cambia quando girano più istanze (§4), le domande da porre all'ateneo (§5) e come trasferire i dati (§6). L'installazione con Docker Compose resta descritta in [Installazione e deployment](guides.md), le variabili d'ambiente in [Backend e API](backend.md), §9.

---

## 2. Requisiti del portale

Il portale è **un solo processo Node.js** che serve sia il sito sia l'API, più un **database MySQL**. Non scrive file su disco e non ha stato proprio oltre al database.

| Requisito | Dettaglio |
|---|---|
| Esecuzione | Immagine Docker `ipavon/catasto1427` (Node 20 Alpine, utente non privilegiato `1000`), oppure Node.js ≥ 20 senza container |
| Porta | Una porta HTTP interna (`PORT`, default `3005`); HTTPS lo fornisce il proxy davanti |
| Database | MySQL 8 (testato) o TiDB (in uso su Vercel); MariaDB da verificare (§3.5). Circa 61.000 fuochi e 270.000 parenti |
| Filesystem | Sola lettura: nessuna scrittura durante il funzionamento |
| Rete in uscita | `archiviodigitale-icar.cultura.gov.it` (manifest IIIF, interrogato dal backend); `formsubmit.co` (email delle segnalazioni, facoltativo). Le immagini delle carte le scarica direttamente il browser dell'utente |
| Risorse indicative | 0,1–0,5 CPU, 256 MB di RAM a riposo, fino a 1 GB durante gli export Excel più grandi |
| Segreti | Credenziali del database, `SEGNALAZIONI_SALT`, `ADMIN_TOKEN`, `MODERAZIONE_SECRET` |
| Controlli di salute | `/health/live` (il processo risponde) e `/health/ready` (il database risponde): [Backend e API](backend.md), §4.17 |

---

## 3. Scenari di installazione

### 3.1 Macchina virtuale con Docker

È il caso già documentato: si seguono [Installazione e deployment](guides.md), §3. Se il proxy HTTPS dell'ateneo sta davanti al container e la porta `1427` non è raggiungibile da fuori, impostare `TRUST_PROXY=1`.

### 3.2 Macchina virtuale con Podman

Frequente sulle distribuzioni Red Hat (RHEL, Rocky, Alma). Lo stesso `docker-compose.yml` funziona con `podman compose` (o `podman-compose`). Differenze da conoscere:

- le immagini vanno indicate con il registro completo se l'ateneo non ha `docker.io` tra i registri di ricerca (`docker.io/ipavon/catasto1427:latest`, `docker.io/library/mysql:8.0`);
- con SELinux attivo i volumi montati richiedono il suffisso `:Z` (`./mysql_data:/var/lib/mysql:Z`);
- per l'avvio automatico al boot si usa un'unità systemd generata da Podman (Quadlet o `podman generate systemd`) invece di `restart: always`.

### 3.3 Kubernetes o OpenShift

La cartella [`deploy/kubernetes/`](../deploy/kubernetes) contiene manifest di base per un database esterno al cluster:

| File | Contenuto |
|---|---|
| `configmap.yaml` | Configurazione non segreta, con `SHARED_STATE=mysql` e `TRUST_PROXY=1` |
| `secret.example.yaml` | Modello dei segreti, da copiare in `secret.yaml` (escluso da git) |
| `deployment.yaml` | Due repliche, aggiornamento senza interruzione, probe, filesystem in sola lettura, nessun privilegio |
| `service.yaml`, `ingress.yaml` | Esposizione su `catasto.example.org` (dominio fittizio) |
| `pdb.yaml` | Almeno un pod attivo durante la manutenzione dei nodi |

```bash
cp deploy/kubernetes/secret.example.yaml deploy/kubernetes/secret.yaml   # e compilarlo
kubectl apply -k deploy/kubernetes        # su OpenShift: oc apply -k deploy/kubernetes
kubectl rollout status deployment/catasto
```

Su **OpenShift** il container gira con un UID casuale nel gruppo `0`: l'immagine lo supporta perché non scrive file. Il comportamento è stato verificato avviando il server con un UID arbitrario. L'`Ingress` viene convertito in una `Route`; in alternativa si crea la `Route` direttamente (commento in `ingress.yaml`). Se il cluster non può scaricare da Docker Hub, l'immagine va copiata nel registro interno dell'ateneo e il nome aggiornato in `kustomization.yaml`.

Nel `kustomization.yaml` conviene fissare il tag immutabile pubblicato dalla CI (lo SHA breve del commit) invece di `latest`: un rollback diventa un cambio di tag.

### 3.4 Macchina virtuale senza container

Con Node.js 20 installato dal servizio informatico:

```bash
git clone https://github.com/AntonioOrf/Catasto.git /opt/catasto && cd /opt/catasto
npm ci && npm run build
sudo cp deploy/systemd/catasto.service /etc/systemd/system/
sudo install -D -m 600 deploy/systemd/catasto.env.example /etc/catasto/catasto.env   # e compilarlo
sudo systemctl daemon-reload && sudo systemctl enable --now catasto
```

L'unità [`deploy/systemd/catasto.service`](../deploy/systemd/catasto.service) applica le migrazioni prima di avviare il server, lo riavvia in caso di errore e rende il sistema in sola lettura per il processo. Per aggiornare: `git pull && npm ci && npm run build && sudo systemctl restart catasto`.

### 3.5 Database fornito dall'ateneo

Il portale usa solo SQL standard di MySQL 8 (funzioni finestra, `REGEXP_REPLACE`, `GET_LOCK`). Con **MySQL 8** o **TiDB** funziona senza modifiche. Con **MariaDB** o una versione diversa la compatibilità va verificata prima del trasferimento, eseguendo i test di integrazione contro un database di prova dell'ateneo:

```bash
TEST_DB_HOST=… TEST_DB_USER=… TEST_DB_PASSWORD=… TEST_DB_NAME=catasto_test \
  npm run test:integration -w catasto-backend
```

Il nome del database di prova deve contenere `test`: il setup lo svuota.

---

## 4. Più istanze

Con una sola istanza (Docker Compose, una VM) non serve nulla. Quando il portale gira su più istanze dietro un bilanciatore (repliche di Kubernetes, più VM, Vercel) bisogna impostare `SHARED_STATE=mysql`:

| Aspetto | Con `SHARED_STATE` vuota | Con `SHARED_STATE=mysql` |
|---|---|---|
| Rate limit | Contatori per istanza: con N istanze il limite reale è N volte quello dichiarato | Contatori nella tabella `rate_limit_hits`, comuni a tutte le istanze |
| `POST /api/filters/cache/invalidate` | Svuota la cache della sola istanza che riceve la richiesta | Le altre istanze si allineano entro 30 secondi |
| Migrazioni all'avvio | Lock MySQL in ogni caso: le istanze avviate insieme non si ostacolano | Uguale |

Non servono servizi aggiuntivi (Redis o simili): lo stato condiviso usa il database del portale, con qualche scrittura in più per ogni richiesta `/api`. Il funzionamento è descritto in [Backend e API](backend.md), §4.3, §4.15 e §8.

---

## 5. Domande per il servizio informatico

| Tema | Domanda | Perché serve |
|---|---|---|
| Piattaforma | Macchina virtuale o piattaforma a container (Kubernetes, OpenShift)? Con Docker o Podman? | Sceglie lo scenario del §3 |
| Database | Il database è gestito dall'ateneo? MySQL 8, MariaDB o altro? Chi fa i backup e con quale frequenza? | §3.5; i dati contribuiti (segnalazioni, segnature) esistono solo lì |
| Dominio e HTTPS | Chi gestisce dominio e certificato? C'è un reverse proxy o un bilanciatore davanti? Quanti livelli? | Valore di `TRUST_PROXY` |
| Immagini | Il server può scaricare da Docker Hub o serve un registro interno? | Nome dell'immagine nei file di deploy |
| Rete in uscita | Sono raggiungibili `archiviodigitale-icar.cultura.gov.it` e `formsubmit.co`? Serve un proxy in uscita? | Visore delle carte e email delle segnalazioni |
| Email | È preferibile un server SMTP dell'ateneo invece di FormSubmit? | Oggi l'inoltro usa solo FormSubmit: un SMTP richiederebbe uno sviluppo |
| Aggiornamenti | Gli aggiornamenti li applichiamo noi (accesso alla macchina o al namespace) o il servizio informatico? | Procedura di rilascio |
| Monitoraggio | Esiste un sistema di monitoraggio a cui collegare `/health/ready`? Dove finiscono i log? | Il portale scrive i log su standard output |
| Dati personali | Ci sono requisiti GDPR o di conservazione da rispettare? | Le segnalazioni conservano un hash dell'IP e, facoltativamente, un'email |

---

## 6. Trasferimento dei dati

1. Sul server attuale fare il dump del database, con le tabelle applicative (`segnalazioni`, `fuoco_segnature`, `traduzioni_lookup`, `luoghi_geo`, `schema_migrations`) e il loro contenuto:
   ```bash
   docker compose exec -T db sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction --no-tablespaces --default-character-set=utf8mb4 "$MYSQL_DATABASE"' > catasto-$(date +%F).sql
   ```
   Il file deve terminare con `-- Dump completed`. Se la produzione usa TiDB, il dump si fa da lì come in [Installazione e deployment](guides.md), §3.7.
2. Importarlo nel database dell'ateneo con `--default-character-set=utf8mb4`.
3. Avviare il portale: le migrazioni mancanti vengono applicate da sole.
4. Confrontare il numero di righe delle tabelle principali con il server di partenza, come in [Installazione e deployment](guides.md), §3.7, poi eseguire le verifiche del §3.4 e `GET /health/ready`.
5. Durante il passaggio sospendere la moderazione: le segnalazioni accettate sul server vecchio dopo il dump andrebbero perse.

Il dump contiene dati personali (hash degli IP, email facoltative dei segnalatori): va trasferito su un canale cifrato e cancellato dopo l'import.

---

## 7. Registro delle modifiche

| Versione | Data | Autore | Descrizione |
|---|---|---|---|
| 1.0 | 2026-11-01 | Pasquale Ruotolo | Prima emissione |
