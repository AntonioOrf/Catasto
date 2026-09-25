-- Segnalazioni degli utenti + dati redazionali derivati.
--
-- Le tabelle stanno FUORI dal dump dell'Archivio (init/Catasto.sql): un
-- reimport del dump ricrea solo le sue tabelle e non tocca queste, quindi il
-- contributo degli utenti sopravvive agli aggiornamenti della base dati.

CREATE TABLE IF NOT EXISTS segnalazioni (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_fuoco        INT NULL,
  tipo            ENUM('dato_errato','segnatura','altro') NOT NULL,
  campo           VARCHAR(64) NULL,
  valore_attuale  VARCHAR(500) NULL,
  valore_proposto VARCHAR(500) NULL,
  note            TEXT NULL,
  email           VARCHAR(255) NULL,
  stato           ENUM('nuova','in_esame','accettata','respinta') NOT NULL DEFAULT 'nuova',
  ip_hash         CHAR(64) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_segnalazioni_stato (stato, created_at),
  KEY idx_segnalazioni_fuoco (id_fuoco),
  KEY idx_segnalazioni_abuse (ip_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nessuna FK verso `fuochi`: il dump viene reimportato con DROP TABLE e una FK
-- lo farebbe fallire. L'esistenza di id_fuoco e' verificata a livello service.

CREATE TABLE IF NOT EXISTS fuoco_segnature (
  id_fuoco       INT NOT NULL,
  segnatura      VARCHAR(500) NOT NULL,
  id_segnalazione INT UNSIGNED NULL,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_fuoco)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
