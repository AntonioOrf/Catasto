import { useState, useCallback, useMemo, useEffect } from "react";
import { countConditions, emptyGroup, type QueryGroup } from "@catasto/shared";
import {
  clearAstFromUrl,
  readAstFromUrl,
} from "../features/catasto/lib/query-share";
import { pruneAst } from "../features/catasto/lib/query-ast-utils";
import {
  BASE_FILTER_KEYS,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  EMPTY_SIMPLE_FILTERS,
  GEO_CASCADE,
  PANEL_FILTER_KEYS,
  countFilled,
  type SearchParams,
  type SimpleFilterKey,
  type SimpleFilters,
  type SortOrder,
} from "../features/catasto/lib/simple-filters";

export function useCatastoFilters() {
  const [filters, setFilters] = useState<SimpleFilters>(EMPTY_SIMPLE_FILTERS);
  const [sortBy, setSortBy] = useState(DEFAULT_SORT_BY);
  const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_SORT_ORDER);

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

  const setFilter = useCallback((key: SimpleFilterKey, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      for (const child of GEO_CASCADE[key] ?? []) next[child] = "";
      return next;
    });
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

  // Il badge di "Altri filtri" conta solo il pannello collassabile; il reset
  // considera anche la riga sempre visibile.
  const advancedFilterCount = useMemo(() => countFilled(filters, PANEL_FILTER_KEYS), [filters]);
  const activeFilterCount = useMemo(
    () => countFilled(filters, BASE_FILTER_KEYS) + advancedFilterCount,
    [filters, advancedFilterCount],
  );

  // `ast` è lo stato di editing, `queryAst` quello effettivamente eseguibile:
  // vedi pruneAst per il perché della separazione.
  const queryAst = useMemo(() => pruneAst(ast), [ast]);
  const astConditionCount = useMemo(() => countConditions(queryAst), [queryAst]);

  /** La ricerca da eseguire: cambia identità solo quando cambia davvero. */
  const searchParams = useMemo<SearchParams>(
    () => ({ ...filters, sortBy, sortOrder, advancedMode, ast: queryAst }),
    [filters, sortBy, sortOrder, advancedMode, queryAst],
  );

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_SIMPLE_FILTERS);
    setSortBy(DEFAULT_SORT_BY);
    setSortOrder(DEFAULT_SORT_ORDER);
    setAst(emptyGroup("AND"));
  }, []);

  return {
    filters,
    setFilter,
    sortBy,
    sortOrder,
    handleSort,

    advancedMode,
    setAdvancedMode,
    ast,
    setAst,

    activeFilterCount,
    advancedFilterCount,
    astConditionCount,
    searchParams,

    resetFilters,
  };
}

export type FiltersState = ReturnType<typeof useCatastoFilters>;
