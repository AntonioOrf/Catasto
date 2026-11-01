-- Coordinate dei luoghi del catasto per la mappa (/mappa).
--
-- Un luogo e' un `id_registrazione` di t_struttura_catastale: la combinazione
-- completa serie/quartiere/piviere/popolo (in citta' il gonfalone, nel contado
-- il popolo). Come le tabelle di 001 e 002 sta FUORI dal dump dell'Archivio:
-- un reimport non la tocca e i dati storici restano intatti.
--
-- `chiave_nomi` conserva i nomi serie|quartiere|piviere|popolo del luogo al
-- momento dell'abbinamento: se un reimport del dump rinumerasse gli
-- id_registrazione, il confronto con i nomi attuali lo rivela.
--
-- `certezza`: sicura (voce del Repetti con coordinate, confermata dal
-- piviere), approssimata (coordinate calcolate o non confermate),
-- solo_piviere (coordinate della pieve o della citta'), non_trovata.
-- `revisionato` = 1 per le righe controllate a mano: l'import automatico
-- (006) non le sovrascrive.

CREATE TABLE IF NOT EXISTS luoghi_geo (
  id_registrazione INT           NOT NULL,
  lat              DECIMAL(9,6)  NULL,
  lng              DECIMAL(9,6)  NULL,
  certezza         ENUM('sicura','approssimata','solo_piviere','non_trovata') NOT NULL,
  nome_moderno     VARCHAR(255)  NULL,
  fonte            VARCHAR(255)  NULL,
  chiave_nomi      VARCHAR(1000) NULL,
  note             TEXT          NULL,
  revisionato      TINYINT(1)    NOT NULL DEFAULT 0,
  updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_registrazione),
  KEY idx_luoghi_geo_certezza (certezza)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
