import { useState, useCallback } from "react";

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
  const [sortBy, setSortBy] = useState("nome");
  const [sortOrder, setSortOrder] = useState("ASC");

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

    // Actions
    handleSort,
  };
}
