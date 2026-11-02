-- Segnalazioni sui luoghi della mappa ("localizzazione errata").
--
-- Una segnalazione `localizzazione` riguarda un luogo (`id_registrazione` di
-- t_struttura_catastale, la chiave di luoghi_geo), non un fuoco: id_fuoco
-- resta NULL. Come per id_fuoco, nessuna FK verso le tabelle del dump, che un
-- reimport ricrea con DROP TABLE: l'esistenza del luogo e' verificata dal
-- service. `valore_attuale` conserva la posizione mostrata al momento della
-- segnalazione, `valore_proposto` quella indicata dall'utente.
--
-- Accettare la segnalazione non cambia le coordinate: la redazione le porta
-- in luoghi_geo con db:import-luoghi (riga revisionata).

ALTER TABLE segnalazioni
  MODIFY COLUMN tipo ENUM('dato_errato','segnatura','altro','localizzazione') NOT NULL,
  ADD COLUMN id_registrazione INT NULL AFTER id_fuoco,
  ADD KEY idx_segnalazioni_luogo (id_registrazione);
