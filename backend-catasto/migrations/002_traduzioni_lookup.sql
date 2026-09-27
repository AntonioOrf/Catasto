-- Traduzioni delle etichette delle tabelle di lookup del dump (mestieri,
-- casa, rapporti di parentela, ...), servite con `?lang=en`.
--
-- Come le tabelle di 001, sta FUORI dal dump dell'Archivio: il reimport con
-- DROP TABLE non la tocca. La chiave e' l'etichetta italiana e non l'id del
-- dump, che un reimport puo' rinumerare: si popola senza conoscere gli id.
--
-- La collation utf8mb4_unicode_ci rende il confronto insensibile a maiuscole
-- e accenti ('Pigione' = 'pigione'), come la normalizzazione lato backend.
-- `tabella` e' il nome della tabella del dump (mestieri, casa, ...), `lingua`
-- il codice ISO 639-1 della traduzione ('en').
-- Luoghi e nomi di persona sono nomi propri: non si traducono.

CREATE TABLE IF NOT EXISTS traduzioni_lookup (
  tabella    VARCHAR(64)  NOT NULL,
  valore_it  VARCHAR(255) NOT NULL,
  lingua     CHAR(2)      NOT NULL,
  valore     VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (tabella, valore_it, lingua),
  KEY idx_traduzioni_lingua (lingua)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
