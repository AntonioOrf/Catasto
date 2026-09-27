-- Traduzioni inglesi delle etichette REALI delle tabelle di lookup del dump.
--
-- Il seed di 003 era scritto senza conoscere il dump e usa parole brevi
-- ("Lanaiolo", "Propria"), mentre il dump ha descrizioni lunghe
-- ("arte della lana, lanaiolo, ritagliatore, ..."): nessuna corrispondeva.
-- Questi valori vengono dall'export `db:export-traduzioni` del database di
-- produzione, quindi coincidono con le etichette servite dall'API.
-- ON DUPLICATE KEY UPDATE: questa migrazione e' la fonte di verita' per queste
-- righe. Le correzioni successive passano da db:import-traduzioni.

-- mestieri (81)
INSERT INTO traduzioni_lookup (tabella, valore_it, lingua, valore) VALUES
  ('mestieri', '"Messere"" (titolo non precisato)"', 'en', '"Messere" (unspecified title)'),
  ('mestieri', 'accattone', 'en', 'Beggar'),
  ('mestieri', 'albergatore, oste, tavernaio', 'en', 'Innkeeper, host, tavern keeper'),
  ('mestieri', 'arte dei beccai, beccaio, carnaiolo, pollaiolo', 'en', 'Butchers'' guild, butcher, meat seller, poulterer'),
  ('mestieri', 'arte dei medici e speziali, medico, speziale, saponaio...', 'en', 'Physicians'' and apothecaries'' guild, physician, apothecary, soap maker...'),
  ('mestieri', 'arte dei vaiai, vaiaio, pellicciaio', 'en', 'Furriers'' guild (vaiai), furrier'),
  ('mestieri', 'arte del Cambio, cambiatore, banchiere, tavoliere', 'en', 'Bankers'' guild (Cambio), money changer, banker, counter keeper'),
  ('mestieri', 'arte della lana, lanaiolo, ritagliatore, pannaiolo, drappiere...', 'en', 'Wool guild (Lana), wool manufacturer, cloth retailer, cloth maker, draper...'),
  ('mestieri', 'arte della seta, setaiolo', 'en', 'Silk guild (Seta), silk manufacturer'),
  ('mestieri', 'arte di Calimala, mercatante', 'en', 'Calimala guild, merchant'),
  ('mestieri', 'attore di pupilli, bullettaio', 'en', 'Guardian of wards, nail maker'),
  ('mestieri', 'bambaciaio', 'en', 'Cotton worker'),
  ('mestieri', 'bandettaio, banditore', 'en', 'Town crier, herald'),
  ('mestieri', 'bastiere, bastaio, brigliaio, sellaio, guainaio', 'en', 'Packsaddle maker, bridle maker, saddler, sheath maker'),
  ('mestieri', 'becchino', 'en', 'Gravedigger'),
  ('mestieri', 'borsaio, scarsellaio', 'en', 'Purse maker, pouch maker'),
  ('mestieri', 'bottaio, barattolaio, barlettaio, tinellaio', 'en', 'Cooper, jar maker, keg maker, vat maker'),
  ('mestieri', 'calzolaio, stampatore, ciabattino', 'en', 'Shoemaker, shoe stamper, cobbler'),
  ('mestieri', 'cartolaio, cartaio, pergamenaio', 'en', 'Stationer, paper maker, parchment maker'),
  ('mestieri', 'chiavaiolo, toppaiolo', 'en', 'Locksmith, bolt maker'),
  ('mestieri', 'coltellaio, forbiciaio', 'en', 'Cutler, scissors maker'),
  ('mestieri', 'conciatore di pelle, pelacane', 'en', 'Leather tanner, skinner'),
  ('mestieri', 'Contadino che affitta terra', 'en', 'Peasant renting land'),
  ('mestieri', 'Contadino Proprietario', 'en', 'Peasant landowner'),
  ('mestieri', 'cordatore, funaiolo, saccario, «fa la stoppa»', 'en', 'Rope maker, twine maker, sack maker, «makes tow»'),
  ('mestieri', 'coreggiaio', 'en', 'Leather strap maker'),
  ('mestieri', 'cuoaio, cerbulattaio', 'en', 'Leather worker, leather-bottle maker'),
  ('mestieri', 'dipintore, miniatore, ceraiolo', 'en', 'Painter, illuminator, chandler'),
  ('mestieri', 'ebreo', 'en', 'Jew'),
  ('mestieri', 'farsettaio, calzaiolo, acconciatore di braghieri', 'en', 'Doublet maker, hosier, truss maker'),
  ('mestieri', 'ferratore, ferravecchio, pentolaio', 'en', 'Farrier, scrap-iron dealer, potter (metal pots)'),
  ('mestieri', 'fornaciaio, stufaiolo, fa occhiali', 'en', 'Kiln worker, bathhouse keeper, spectacle maker'),
  ('mestieri', 'fornaio, lasagnaio', 'en', 'Baker, pasta maker'),
  ('mestieri', 'frate, suora, commesso/a', 'en', 'Friar, nun, lay brother/sister'),
  ('mestieri', 'guarnaio', 'en', 'Fustian maker'),
  ('mestieri', 'impiegato della Zecca, sta al saggio', 'en', 'Mint employee, assayer'),
  ('mestieri', 'lanino', 'en', 'Wool worker (lanino)'),
  ('mestieri', 'lava panni', 'en', 'Cloth washer'),
  ('mestieri', 'Lavoratore a giornata agricolo', 'en', 'Agricultural day labourer'),
  ('mestieri', 'Lavoratore delle arti', 'en', 'Craft worker'),
  ('mestieri', 'Lavoratore settore Navale', 'en', 'Shipping-sector worker'),
  ('mestieri', 'Lavoratori dell''amminstrazione comunale', 'en', 'Municipal administration workers'),
  ('mestieri', 'maestro (di medicina)', 'en', 'Master (of medicine)'),
  ('mestieri', 'maestro di grammatica, maestro dell''abaco, studente, ripetitore, "ser"""', 'en', 'Grammar master, abacus master, student, tutor, "ser"'),
  ('mestieri', 'maestro di legname, legnaiolo, segatore, tornaio, tavolaccio, cassaio, cassetaio, cofinaio', 'en', 'Master carpenter, woodworker, sawyer, turner, table maker, chest maker, box maker, basket maker'),
  ('mestieri', 'maestro di pietra, muratore, lastraiolo, scarpellatore', 'en', 'Master mason, bricklayer, paver, stonecutter'),
  ('mestieri', 'maliscalco', 'en', 'Farrier (maliscalco)'),
  ('mestieri', 'manovale, lavoratore', 'en', 'Labourer, worker'),
  ('mestieri', 'materassaio, coltriciaio, pagliaiolo', 'en', 'Mattress maker, quilt maker, straw worker'),
  ('mestieri', 'Messere (membro alto clero o dottori di diritto)', 'en', 'Messere (member of the high clergy or doctor of law)'),
  ('mestieri', 'Militare', 'en', 'Soldier'),
  ('mestieri', 'mulattiere, presta ronzini, cavallaio, asinaio', 'en', 'Muleteer, horse hirer, horse dealer, donkey driver'),
  ('mestieri', 'musicante, cembalaio, trombetta, cantatore, buffone', 'en', 'Musician, cymbal player, trumpeter, singer, jester'),
  ('mestieri', 'Nobile del contado', 'en', 'Rural nobleman'),
  ('mestieri', 'non specificato', 'en', 'Not specified'),
  ('mestieri', 'oliandolo, candelaio', 'en', 'Oil seller, candle maker'),
  ('mestieri', 'orago, gioelliere, intagliatore, orpellaio', 'en', 'Goldsmith, jeweller, engraver, tinsel maker'),
  ('mestieri', 'ortolano, treccone', 'en', 'Market gardener, huckster'),
  ('mestieri', 'ottonaio, stagnaio, calderaio', 'en', 'Brass worker, tinsmith, coppersmith'),
  ('mestieri', 'pesatore, staderaio, bilanciaio', 'en', 'Weigher, steelyard maker, scale maker'),
  ('mestieri', 'pescatore, cacciatore', 'en', 'Fisherman, hunter'),
  ('mestieri', 'pettinatore, carditore, scegliatore di lana, apennichino', 'en', 'Wool comber, carder, wool sorter, apennichino'),
  ('mestieri', 'pezzaio', 'en', 'Rag dealer'),
  ('mestieri', 'pinzochero/a', 'en', 'Pinzochero/a (lay penitent)'),
  ('mestieri', 'pizzicagnolo, cacciaiolo', 'en', 'Pork butcher, game dealer'),
  ('mestieri', 'rigattiere, linaiolo', 'en', 'Second-hand dealer, linen dealer'),
  ('mestieri', 'rimendatore, ricamatore, refaiolo, torcitore di refe, pattiere', 'en', 'Darner, embroiderer, thread maker, thread twister, pattiere'),
  ('mestieri', 'riveditore', 'en', 'Cloth inspector'),
  ('mestieri', 'scodellaio, stovigliaio, vasaio, orciolaio, fiaschaio, bicchieraio', 'en', 'Bowl maker, crockery maker, potter, jug maker, flask maker, glass maker'),
  ('mestieri', 'servitore di associazione ecclesiastica', 'en', 'Servant of a church institution'),
  ('mestieri', 'servitore di privati', 'en', 'Servant of private persons'),
  ('mestieri', 'spadaio, balestriere, armaiolo, forbelarme, schermidore', 'en', 'Sword maker, crossbow maker, armourer, armour polisher, fencing master'),
  ('mestieri', 'stamaiolo, filatoio di seta', 'en', 'Yarn spinner, silk throwster'),
  ('mestieri', 'tessitore di seta e lino', 'en', 'Silk and linen weaver'),
  ('mestieri', 'tintore, curandaio', 'en', 'Dyer, bleacher'),
  ('mestieri', 'tiratore, curandaio', 'en', 'Cloth stretcher, bleacher'),
  ('mestieri', 'trasportatore', 'en', 'Carrier'),
  ('mestieri', 'Uomini di giustizia o scrittura', 'en', 'Men of law or writing'),
  ('mestieri', 'vari', 'en', 'Various'),
  ('mestieri', 'verghegiatore, scamatino, divettino', 'en', 'Wool beater, scamatino, divettino'),
  ('mestieri', 'vinattiere, mescitore di vino', 'en', 'Wine seller, wine server')
ON DUPLICATE KEY UPDATE valore = VALUES(valore);

-- bestiame (6)
INSERT INTO traduzioni_lookup (tabella, valore_it, lingua, valore) VALUES
  ('bestiame', 'Affittuario di bovini', 'en', 'Cattle tenant'),
  ('bestiame', 'Non specificato', 'en', 'Not specified'),
  ('bestiame', 'Proprietario di bovini, compresi i buoi da lavoro esonerati', 'en', 'Cattle owner, including exempt working oxen'),
  ('bestiame', 'Proprietario e affittuario di bovini', 'en', 'Cattle owner and tenant'),
  ('bestiame', 'Proprietario o affittuario di animali da tiro o da soma (cavalli, muli, asini) e eventualmente di bestiame minuto, esclusi i bovini', 'en', 'Owner or tenant of draught or pack animals (horses, mules, donkeys) and possibly small livestock, excluding cattle'),
  ('bestiame', 'Proprietario o affittuario di solo bestiame minuto (ovini, caprini, suini)', 'en', 'Owner or tenant of small livestock only (sheep, goats, pigs)')
ON DUPLICATE KEY UPDATE valore = VALUES(valore);

-- rapporto_mestiere (4)
INSERT INTO traduzioni_lookup (tabella, valore_it, lingua, valore) VALUES
  ('rapporto_mestiere', 'Impiegato, apprendista, garzone, fattore di un padrone che esercita il mestiere indicato di seguito', 'en', 'Employee, apprentice, shop boy or factor of a master practising the occupation indicated'),
  ('rapporto_mestiere', 'Mestiere esercitato in precedenza e abbandonato', 'en', 'Occupation formerly practised and abandoned'),
  ('rapporto_mestiere', 'Non specificato', 'en', 'Not specified'),
  ('rapporto_mestiere', 'Vedova o orfano minorenne di un defunto che esercitava il mestiere indicato di seguito', 'en', 'Widow or under-age orphan of a deceased man who practised the occupation indicated')
ON DUPLICATE KEY UPDATE valore = VALUES(valore);

-- immigrazione (10)
INSERT INTO traduzioni_lookup (tabella, valore_it, lingua, valore) VALUES
  ('immigrazione', 'Forestiera che possiede beni nel territorio fiorentino ma vive altrove', 'en', 'Non-resident owning property in Florentine territory but living elsewhere'),
  ('immigrazione', 'Non specificato', 'en', 'Not specified'),
  ('immigrazione', 'Proveniente da un altro paese che non sia nè l''Italia né la Germania', 'en', 'From a country other than Italy or Germany'),
  ('immigrazione', 'Proveniente da una località  del territorio fiorentino', 'en', 'From a place in Florentine territory'),
  ('immigrazione', 'Proveniente da una località  italiana non soggetta a Firenze', 'en', 'From an Italian place not subject to Florence'),
  ('immigrazione', 'Proveniente dalla Germania', 'en', 'From Germany'),
  ('immigrazione', 'Residente in Germania', 'en', 'Resident in Germany'),
  ('immigrazione', 'Residente in Italia ma al di fuori della Toscana fiorentina', 'en', 'Resident in Italy but outside Florentine Tuscany'),
  ('immigrazione', 'Residente in un altro paese che non sia nè l''talia nè la Germania', 'en', 'Resident in a country other than Italy or Germany'),
  ('immigrazione', 'Vive e risiede in una località del territorio fiorentino diversa da quella in cui è soggetta al pagamento delle imposte', 'en', 'Lives in a place in Florentine territory other than the one where taxed')
ON DUPLICATE KEY UPDATE valore = VALUES(valore);

-- casa (5)
INSERT INTO traduzioni_lookup (tabella, valore_it, lingua, valore) VALUES
  ('casa', 'Affittuario della propria casa', 'en', 'Tenant of own house'),
  ('casa', 'Non specificato', 'en', 'Not specified'),
  ('casa', 'Ospitato gratuitamente a casa di qualcuno', 'en', 'Lodged free of charge in someone else''s house'),
  ('casa', 'Proprietario della propria casa', 'en', 'Owner of own house'),
  ('casa', 'Proprietario della propria casa ma, in assenza del campione, non si sa se il valore di tale casa sia stato dedotto dal patrimonio imponibile (a Firenze e Pisa)', 'en', 'Owner of own house, but without the campione it is unknown whether its value was deducted from taxable assets (Florence and Pisa)')
ON DUPLICATE KEY UPDATE valore = VALUES(valore);

-- particolarita_fuoco (9)
INSERT INTO traduzioni_lookup (tabella, valore_it, lingua, valore) VALUES
  ('particolarita_fuoco', 'aggiunto «di nuovo» dai Terzi Ufficiali del catasto (1429-1430)', 'en', 'Added «anew» by the Terzi Ufficiali of the Catasto (1429-1430)'),
  ('particolarita_fuoco', 'beni di collettività  (comuni o parrocchie rurali, associazioni, confraternite) senza bocche dichiarate', 'en', 'Property of a community (communes or rural parishes, associations, confraternities) with no declared mouths'),
  ('particolarita_fuoco', 'comunità  religiosa', 'en', 'Religious community'),
  ('particolarita_fuoco', 'dati incompleti a causa del deterioramento del documento', 'en', 'Incomplete data due to damage to the document'),
  ('particolarita_fuoco', 'dichiarazione presente nei sommari, ma soppressa nei campioni durante le verifiche, quando ci si è accorti che si trattava di un duplicato', 'en', 'Declaration in the summaries but removed from the campioni during checks, once found to be a duplicate'),
  ('particolarita_fuoco', 'esente da imposta dopo giustificazione del privilegio', 'en', 'Exempt from tax after proof of privilege'),
  ('particolarita_fuoco', 'Nessuna particolarità', 'en', 'No particularity'),
  ('particolarita_fuoco', 'patrimonio di un defunto senza eredi; dichiarazione senza bocche', 'en', 'Estate of a deceased person without heirs, declaration without mouths'),
  ('particolarita_fuoco', 'valori fiscali non dichiarati', 'en', 'Fiscal values not declared')
ON DUPLICATE KEY UPDATE valore = VALUES(valore);

-- particolarita_parenti (10)
INSERT INTO traduzioni_lookup (tabella, valore_it, lingua, valore) VALUES
  ('particolarita_parenti', 'bambino dato a balia fuori dalla famiglia', 'en', 'Child sent to a wet nurse outside the household'),
  ('particolarita_parenti', 'di nascita illegittima', 'en', 'Of illegitimate birth'),
  ('particolarita_parenti', 'neonato/a aggiunto/a alla prima dichiarazione', 'en', 'Newborn added to the first declaration'),
  ('particolarita_parenti', 'Nessuna Particolarità', 'en', 'No particularity'),
  ('particolarita_parenti', 'persona affetta da infermità fisica o mentale', 'en', 'Person with a physical or mental infirmity'),
  ('particolarita_parenti', 'persona che esercita un’attività professionale diversa da quella del capofamiglia', 'en', 'Person with an occupation different from that of the head of household'),
  ('particolarita_parenti', 'persona non considerata come “bocca” dall’amministrazione', 'en', 'Person not counted as a “mouth” by the administration'),
  ('particolarita_parenti', 'persona recentemente deceduta e cancellata dalla dichiarazione come “bocca""', 'en', 'Person recently deceased and removed from the declaration as a “mouth”'),
  ('particolarita_parenti', 'persona recentemente sposata e cancellata dalla dichiarazione come “bocca”', 'en', 'Person recently married and removed from the declaration as a “mouth”'),
  ('particolarita_parenti', 'persona riconosciuta come “bocca” ma assente e residente fuori dal territorio fiorentino', 'en', 'Person counted as a “mouth” but absent and living outside Florentine territory')
ON DUPLICATE KEY UPDATE valore = VALUES(valore);

-- rapporti_parentela (91)
INSERT INTO traduzioni_lookup (tabella, valore_it, lingua, valore) VALUES
  ('rapporti_parentela', 'altro co-capofamiglia e sua moglie, in rapporto di parentela con il 1', 'en', 'Other co-head of household and his wife, related to no. 1'),
  ('rapporti_parentela', 'apprendista', 'en', 'Apprentice'),
  ('rapporti_parentela', 'bambino allevato "per amore di Dio"""', 'en', 'Child raised "for the love of God"'),
  ('rapporti_parentela', 'bisnipoti del 1,2,3,4', 'en', 'Great-grandchildren of no. 1, 2, 3, 4'),
  ('rapporti_parentela', 'co-capofamiglia o sua moglie senza parentela nota con 1,2,3,4,5', 'en', 'Co-head of household or his wife with no known kinship to no. 1, 2, 3, 4, 5'),
  ('rapporti_parentela', 'cugini del 1 figli del 66 e 76', 'en', 'Cousins of no. 1, children of no. 66 and 76'),
  ('rapporti_parentela', 'figli celibi o soli del 1', 'en', 'Unmarried or single children of no. 1'),
  ('rapporti_parentela', 'figli celibi o soli del 2', 'en', 'Unmarried or single children of no. 2'),
  ('rapporti_parentela', 'figli celibi o soli del 3', 'en', 'Unmarried or single children of no. 3'),
  ('rapporti_parentela', 'figli celibi o soli del 4', 'en', 'Unmarried or single children of no. 4'),
  ('rapporti_parentela', 'figli celibi o soli del 5', 'en', 'Unmarried or single children of no. 5'),
  ('rapporti_parentela', 'figli celibi o soli del 50', 'en', 'Unmarried or single children of no. 50'),
  ('rapporti_parentela', 'figli delle sorelle sposate o vedove del 1', 'en', 'Children of the married or widowed sisters of no. 1'),
  ('rapporti_parentela', 'figli delle sorelle sposate o vedove del 5', 'en', 'Children of the married or widowed sisters of no. 5'),
  ('rapporti_parentela', 'figlia sposata (o vedova con figli) e genero del 50', 'en', 'Married daughter (or widow with children) and son-in-law of no. 50'),
  ('rapporti_parentela', 'figlia sposata (o vedova con figli) o genero del 1', 'en', 'Married daughter (or widow with children) or son-in-law of no. 1'),
  ('rapporti_parentela', 'figlia sposata (o vedova con figli) o genero del 2', 'en', 'Married daughter (or widow with children) or son-in-law of no. 2'),
  ('rapporti_parentela', 'figlia sposata (o vedova con figli) o genero del 3', 'en', 'Married daughter (or widow with children) or son-in-law of no. 3'),
  ('rapporti_parentela', 'figlia sposata (o vedova con figli) o genero del 5', 'en', 'Married daughter (or widow with children) or son-in-law of no. 5'),
  ('rapporti_parentela', 'figliastro/a nato da un''altra moglie del 1', 'en', 'Stepchild born of another wife of no. 1'),
  ('rapporti_parentela', 'fratelli sposati (e co-capifamiglia) del 1 e le loro mogli', 'en', 'Married brothers (and co-heads of household) of no. 1 and their wives'),
  ('rapporti_parentela', 'fratello adulto celibe o solo (18 anni o più) del 1,2,3,4', 'en', 'Adult unmarried or single brother (18 or older) of no. 1, 2, 3, 4'),
  ('rapporti_parentela', 'fratello adulto celibe o solo (18 anni o più) del 5', 'en', 'Adult unmarried or single brother (18 or older) of no. 5'),
  ('rapporti_parentela', 'fratello o sorella della moglie del 1', 'en', 'Brother or sister of the wife of no. 1'),
  ('rapporti_parentela', 'fratello o sorella della moglie del 2', 'en', 'Brother or sister of the wife of no. 2'),
  ('rapporti_parentela', 'fratello o sorella della moglie del 3', 'en', 'Brother or sister of the wife of no. 3'),
  ('rapporti_parentela', 'fratello o sorella della moglie del 4', 'en', 'Brother or sister of the wife of no. 4'),
  ('rapporti_parentela', 'fratello o sorella della moglie del 5', 'en', 'Brother or sister of the wife of no. 5'),
  ('rapporti_parentela', 'nipoti del 1 figli del 21', 'en', 'Grandchildren of no. 1, children of no. 21'),
  ('rapporti_parentela', 'nipoti del 1 figli del 31', 'en', 'Grandchildren of no. 1, children of no. 31'),
  ('rapporti_parentela', 'nipoti del 1 figli del 41', 'en', 'Grandchildren of no. 1, children of no. 41'),
  ('rapporti_parentela', 'nipoti del 2 figli del 22', 'en', 'Grandchildren of no. 2, children of no. 22'),
  ('rapporti_parentela', 'nipoti del 2 figli del 32', 'en', 'Grandchildren of no. 2, children of no. 32'),
  ('rapporti_parentela', 'nipoti del 2 figli del 42', 'en', 'Grandchildren of no. 2, children of no. 42'),
  ('rapporti_parentela', 'nipoti del 3 figli del 23', 'en', 'Grandchildren of no. 3, children of no. 23'),
  ('rapporti_parentela', 'nipoti del 3 figli del 33', 'en', 'Grandchildren of no. 3, children of no. 33'),
  ('rapporti_parentela', 'nipoti del 3 figli del 43', 'en', 'Grandchildren of no. 3, children of no. 43'),
  ('rapporti_parentela', 'nipoti del 4 figli del 24', 'en', 'Grandchildren of no. 4, children of no. 24'),
  ('rapporti_parentela', 'nipoti del 4 figli del 34', 'en', 'Grandchildren of no. 4, children of no. 34'),
  ('rapporti_parentela', 'nipoti del 4 figli del 44', 'en', 'Grandchildren of no. 4, children of no. 44'),
  ('rapporti_parentela', 'nipoti del 5 figli del 25', 'en', 'Grandchildren of no. 5, children of no. 25'),
  ('rapporti_parentela', 'nipoti del 5 figli del 35', 'en', 'Grandchildren of no. 5, children of no. 35'),
  ('rapporti_parentela', 'nipoti del 5 figli del 45', 'en', 'Grandchildren of no. 5, children of no. 45'),
  ('rapporti_parentela', 'nipoti figli del 51', 'en', 'Grandchildren, children of no. 51'),
  ('rapporti_parentela', 'nipoti figli del 52', 'en', 'Grandchildren, children of no. 52'),
  ('rapporti_parentela', 'nipoti figli del 54', 'en', 'Grandchildren, children of no. 54'),
  ('rapporti_parentela', 'nipoti figli del 55', 'en', 'Grandchildren, children of no. 55'),
  ('rapporti_parentela', 'Non Specificato', 'en', 'Not specified'),
  ('rapporti_parentela', 'nonno o nonna del 1,2,3,4', 'en', 'Grandfather or grandmother of no. 1, 2, 3, 4'),
  ('rapporti_parentela', 'nonno o nonna del 5 o della sua moglie', 'en', 'Grandfather or grandmother of no. 5 or of his wife'),
  ('rapporti_parentela', 'nonno o nonna della moglie del 1', 'en', 'Grandfather or grandmother of the wife of no. 1'),
  ('rapporti_parentela', 'nonno o nonna della moglie del 2', 'en', 'Grandfather or grandmother of the wife of no. 2'),
  ('rapporti_parentela', 'nonno o nonna della moglie del 3', 'en', 'Grandfather or grandmother of the wife of no. 3'),
  ('rapporti_parentela', 'nonno o nonna della moglie del 4', 'en', 'Grandfather or grandmother of the wife of no. 4'),
  ('rapporti_parentela', 'nutrice', 'en', 'Wet nurse'),
  ('rapporti_parentela', 'padre o madre del 1,2,3,4', 'en', 'Father or mother of no. 1, 2, 3, 4'),
  ('rapporti_parentela', 'padre o madre del 5', 'en', 'Father or mother of no. 5'),
  ('rapporti_parentela', 'padre o madre del 50', 'en', 'Father or mother of no. 50'),
  ('rapporti_parentela', 'padre o madre della moglie del 1', 'en', 'Father or mother of the wife of no. 1'),
  ('rapporti_parentela', 'padre o madre della moglie del 2', 'en', 'Father or mother of the wife of no. 2'),
  ('rapporti_parentela', 'padre o madre della moglie del 3', 'en', 'Father or mother of the wife of no. 3'),
  ('rapporti_parentela', 'padre o madre della moglie del 4', 'en', 'Father or mother of the wife of no. 4'),
  ('rapporti_parentela', 'padre o madre della moglie del 5', 'en', 'Father or mother of the wife of no. 5'),
  ('rapporti_parentela', 'parentela piÃ¹ lontana con il 1', 'en', 'More distant kinship with no. 1'),
  ('rapporti_parentela', 'parentela sconosciuta con il 1', 'en', 'Unknown kinship with no. 1'),
  ('rapporti_parentela', 'patrigno o matrigna del 1', 'en', 'Stepfather or stepmother of no. 1'),
  ('rapporti_parentela', 'primo capofamiglia citato e sua moglie', 'en', 'First head of household named and his wife'),
  ('rapporti_parentela', 'primo figlio sposato (o vedovo) o sua moglie del 1', 'en', 'First married (or widowed) son or his wife of no. 1'),
  ('rapporti_parentela', 'primo figlio sposato (o vedovo) o sua moglie del 2', 'en', 'First married (or widowed) son or his wife of no. 2'),
  ('rapporti_parentela', 'primo figlio sposato (o vedovo) o sua moglie del 3', 'en', 'First married (or widowed) son or his wife of no. 3'),
  ('rapporti_parentela', 'primo figlio sposato (o vedovo) o sua moglie del 4', 'en', 'First married (or widowed) son or his wife of no. 4'),
  ('rapporti_parentela', 'primo figlio sposato (o vedovo) o sua moglie del 5', 'en', 'First married (or widowed) son or his wife of no. 5'),
  ('rapporti_parentela', 'primo figlio sposato (o vedovo) o sua moglie del 50', 'en', 'First married (or widowed) son or his wife of no. 50'),
  ('rapporti_parentela', 'quarto figlio sposato (o vedovo) o sua moglie del 1', 'en', 'Fourth married (or widowed) son or his wife of no. 1'),
  ('rapporti_parentela', 'quinto figlio sposato (o vedovo) o sua moglie del 1', 'en', 'Fifth married (or widowed) son or his wife of no. 1'),
  ('rapporti_parentela', 'secondo figlio sposato (o vedovo) o sua moglie del 1', 'en', 'Second married (or widowed) son or his wife of no. 1'),
  ('rapporti_parentela', 'secondo figlio sposato (o vedovo) o sua moglie del 2', 'en', 'Second married (or widowed) son or his wife of no. 2'),
  ('rapporti_parentela', 'secondo figlio sposato (o vedovo) o sua moglie del 3', 'en', 'Second married (or widowed) son or his wife of no. 3'),
  ('rapporti_parentela', 'secondo figlio sposato (o vedovo) o sua moglie del 4', 'en', 'Second married (or widowed) son or his wife of no. 4'),
  ('rapporti_parentela', 'secondo figlio sposato (o vedovo) o sua moglie del 5', 'en', 'Second married (or widowed) son or his wife of no. 5'),
  ('rapporti_parentela', 'servo, impiegato', 'en', 'Servant, employee'),
  ('rapporti_parentela', 'sorella nubile o vedova isolata o fratello minorenne del 1,2,3,4', 'en', 'Unmarried or lone widowed sister or under-age brother of no. 1, 2, 3, 4'),
  ('rapporti_parentela', 'sorella sposata (o vedova con figli) del 5', 'en', 'Married sister (or widow with children) of no. 5'),
  ('rapporti_parentela', 'sorella sposata (o vedova isolata) o fratello minorenne del 5', 'en', 'Married sister (or lone widow) or under-age brother of no. 5'),
  ('rapporti_parentela', 'sorella sposata o vedova con figli del 1,2,3,4', 'en', 'Married sister or widow with children of no. 1, 2, 3, 4'),
  ('rapporti_parentela', 'terzo figlio sposato (o vedovo) o sua moglie del 1', 'en', 'Third married (or widowed) son or his wife of no. 1'),
  ('rapporti_parentela', 'terzo figlio sposato (o vedovo) o sua moglie del 2', 'en', 'Third married (or widowed) son or his wife of no. 2'),
  ('rapporti_parentela', 'terzo figlio sposato (o vedovo) o sua moglie del 3', 'en', 'Third married (or widowed) son or his wife of no. 3'),
  ('rapporti_parentela', 'terzo figlio sposato (o vedovo) o sua moglie del 5', 'en', 'Third married (or widowed) son or his wife of no. 5'),
  ('rapporti_parentela', 'zio o zia del 1,2,3,4', 'en', 'Uncle or aunt of no. 1, 2, 3, 4'),
  ('rapporti_parentela', 'zio o zia del 5', 'en', 'Uncle or aunt of no. 5')
ON DUPLICATE KEY UPDATE valore = VALUES(valore);

-- sesso_parenti (1)
INSERT INTO traduzioni_lookup (tabella, valore_it, lingua, valore) VALUES
  ('sesso_parenti', 'indeterminato', 'en', 'Undetermined')
ON DUPLICATE KEY UPDATE valore = VALUES(valore);

-- statocivile_parenti (9)
INSERT INTO traduzioni_lookup (tabella, valore_it, lingua, valore) VALUES
  ('statocivile_parenti', 'celibe/nubile', 'en', 'Unmarried'),
  ('statocivile_parenti', 'indeterminato. In particolare, e salvo diversa indicazione, uomini di 18 anni o più', 'en', 'Undetermined; in particular, unless stated otherwise, men aged 18 or over'),
  ('statocivile_parenti', 'neoisposata dopo la prima dichiarazione e prima della chiusura del registro, eventualmente aggiunta alla nuova famiglia', 'en', 'Newly married after the first declaration and before the register was closed, possibly added to the new household'),
  ('statocivile_parenti', 'presumibilmente celibe/nubile (ecclesiastici, religiosi)', 'en', 'Presumably unmarried (clergy, religious)'),
  ('statocivile_parenti', 'promessa sposa (maritata ma non ancora andata con lo sposo)', 'en', 'Betrothed (married but not yet gone to live with the husband)'),
  ('statocivile_parenti', 'separato/a (es. donne sposate che dichiarano beni a proprio nome, sebbene il marito sia vivo e dichiari separatamente)', 'en', 'Separated (e.g. married women declaring property in their own name while the husband is alive and declares separately)'),
  ('statocivile_parenti', 'sposato/a', 'en', 'Married'),
  ('statocivile_parenti', 'sposato/a o vedovo/a', 'en', 'Married or widowed'),
  ('statocivile_parenti', 'vedovo/a', 'en', 'Widowed')
ON DUPLICATE KEY UPDATE valore = VALUES(valore);
