-- Stato condiviso fra più istanze del backend, usato solo con
-- SHARED_STATE=mysql (vedi src/config/shared-state.ts). Con un solo container
-- le tabelle restano vuote.

-- Contatori dei rate limit: una riga per limiter e client ("api:203.0.113.7").
CREATE TABLE IF NOT EXISTS rate_limit_hits (
  chiave VARCHAR(191) NOT NULL,
  hits INT UNSIGNED NOT NULL,
  reset_at DATETIME(3) NOT NULL,
  PRIMARY KEY (chiave),
  KEY idx_rate_limit_hits_reset (reset_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Generazione delle cache in memoria: POST /api/filters/cache/invalidate la
-- incrementa e ogni istanza svuota le proprie cache quando la vede cambiare.
CREATE TABLE IF NOT EXISTS cache_generazioni (
  nome VARCHAR(64) NOT NULL,
  generazione BIGINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
