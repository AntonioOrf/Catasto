-- Dump di prova per i test di integrazione: stesse tabelle e colonne di
-- init/Catasto.sql usate dal backend, con pochi fuochi scelti per coprire i
-- casi limite (valori assenti, zeri, partizioni omonime, parenti senza età).
-- I tipi sono quelli dedotti dalle query (docs/architettura.md): fanno fede
-- quelli del dump reale. Le migrazioni si applicano dopo, come in produzione.

CREATE TABLE mestieri (id INT PRIMARY KEY, Mestiere VARCHAR(255)) DEFAULT CHARSET=utf8mb4;
CREATE TABLE casa (Id_casa INT PRIMARY KEY, Casa VARCHAR(255)) DEFAULT CHARSET=utf8mb4;
CREATE TABLE bestiame (ID_Bestiame INT PRIMARY KEY, Bestiame VARCHAR(255)) DEFAULT CHARSET=utf8mb4;
CREATE TABLE immigrazione (Id INT PRIMARY KEY, Immigrazione VARCHAR(255)) DEFAULT CHARSET=utf8mb4;
CREATE TABLE rapporto_mestiere (ID_Rapporto INT PRIMARY KEY, RapportoLavoro VARCHAR(255)) DEFAULT CHARSET=utf8mb4;
CREATE TABLE particolarita_fuoco (Id INT PRIMARY KEY, Particolarita VARCHAR(255)) DEFAULT CHARSET=utf8mb4;
CREATE TABLE particolarita_parenti (ID_ParticolaritaParenti INT PRIMARY KEY, ParticolaritaParenti VARCHAR(255)) DEFAULT CHARSET=utf8mb4;
CREATE TABLE rapporti_parentela (ID_Parentela INT PRIMARY KEY, Parentela VARCHAR(255)) DEFAULT CHARSET=utf8mb4;
CREATE TABLE sesso_parenti (ID_Sesso_Parenti INT PRIMARY KEY, Sesso_Parenti VARCHAR(255)) DEFAULT CHARSET=utf8mb4;
CREATE TABLE statocivile_parenti (ID_StatoCivile INT PRIMARY KEY, StatoCivle VARCHAR(255)) DEFAULT CHARSET=utf8mb4;

CREATE TABLE t_serie (id_serie INT PRIMARY KEY, nome_serie VARCHAR(255)) DEFAULT CHARSET=utf8mb4;
CREATE TABLE t_quartieri (id_quartiere INT PRIMARY KEY, nome_quartiere VARCHAR(255)) DEFAULT CHARSET=utf8mb4;
CREATE TABLE t_pivieri (id_piviere INT PRIMARY KEY, nome_piviere VARCHAR(255)) DEFAULT CHARSET=utf8mb4;
CREATE TABLE t_popoli (id_popolo INT PRIMARY KEY, nome_popolo VARCHAR(255)) DEFAULT CHARSET=utf8mb4;
CREATE TABLE t_struttura_catastale (
  id_registrazione INT PRIMARY KEY,
  id_serie INT NULL, id_quartiere INT NULL, id_piviere INT NULL, id_popolo INT NULL
) DEFAULT CHARSET=utf8mb4;
CREATE TABLE t_archivio_volumi (volume VARCHAR(16), codice_archivio VARCHAR(32)) DEFAULT CHARSET=utf8mb4;

CREATE TABLE fuochi (
  ID_Fuochi INT PRIMARY KEY,
  Nome_Fuoco VARCHAR(255),
  Volume_Fuoco VARCHAR(16),
  Foglio_Fuoco VARCHAR(16),
  Fortune_Fuoco DECIMAL(12,2) NULL,
  Credito_Fuoco DECIMAL(12,2) NULL,
  CreditoM_Fuoco DECIMAL(12,2) NULL,
  Imponibile_Fuoco DECIMAL(12,2) NULL,
  Deduzioni_Fuoco DECIMAL(12,2) NULL,
  Mestiere_Fuoco INT NULL,
  Bestiame_Fuoco INT NULL,
  Immigrazione_Fuoco INT NULL,
  RapportoMestiere_Fuoco INT NULL,
  Casa_Fuoco INT NULL,
  Particolarita_Fuoco INT NULL,
  id_registrazione INT NULL
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE parenti (
  ID_Parente INT PRIMARY KEY AUTO_INCREMENT,
  ID_FUOCO INT NOT NULL,
  Eta INT NULL,
  Parentela INT NULL,
  Sesso INT NULL,
  StatoCivile INT NULL,
  Particolarita INT NULL,
  KEY idx_parenti_fuoco (ID_FUOCO)
) DEFAULT CHARSET=utf8mb4;

INSERT INTO mestieri VALUES (1, 'Lanaiolo'), (2, 'Speziale'), (3, 'Notaio');
INSERT INTO casa VALUES (1, 'Casa propria'), (2, 'Casa in affitto');
INSERT INTO bestiame VALUES (1, 'Buoi');
INSERT INTO immigrazione VALUES (1, 'Dal contado');
INSERT INTO rapporto_mestiere VALUES (1, 'Lavoratore indipendente');
INSERT INTO particolarita_fuoco VALUES (1, 'Miserabile');
INSERT INTO particolarita_parenti VALUES (1, 'Infermo');
INSERT INTO rapporti_parentela VALUES (1, 'Capofamiglia'), (2, 'Moglie'), (3, 'Figlio'), (4, 'Figlia');
INSERT INTO sesso_parenti VALUES (1, 'Maschio'), (2, 'Femmina');
INSERT INTO statocivile_parenti VALUES (1, 'Sposato'), (2, 'Celibe'), (3, 'Vedovo');

INSERT INTO t_serie VALUES (1, 'Città'), (2, 'Contado');
INSERT INTO t_quartieri VALUES (1, 'San Giovanni (I)'), (2, 'San Giovanni (II)'), (3, 'Santo Spirito');
INSERT INTO t_pivieri VALUES (1, 'San Giovanni'), (2, 'Impruneta');
INSERT INTO t_popoli VALUES (1, 'San Lorenzo'), (2, 'San Felice in Piazza');
INSERT INTO t_struttura_catastale VALUES
  (1, 1, 1, 1, 1),
  (2, 1, 2, 1, 1),
  (3, 1, 3, 1, 2),
  (4, 2, NULL, 2, NULL);
INSERT INTO t_archivio_volumi VALUES ('0064', '2722300'), ('81', '2722400');

-- Fortune: 9 valori presenti (fra cui due zeri) e uno assente.
INSERT INTO fuochi VALUES
  (1,  'RUCELLAI GIOVANNI',  '64', '12r', 1000, 200, 50, 800,  400, 1, NULL, NULL, 1, 1, NULL, 1),
  (2,  'STROZZI PALLA',      '64', '13r', 5000, 800, 900, 4000, 1000, 1, NULL, NULL, 1, 1, NULL, 1),
  (3,  'NUTO NARDO',         '64', '14v', 0,    0,   0,   0,    150, 2, 1,    1,    NULL, 2, 1, 2),
  (4,  'BENCI GIOVANNI',     '81', '245r', 300, 10,  0,   250,  60,  2, NULL, NULL, NULL, 2, NULL, 2),
  (5,  'MEDICI COSIMO',      '81', '246r', 9000, 3000, 2500, 7000, 2000, 3, NULL, NULL, 1, 1, NULL, 1),
  (6,  'PITTI LUCA',         '81', '247v', 450, NULL, NULL, 300, 150, 3, NULL, NULL, NULL, 2, NULL, 3),
  (7,  'GUASCONI BIAGIO',    '81', '248r', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3),
  (8,  'BARTOLO DI SER NERI', '99', '1r',  0,   0,   0,   0,    0,   NULL, NULL, 1, NULL, NULL, 1, 4),
  (9,  'ANTONIO MARCO',      '99', '2r',  120, 0,   0,   80,   40,  1, NULL, 1, NULL, 2, NULL, 4),
  (10, 'ZATI FRANCESCO',     '99', '3v',  760, 40,  10,  700,  60,  NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO parenti (ID_FUOCO, Eta, Parentela, Sesso, StatoCivile, Particolarita) VALUES
  (1, 45, 1, 1, 1, NULL), (1, 38, 2, 2, 1, NULL), (1, 12, 3, 1, 2, NULL), (1, 0, 4, 2, NULL, NULL),
  (2, 60, 1, 1, 1, NULL), (2, 52, 2, 2, 1, NULL),
  (3, 30, 1, 1, 2, 1),
  (4, 70, 1, 1, 3, NULL), (4, 8, 3, 1, 2, NULL), (4, NULL, 4, 2, NULL, NULL),
  (5, 38, 1, 1, 1, NULL), (5, 35, 2, 2, 1, NULL), (5, 14, 3, 1, 2, NULL), (5, 10, 3, 1, 2, NULL), (5, 3, 4, 2, NULL, NULL),
  (6, 82, 1, 1, 3, 1),
  (8, 25, 1, 1, 2, NULL), (8, 22, 2, 2, 1, NULL),
  (9, 40, 1, 1, 1, NULL),
  (10, 33, 1, 1, 1, NULL);
