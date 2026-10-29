import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { COMPARE_MAX_FUOCHI, COMPARE_MIN_FUOCHI, SELECTION_MAX_FUOCHI, type Fuoco } from "@catasto/shared";
import { fetchFuochiByIds } from "../../api/catastoService";
import { fetchFuochiByIdsChunked } from "../../api/fuochi-by-ids";
import { userMessage } from "../../api/client";
import { useLanguage, useT } from "../../i18n";
import { CompareContext, type CompareState } from "./compare-context";
import { compareMessages } from "./compare.messages";
import {
  loadSelection,
  loadSnapshots,
  normalizeIds,
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

/**
 * Selezione dei fuochi condivisa da Consultazione e Banco di lavoro: sta
 * sopra le route, così cambiare pagina non la perde.
 */
export function CompareProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  const t = useT(compareMessages);

  // Un link #confronta= vince sulla selezione della sessione e apre subito la vista.
  const [fromLink] = useState(() => (typeof window === "undefined" ? null : readCompareFromHash(window.location.hash)));
  const [ids, setIds] = useState<number[]>(() => fromLink ?? loadSelection());
  const [viewOpen, setViewOpen] = useState(
    () => (fromLink?.length ?? 0) >= COMPARE_MIN_FUOCHI && (fromLink?.length ?? 0) <= COMPARE_MAX_FUOCHI,
  );
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

  // Fuochi senza copia (link condiviso, raccolta aperta): si chiedono al server
  // una volta sola, poi restano come copie.
  const missing = useMemo(() => ids.filter((id) => !snapshots[id]), [ids, snapshots]);
  const missingQuery = useQuery({
    queryKey: ["fuochiByIds", lang, missing],
    queryFn: ({ signal }) => fetchFuochiByIdsChunked(missing, signal),
    enabled: missing.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  // Id inesistenti (link vecchio o scritto a mano): tolti senza bloccare il resto.
  useEffect(() => {
    const data = missingQuery.data;
    if (!data) return;
    const found = new Map(data.map((f) => [Number(f.id), f]));
    const gone = missing.filter((id) => !found.has(id));
    if (found.size > 0) setSnapshots((current) => ({ ...current, ...Object.fromEntries(found) }));
    if (gone.length === 0) return;
    setRemovedCount((n) => n + gone.length);
    setIds((current) => current.filter((id) => !gone.includes(id)));
  }, [missingQuery.data, missing]);

  const canCompare = ids.length >= COMPARE_MIN_FUOCHI && ids.length <= COMPARE_MAX_FUOCHI;

  // A vista aperta i dati del server nella lingua attuale (le copie possono
  // essere in un'altra lingua); senza risposta bastano le copie.
  const viewQuery = useQuery({
    queryKey: ["fuochiByIds", lang, ids],
    queryFn: ({ signal }) => fetchFuochiByIds(ids, signal),
    enabled: viewOpen && canCompare,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
  });

  const fuochi = useMemo(() => {
    const byId = new Map((viewOpen ? (viewQuery.data ?? []) : []).map((f) => [Number(f.id), f]));
    return ids.flatMap((id) => byId.get(id) ?? snapshots[id] ?? []);
  }, [viewOpen, viewQuery.data, ids, snapshots]);

  // Un errore conta solo se lascia fuori qualche fuoco: con le copie il confronto funziona lo stesso.
  const incomplete = fuochi.length < ids.length;
  const failed = missingQuery.isError ? missingQuery.error : viewQuery.isError ? viewQuery.error : null;

  const toggle = useCallback((row: Fuoco) => {
    const id = Number(row.id);
    setSnapshots((current) => ({ ...current, [id]: row }));
    setIds((current) => toggleId(current, id));
  }, []);
  const remove = useCallback((id: number) => setIds((current) => current.filter((x) => x !== id)), []);
  const add = useCallback((more: readonly number[]) => setIds((current) => normalizeIds([...current, ...more])), []);
  const replace = useCallback((next: number[]) => {
    setIds(normalizeIds(next));
    setRemovedCount(0);
  }, []);
  const clear = useCallback(() => {
    setIds([]);
    setViewOpen(false);
    setRemovedCount(0);
  }, []);

  useEffect(() => {
    if (!canCompare) setViewOpen(false);
  }, [canCompare]);

  const value = useMemo<CompareState>(
    () => ({
      ids,
      fuochi,
      loading: (missingQuery.isLoading || viewQuery.isLoading) && incomplete,
      error: failed && incomplete ? userMessage(failed, t("loadError"), lang) : null,
      removedCount,
      full: ids.length >= SELECTION_MAX_FUOCHI,
      canCompare,
      isSelected: (id) => ids.includes(id),
      toggle,
      remove,
      add,
      replace,
      clear,
      viewOpen,
      openView: () => setViewOpen(true),
      closeView: () => setViewOpen(false),
    }),
    [ids, fuochi, incomplete, missingQuery.isLoading, viewQuery.isLoading, failed, t, lang, removedCount, canCompare, toggle, remove, add, replace, clear, viewOpen],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}
