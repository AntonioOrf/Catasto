import { useState, useCallback, useMemo, useEffect } from "react";
import { countConditions, emptyGroup, type QueryGroup } from "@catasto/shared";
import {
  clearAstFromUrl,
  readAstFromUrl,
} from "../features/catasto/lib/query-share";
import { pruneAst } from "../features/catasto/lib/query-ast-utils";

const DEFAULT_SORT_BY = "nome";
const DEFAULT_SORT_ORDER = "ASC";

export function useCatastoFilters() {
  // Search
  const [searchPersona, setSearchPersona] = useState("");
  const [searchLocalita, setSearchLocalita] = useState("");

  // Dropdown Filters
  const [filterMestiere, setFilterMestiere] = useState("");
  const [filterBestiame, setFilterBestiame] = useState("");
  const [filterImmigrazione, setFilterImmigrazione] = useState("");
  const [filterRapporto, setFilterRapporto] = useState("");
  const [filterVolume, setFilterVolume] = useState("");

  // Range Filters
  const [filterFortuneMin, setFilterFortuneMin] = useState("");
  const [filterFortuneMax, setFilterFortuneMax] = useState("");
  const [filterCreditoMin, setFilterCreditoMin] = useState("");
  const [filterCreditoMax, setFilterCreditoMax] = useState("");
  const [filterCreditoMMin, setFilterCreditoMMin] = useState("");
  const [filterCreditoMMax, setFilterCreditoMMax] = useState("");
  const [filterImponibileMin, setFilterImponibileMin] = useState("");
  const [filterImponibileMax, setFilterImponibileMax] = useState("");
  const [filterDeduzioniMin, setFilterDeduzioniMin] = useState("");
  const [filterDeduzioniMax, setFilterDeduzioniMax] = useState("");

  // Geographic Filters
  const [filterSerie, setFilterSerie] = useState("");
  const [filterQuartiere, setFilterQuartiere] = useState("");
  const [filterPiviere, setFilterPiviere] = useState("");
  const [filterPopolo, setFilterPopolo] = useState("");
  const [filterParticolaritaParente, setFilterParticolaritaParente] = useState("");
  const [filterCasa, setFilterCasa] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState(DEFAULT_SORT_BY);
  const [sortOrder, setSortOrder] = useState(DEFAULT_SORT_ORDER);

  // Ricerca avanzata: quando attiva sostituisce i filtri semplici, non li
  // somma. Due sistemi di filtro contemporanei darebbero risultati che
  // l'utente non riesce a spiegarsi guardando la UI.
  const [advancedMode, setAdvancedMode] = useState(false);
  const [ast, setAst] = useState<QueryGroup>(() => emptyGroup("AND"));

  // Un link condiviso (#q=...) apre direttamente la ricerca avanzata.
  useEffect(() => {
    const shared = readAstFromUrl();
    if (shared) {
      setAst(shared);
      setAdvancedMode(true);
      clearAstFromUrl();
    }
  }, []);

  const handleSort = useCallback(
    (columnKey: string) => {
      if (sortBy === columnKey) {
        setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
      } else {
        setSortBy(columnKey);
        setSortOrder("ASC");
      }
    },
    [sortBy],
  );

  // Valori dei soli filtri "avanzati" (pannello collassabile): usati sia per il
  // badge sul toggle sia per abilitare il reset. I filtri base restano separati
  // perche' hanno una loro riga sempre visibile.
  const baseValues = useMemo(
    () => [searchPersona, searchLocalita, filterVolume],
    [searchPersona, searchLocalita, filterVolume],
  );

  const advancedValues = useMemo(
    () => [
      filterMestiere,
      filterRapporto,
      filterBestiame,
      filterImmigrazione,
      filterParticolaritaParente,
      filterCasa,
      filterSerie,
      filterQuartiere,
      filterPiviere,
      filterPopolo,
      filterFortuneMin,
      filterFortuneMax,
      filterCreditoMin,
      filterCreditoMax,
      filterCreditoMMin,
      filterCreditoMMax,
      filterImponibileMin,
      filterImponibileMax,
      filterDeduzioniMin,
      filterDeduzioniMax,
    ],
    [
      filterMestiere,
      filterRapporto,
      filterBestiame,
      filterImmigrazione,
      filterParticolaritaParente,
      filterCasa,
      filterSerie,
      filterQuartiere,
      filterPiviere,
      filterPopolo,
      filterFortuneMin,
      filterFortuneMax,
      filterCreditoMin,
      filterCreditoMax,
      filterCreditoMMin,
      filterCreditoMMax,
      filterImponibileMin,
      filterImponibileMax,
      filterDeduzioniMin,
      filterDeduzioniMax,
    ],
  );

  const countFilled = (values: string[]) =>
    values.reduce((acc, v) => (v !== "" ? acc + 1 : acc), 0);

  const advancedFilterCount = useMemo(
    () => countFilled(advancedValues),
    [advancedValues],
  );

  const activeFilterCount = useMemo(
    () => countFilled(baseValues) + advancedFilterCount,
    [baseValues, advancedFilterCount],
  );

  // `ast` è lo stato di editing, `queryAst` quello effettivamente eseguibile:
  // vedi pruneAst per il perché della separazione.
  const queryAst = useMemo(() => pruneAst(ast), [ast]);
  const astConditionCount = useMemo(() => countConditions(queryAst), [queryAst]);

  // I setter di useState sono stabili: nessuna dipendenza necessaria.
  const resetFilters = useCallback(() => {
    setSearchPersona("");
    setSearchLocalita("");
    setFilterMestiere("");
    setFilterBestiame("");
    setFilterImmigrazione("");
    setFilterRapporto("");
    setFilterVolume("");
    setFilterFortuneMin("");
    setFilterFortuneMax("");
    setFilterCreditoMin("");
    setFilterCreditoMax("");
    setFilterCreditoMMin("");
    setFilterCreditoMMax("");
    setFilterImponibileMin("");
    setFilterImponibileMax("");
    setFilterDeduzioniMin("");
    setFilterDeduzioniMax("");
    setFilterSerie("");
    setFilterQuartiere("");
    setFilterPiviere("");
    setFilterPopolo("");
    setFilterParticolaritaParente("");
    setFilterCasa("");
    setSortBy(DEFAULT_SORT_BY);
    setSortOrder(DEFAULT_SORT_ORDER);
    setAst(emptyGroup("AND"));
  }, []);

  return {
    // States
    searchPersona,
    setSearchPersona,
    searchLocalita,
    setSearchLocalita,
    filterMestiere,
    setFilterMestiere,
    filterBestiame,
    setFilterBestiame,
    filterImmigrazione,
    setFilterImmigrazione,
    filterRapporto,
    setFilterRapporto,
    filterVolume,
    setFilterVolume,
    filterFortuneMin,
    setFilterFortuneMin,
    filterFortuneMax,
    setFilterFortuneMax,
    filterCreditoMin,
    setFilterCreditoMin,
    filterCreditoMax,
    setFilterCreditoMax,
    filterCreditoMMin,
    setFilterCreditoMMin,
    filterCreditoMMax,
    setFilterCreditoMMax,
    filterImponibileMin,
    setFilterImponibileMin,
    filterImponibileMax,
    setFilterImponibileMax,
    filterDeduzioniMin,
    setFilterDeduzioniMin,
    filterDeduzioniMax,
    setFilterDeduzioniMax,
    filterSerie,
    setFilterSerie,
    filterQuartiere,
    setFilterQuartiere,
    filterPiviere,
    setFilterPiviere,
    filterPopolo,
    setFilterPopolo,
    filterParticolaritaParente,
    setFilterParticolaritaParente,
    filterCasa,
    setFilterCasa,
    sortBy,
    sortOrder,

    // Ricerca avanzata
    advancedMode,
    setAdvancedMode,
    ast,
    setAst,
    queryAst,

    // Derived
    activeFilterCount,
    advancedFilterCount,
    astConditionCount,

    // Actions
    handleSort,
    resetFilters,
  };
}
