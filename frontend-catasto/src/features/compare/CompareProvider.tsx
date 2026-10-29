import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { COMPARE_MAX_FUOCHI, type Fuoco } from "@catasto/shared";
import { fetchFuochiByIds } from "../../api/catastoService";
import { userMessage } from "../../api/client";
import { useLanguage, useT } from "../../i18n";
import { CompareContext, type CompareState } from "./compare-context";
import { compareMessages } from "./compare.messages";
import {
  loadSelection,
  loadSnapshots,
  readCompareFromHash,
  storeSelection,
  storeSnapshots,
  toggleId,
} from "./lib/compare-selection";

/** Toglie `confronta` dal fragment lasciando il resto (es. `#q=` di una ricerca condivisa). */
function clearCompareFromUrl() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  params.delete("confronta");
  const rest = params.toString();
  const { origin, pathname, search } = window.location;
  window.history.replaceState(null, "", `${origin}${pathname}${search}${rest ? `#${rest}` : ""}`);
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  const t = useT(compareMessages);

  // Un link #confronta= vince sulla selezione della sessione e apre subito la vista.
  const [fromLink] = useState(() => (typeof window === "undefined" ? null : readCompareFromHash(window.location.hash)));
  const [ids, setIds] = useState<number[]>(() => fromLink ?? loadSelection());
  const [viewOpen, setViewOpen] = useState(() => (fromLink?.length ?? 0) >= 2);
  const [removedCount, setRemovedCount] = useState(0);
  const [snapshots, setSnapshots] = useState<Record<number, Fuoco>>(loadSnapshots);

  useEffect(() => {
    if (fromLink) clearCompareFromUrl();
  }, [fromLink]);

  useEffect(() => storeSelection(ids), [ids]);
  // Solo le copie dei fuochi ancora selezionati.
  useEffect(() => {
    storeSnapshots(Object.fromEntries(ids.flatMap((id) => (snapshots[id] ? [[id, snapshots[id]]] : []))));
  }, [ids, snapshots]);

  const query = useQuery({
    queryKey: ["fuochiByIds", lang, ids],
    queryFn: ({ signal }) => fetchFuochiByIds(ids, signal),
    enabled: ids.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
  });

  // Id inesistenti (link vecchio o scritto a mano): tolti senza bloccare il resto.
  useEffect(() => {
    if (!query.data || query.isPlaceholderData) return;
    const found = new Set(query.data.map((f) => Number(f.id)));
    const missing = ids.filter((id) => !found.has(id));
    if (missing.length === 0) return;
    setRemovedCount((n) => n + missing.length);
    setIds((current) => current.filter((id) => found.has(id)));
  }, [query.data, query.isPlaceholderData, ids]);

  // Dati del server se ci sono (lingua attuale), altrimenti la copia presa dalla tabella.
  const fuochi = useMemo(() => {
    const byId = new Map((query.data ?? []).map((f) => [Number(f.id), f]));
    return ids.flatMap((id) => byId.get(id) ?? snapshots[id] ?? []);
  }, [query.data, ids, snapshots]);

  // Un errore conta solo se lascia fuori qualche fuoco: con le copie il confronto funziona lo stesso.
  const incomplete = fuochi.length < ids.length;

  const toggle = useCallback((row: Fuoco) => {
    const id = Number(row.id);
    setSnapshots((current) => ({ ...current, [id]: row }));
    setIds((current) => toggleId(current, id));
  }, []);
  const remove = useCallback((id: number) => setIds((current) => current.filter((x) => x !== id)), []);
  const clear = useCallback(() => {
    setIds([]);
    setViewOpen(false);
    setRemovedCount(0);
  }, []);

  useEffect(() => {
    if (ids.length < 2) setViewOpen(false);
  }, [ids.length]);

  const value = useMemo<CompareState>(
    () => ({
      ids,
      fuochi,
      loading: query.isLoading && incomplete,
      error: query.isError && incomplete ? userMessage(query.error, t("loadError"), lang) : null,
      removedCount,
      full: ids.length >= COMPARE_MAX_FUOCHI,
      isSelected: (id) => ids.includes(id),
      toggle,
      remove,
      clear,
      viewOpen,
      openView: () => setViewOpen(true),
      closeView: () => setViewOpen(false),
    }),
    [ids, fuochi, incomplete, query.isLoading, query.isError, query.error, t, lang, removedCount, toggle, remove, clear, viewOpen],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}
