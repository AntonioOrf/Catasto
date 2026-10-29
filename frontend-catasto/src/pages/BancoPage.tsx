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
import { addToCollection, readCollectionFromHash, type Raccolta } from "../features/banco/collections";
import { loadColumns, resetColumns, storeColumns, visibleColumns, type ColumnsState } from "../features/banco/columns";
import BancoCharts from "../features/banco/components/BancoCharts";
import BancoTable from "../features/banco/components/BancoTable";
import CollectionsPanel from "../features/banco/components/CollectionsPanel";
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

/**
 * Banco di lavoro (#46): la stessa query della Consultazione (stesso AST,
 * stesso compilatore), letta come una frase, con colonne a scelta, grafici su
 * tutti i risultati, raccolte e una tabella densa. Pensato per il computer;
 * sul telefono resta usabile con la tabella che scorre di lato.
 */
export default function BancoPage() {
  const t = useT(bancoMessages);
  const { lang, locale } = useLanguage();
  const { ast, setAst, setAdvancedMode, searchParams, sortBy, sortOrder, handleSort } = useFilters();

  const [source, setSource] = useState<Source>({ kind: "query" });
  const [notice, setNotice] = useState("");

  // Un link #raccolta= salva la raccolta sul dispositivo e la apre.
  useEffect(() => {
    const shared = readCollectionFromHash(window.location.hash);
    if (!shared) return;
    const saved = addToCollection(shared.nome, shared.ids).find((r) => r.nome === shared.nome);
    setSource({ kind: "raccolta", raccolta: saved ?? { id: "", ...shared } });
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

  const statsState = useCatastoStats(search, true);

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

  const [activeId, setActiveId] = useState<number | null>(null);
  const activeRow = rows.find((r) => r.id === activeId) ?? null;
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
            {t("showingCollection", { nome: source.raccolta.nome })}
            {" · "}
            <button type="button" onClick={() => setSource({ kind: "query" })} className="text-base text-primary underline underline-offset-4 min-h-11">
              {t("backToQuery")}
            </button>
          </p>
        ) : (
          <QueryPanel ast={ast} onChange={editAst} options={filterOptions} />
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] items-start">
          <section aria-labelledby="banco-risultati" className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-baseline gap-x-4 border-b border-border-base pb-1">
              <h2 id="banco-risultati" className="text-xl font-bold text-accent-strong">
                {t("results")}
              </h2>
              <span role="status" aria-live="polite" className="italic text-text-accent tabular-nums">
                {countLabel}
              </span>
              <span className="ml-auto flex items-baseline gap-4">
                <ColumnsMenu state={columns} onChange={changeColumns} onReset={() => setColumns(resetColumns())} label={columnLabel} />
                <ExportMenu search={search} totalRecords={total} />
              </span>
            </div>

            <BancoTable
              columns={visibleColumns(columns)}
              rows={rows}
              label={columnLabel}
              stats={statsState.stats}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              activeId={activeId}
              onActive={setActiveId}
              onOpenCarta={setViewer}
              loading={results.isLoading}
              stale={results.isPlaceholderData}
              fetching={results.isFetching}
              error={results.isError ? userMessage(results.error, t("loadError"), lang) : null}
              onRetry={() => void results.refetch()}
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
          </section>

          <section aria-labelledby="banco-grafici" className="space-y-2 xl:sticky xl:top-4">
            <h2 id="banco-grafici" className="text-xl font-bold text-accent-strong border-b border-border-base pb-1">
              {t("chartsSection")}
            </h2>
            <p className="text-xs text-text-accent">{t("chartsNote")}</p>
            <BancoCharts
              stats={statsState.stats}
              loading={statsState.loading}
              error={statsState.unavailable ? null : statsState.error}
              unavailable={statsState.unavailable}
              active={activeRow}
            />
          </section>
        </div>

        <CollectionsPanel
          activeId={source.kind === "raccolta" ? source.raccolta.id : null}
          onOpen={(r) => setSource({ kind: "raccolta", raccolta: r })}
        />
      </main>
      <Footer />
      <CompareBar />

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
