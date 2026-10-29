import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { emptyGroup, type Fuoco, type QueryGroup } from "@catasto/shared";
import { fetchFilterOptions, fetchFuochi } from "../api/catastoService";
import { userMessage } from "../api/client";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { useFilters } from "../context/FilterContext";
import { useCatastoStats } from "../hooks/useCatastoStats";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { fieldLabel, useLanguage, useT } from "../i18n";
import ArchivioViewerModal from "../features/catasto/components/ArchivioViewerModal";
import ExportMenu from "../features/catasto/components/ExportMenu";
import Pagination from "../features/catasto/components/Pagination";
import { EMPTY_FILTER_OPTIONS } from "../features/catasto/lib/filter-options";
import { EMPTY_SIMPLE_FILTERS, type SearchParams } from "../features/catasto/lib/simple-filters";
import { viewerVolume } from "../features/catasto/lib/viewer-volume";
import CompareBar from "../features/compare/components/CompareBar";
import { bancoMessages, type BancoMessageKey } from "../features/banco/banco.messages";
import { loadTargetKey, storeTargetKey, useAddTarget, type TargetKey } from "../features/banco/add-target";
import { addToCollection, loadCollections, readCollectionFromHash, type Raccolta } from "../features/banco/collections";
import { chartsViewMessages } from "../features/banco/charts-view.messages";
import { useTargetActions } from "../features/banco/useTargetActions";
import { useCollections } from "../features/banco/useCollections";
import { loadColumns, resetColumns, storeColumns, visibleColumns, type ColumnsState } from "../features/banco/columns";
import BancoTable from "../features/banco/components/BancoTable";
import ChartsView, { type ChartsSubject } from "../features/banco/components/ChartsView";
import CollectionsPanel from "../features/banco/components/CollectionsPanel";
import DestinationPanel from "../features/banco/components/DestinationPanel";
import UndoToast from "../features/banco/components/UndoToast";
import FinderPanel from "../features/banco/components/FinderPanel";
import ColumnsMenu from "../features/banco/components/ColumnsMenu";
import QueryPanel from "../features/banco/components/QueryPanel";

const PAGE_SIZES = [25, 50, 100, 200] as const;
const DEFAULT_PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 350;

/** Colonne con un nome proprio del Banco; le altre prendono l'etichetta del registro. */
const COLUMN_LABELS: Partial<Record<string, BancoMessageKey>> = {
  nome: "colNome",
  localita: "colLocalita",
  bocche: "colBocche",
  eta_media: "colEtaMedia",
  campione: "colCampione",
  piviere: "colPiviere",
};

type Source = { kind: "query" } | { kind: "raccolta"; raccolta: Pick<Raccolta, "id" | "nome" | "ids"> };
type View = "tabella" | "grafici";

/** Preferenze del Banco sul dispositivo: vista e confronto con tutto il catasto. */
const VIEW_STORAGE_KEY = "catasto.banco.vista.v1";
const COMPARE_STORAGE_KEY = "catasto.banco.confronto.v1";
const readPref = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const writePref = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // non salvata: vale finché la pagina è aperta
  }
};

/** Tutto il catasto, per il confronto dei grafici: nessun filtro. */
const ALL_FUOCHI: SearchParams = { ...EMPTY_SIMPLE_FILTERS, sortBy: "nome", sortOrder: "ASC", advancedMode: false, ast: emptyGroup("AND") };

/**
 * Banco di lavoro (#46): la stessa query della Consultazione (stesso AST,
 * stesso compilatore), letta come una frase. «Trova e aggiungi» in testa;
 * sotto, la vista Tabella (tabella densa con accanto la raccolta che si
 * riempie) o la vista Grafici (cifre e grafici su tutti i risultati). Pensato
 * per il computer; sul telefono la tabella scorre di lato.
 */
export default function BancoPage() {
  const t = useT(bancoMessages);
  const tc = useT(chartsViewMessages);
  const { lang, locale } = useLanguage();
  const { ast, setAst, setAdvancedMode, searchParams, sortBy, sortOrder, handleSort } = useFilters();

  const [source, setSource] = useState<Source>({ kind: "query" });
  const [notice, setNotice] = useState("");
  // Dove vanno i fuochi trovati e la colonna a sinistra della tabella: si
  // ricorda sul dispositivo; una raccolta aperta diventa la destinazione.
  const [targetKey, setTargetKeyState] = useState<TargetKey>(() => loadTargetKey(loadCollections()[0]?.id));
  const setTargetKey = useCallback((key: TargetKey) => {
    setTargetKeyState(key);
    storeTargetKey(key);
  }, []);
  const target = useAddTarget(targetKey);
  const actions = useTargetActions(target);
  const { notify } = actions;
  const closeNotice = useCallback(() => notify(null), [notify]);
  const collections = useCollections();
  const [view, setViewState] = useState<View>(() => (readPref(VIEW_STORAGE_KEY) === "grafici" ? "grafici" : "tabella"));
  const setView = (next: View) => {
    setViewState(next);
    writePref(VIEW_STORAGE_KEY, next);
  };
  const [compareAll, setCompareAllState] = useState(() => readPref(COMPARE_STORAGE_KEY) === "1");
  const setCompareAll = (on: boolean) => {
    setCompareAllState(on);
    writePref(COMPARE_STORAGE_KEY, on ? "1" : "0");
  };
  const openCollection = (raccolta: Pick<Raccolta, "id" | "nome" | "ids">) => {
    setSource({ kind: "raccolta", raccolta });
    if (raccolta.id) setTargetKey({ kind: "raccolta", id: raccolta.id });
  };

  // Un link #raccolta= salva la raccolta sul dispositivo e la apre.
  useEffect(() => {
    const shared = readCollectionFromHash(window.location.hash);
    if (!shared) return;
    const saved = addToCollection(shared.nome, shared.ids).find((r) => r.nome === shared.nome);
    openCollection(saved ?? { id: "", ...shared });
    setNotice(t("collectionOpened", { nome: shared.nome }));
    const { origin, pathname, search } = window.location;
    window.history.replaceState(null, "", `${origin}${pathname}${search}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo all'arrivo sulla pagina
  }, []);

  const queryAst = searchParams.ast;
  const raccoltaIds = source.kind === "raccolta" ? source.raccolta.ids.join(",") : "";
  const liveSearch = useMemo<SearchParams>(
    () =>
      raccoltaIds
        ? { ...EMPTY_SIMPLE_FILTERS, sortBy, sortOrder, advancedMode: false, ast: emptyGroup("AND"), ids: raccoltaIds }
        : { ...EMPTY_SIMPLE_FILTERS, sortBy, sortOrder, advancedMode: true, ast: queryAst },
    [raccoltaIds, sortBy, sortOrder, queryAst],
  );
  const search = useDebouncedValue(liveSearch, SEARCH_DEBOUNCE_MS);

  const editAst = useCallback(
    (next: QueryGroup) => {
      setAst(next);
      // Tornando alla Consultazione la query resta quella del Banco.
      setAdvancedMode(true);
    },
    [setAst, setAdvancedMode],
  );

  const { data: filterOptions = EMPTY_FILTER_OPTIONS } = useQuery({
    queryKey: ["filterOptions", lang, {}],
    queryFn: ({ signal }) => fetchFilterOptions({}, signal),
    placeholderData: keepPreviousData,
    staleTime: 30 * 60 * 1000,
  });

  // Pagina e righe per pagina legate alla ricerca, come nella Consultazione.
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageState, setPageState] = useState({ search, page: 1 });
  const page = pageState.search === search ? pageState.page : 1;

  const results = useQuery({
    queryKey: ["banco", lang, search, page, pageSize],
    queryFn: ({ signal }) => fetchFuochi(search, "banco", page, pageSize, signal),
    placeholderData: keepPreviousData,
  });
  const rows = results.data?.data ?? [];
  const total = results.data?.pagination?.total ?? 0;
  const totalPages = results.data?.pagination?.totalPages || 1;

  // Medie in fondo alla tabella: sulla query mostrata.
  const statsState = useCatastoStats(search, view === "tabella");

  // Vista Grafici: i fuochi della destinazione (selezione o raccolta); se è
  // vuota, tutto il catasto.
  const targetIds = target.ids.join(",");
  const chartsSearch = useMemo<SearchParams>(() => (targetIds ? { ...ALL_FUOCHI, ids: targetIds } : ALL_FUOCHI), [targetIds]);
  const chartsStats = useCatastoStats(chartsSearch, view === "grafici");
  const chartsSubject: ChartsSubject = !targetIds
    ? { kind: "tutto" }
    : target.nome
      ? { kind: "raccolta", nome: target.nome, n: target.ids.length }
      : { kind: "selezione", n: target.ids.length };
  // Il confronto chiede tutto il catasto; se i grafici sono già di tutto il catasto è la stessa richiesta.
  const catastoStats = useCatastoStats(ALL_FUOCHI, view === "grafici" && compareAll && Boolean(targetIds));

  const [columns, setColumns] = useState<ColumnsState>(loadColumns);
  const changeColumns = (next: ColumnsState) => {
    setColumns(next);
    storeColumns(next);
  };
  const columnLabel = useCallback(
    (key: string) => {
      const own = COLUMN_LABELS[key];
      return own ? t(own) : fieldLabel(key, lang);
    },
    [t, lang],
  );

  const [viewer, setViewer] = useState<Fuoco | null>(null);
  const viewerTarget = viewer ? viewerVolume(viewer, "campione") : null;

  const countLabel = total === 1 ? t("fuocoCount") : t("fuochiCount", { n: total.toLocaleString(locale) });

  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-text-main font-serif">
      <Header />
      <main className="flex-1 w-full max-w-[1500px] mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-accent-strong">{t("heading")}</h2>
          <p className="text-sm text-text-accent">{t("intro")}</p>
          <p className="lg:hidden mt-2 text-sm border-l-[3px] border-primary pl-3">{t("mobileNotice")}</p>
          <p role="status" aria-live="polite" className="text-sm text-text-accent italic empty:hidden">
            {notice}
          </p>
        </div>

        {source.kind === "raccolta" ? (
          <p className="text-lg md:text-xl">
            {/* Il nome attuale: la raccolta si può rinominare mentre è aperta. */}
            {t("showingCollection", { nome: collections.find((r) => r.id === source.raccolta.id)?.nome ?? source.raccolta.nome })}
            {" · "}
            <button type="button" onClick={() => setSource({ kind: "query" })} className="text-base text-primary underline underline-offset-4 min-h-11">
              {t("backToQuery")}
            </button>
          </p>
        ) : (
          <QueryPanel ast={ast} onChange={editAst} options={filterOptions} />
        )}

        <FinderPanel target={target} onTarget={setTargetKey} actions={actions} />

        <section aria-labelledby="banco-risultati" className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-border-base pb-1">
            <h2 id="banco-risultati" className="text-xl font-bold text-accent-strong">
              {t("results")}
            </h2>
            <span role="status" aria-live="polite" className="italic text-text-accent tabular-nums">
              {countLabel}
            </span>
            <span role="group" aria-label={tc("viewLabel")} className="inline-flex self-center border border-border-base/60 rounded-ui text-sm">
              {(["tabella", "grafici"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`min-h-9 px-3 ${view === v ? "bg-primary text-on-primary" : "text-text-accent hover:text-primary"}`}
                >
                  {v === "tabella" ? tc("viewTable") : tc("viewCharts")}
                </button>
              ))}
            </span>
            {view === "tabella" && (
              <span className="ml-auto flex items-baseline gap-4">
                <ColumnsMenu state={columns} onChange={changeColumns} onReset={() => setColumns(resetColumns())} label={columnLabel} />
                <ExportMenu search={search} totalRecords={total} />
              </span>
            )}
          </div>

          {view === "grafici" ? (
            <ChartsView
              subject={chartsSubject}
              stats={chartsStats.stats}
              loading={chartsStats.loading}
              error={chartsStats.unavailable ? null : chartsStats.error}
              unavailable={chartsStats.unavailable}
              catasto={catastoStats.stats}
              compare={compareAll}
              onCompare={setCompareAll}
            />
          ) : (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] items-start">
              <div className="min-w-0 space-y-2">
                <BancoTable
                  columns={visibleColumns(columns)}
                  rows={rows}
                  label={columnLabel}
                  stats={statsState.stats}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  onOpenCarta={setViewer}
                  loading={results.isLoading}
                  stale={results.isPlaceholderData}
                  fetching={results.isFetching}
                  error={results.isError ? userMessage(results.error, t("loadError"), lang) : null}
                  onRetry={() => void results.refetch()}
                  target={target}
                  onToggle={(row) => actions.toggle(row.id, row.nome)}
                />

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <label className="inline-flex items-center gap-2 text-text-accent">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPageState({ search, page: 1 });
                      }}
                      className="min-h-9 border border-border-base rounded-ui px-1 bg-bg-main text-text-main"
                    >
                      {PAGE_SIZES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    {t("perPage")}
                  </label>
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  loading={results.isFetching}
                  handlePageChange={(next) => {
                    if (next >= 1 && next <= totalPages) setPageState({ search, page: next });
                  }}
                />
              </div>

              <DestinationPanel target={target} actions={actions} onOpen={openCollection} />
            </div>
          )}
        </section>

        <CollectionsPanel
          activeId={source.kind === "raccolta" ? source.raccolta.id : null}
          onOpen={openCollection}
          targetId={target.key.kind === "raccolta" ? target.key.id : null}
          onTarget={(r) => setTargetKey({ kind: "raccolta", id: r.id })}
        />
      </main>
      <Footer />
      <CompareBar />
      <UndoToast notice={actions.notice} onClose={closeNotice} />

      <ArchivioViewerModal
        isOpen={viewerTarget !== null}
        onClose={() => setViewer(null)}
        codiceArchivio={viewerTarget?.codiceArchivio ?? ""}
        foglio={viewerTarget?.foglio ?? ""}
        volume={viewerTarget?.volume ?? ""}
        riferimento="campione"
        nome={viewer?.nome ?? ""}
      />
    </div>
  );
}
