import React, { useCallback, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import CatastoRow, { CatastoMobileCard } from "./CatastoRow";
import Pagination from "./Pagination";
import ArchivioViewerModal from "./ArchivioViewerModal";
import SegnalazioneModal from "../../segnalazioni/components/SegnalazioneModal";
import ExportMenu from "./ExportMenu";
import GlossaryTerm from "../../glossary/GlossaryTerm";
import type { SearchParams } from "../lib/simple-filters";
import { useFilters } from "../../../context/FilterContext";
import type { Fuoco, Parenti, TipoSegnalazione } from "@catasto/shared";
import type { RiferimentoArchivio } from "../lib/archivio";
import { viewerVolume } from "../lib/viewer-volume";
import { useLanguage, useT } from "../../../i18n";
import { catastoTableMessages } from "./CatastoTable.messages";

interface CatastoTableProps {
  /** Tabella sopra il breakpoint lg, card sotto: se ne monta una sola. */
  isDesktop: boolean;
  /** Ricerca che ha prodotto le righe a schermo: la usa l'export. */
  search: SearchParams;
  data: Fuoco[];
  totalRecords: number;
  /** Primo caricamento, nessun dato da mostrare: scheletro. */
  loading: boolean;
  /** Qualsiasi richiesta in corso, anche con righe già a schermo. */
  fetching: boolean;
  /** Righe a schermo della pagina o ricerca precedente, in attesa delle nuove. */
  stale: boolean;
  error: string | null;
  tableRowsRef: React.MutableRefObject<Record<number, HTMLElement | null>>;
  handleRowClick: (id: number) => void;
  expandedId: number | null;
  loadingParenti: boolean;
  parentiData: Parenti[];
  page: number;
  totalPages: number;
  handlePageChange: (page: number) => void;
  /** Ripete l'ultima richiesta dopo un errore. */
  onRetry?: () => void;
}

export default function CatastoTable({
  isDesktop,
  search,
  data,
  totalRecords,
  loading,
  fetching,
  stale,
  error,
  tableRowsRef,
  handleRowClick,
  expandedId,
  loadingParenti,
  parentiData,
  page,
  totalPages,
  handlePageChange,
  onRetry,
}: CatastoTableProps) {
  const { sortBy, sortOrder, handleSort, resetFilters } = useFilters();
  const t = useT(catastoTableMessages);
  const { locale } = useLanguage();

  // Riga aperta nel visore: serve intera anche alla segnalazione lanciata da
  // lì, perché davanti alla carta originale l'utente può trascrivere la
  // segnatura. Il riferimento dice se aprire il campione o la portata.
  const [viewer, setViewer] = useState<{ row: Fuoco; riferimento: RiferimentoArchivio } | null>(null);
  const openViewer = useCallback(
    (row: Fuoco, riferimento: RiferimentoArchivio) => setViewer({ row, riferimento }),
    [],
  );
  const closeViewer = useCallback(() => setViewer(null), []);
  const viewerRow = viewer?.row ?? null;
  const viewerTarget = viewer ? viewerVolume(viewer.row, viewer.riferimento) : null;

  // La modale di segnalazione vive qui e non nella riga: una sola istanza per
  // tabella invece di una per ognuna delle 50 righe della pagina.
  const [segnalazione, setSegnalazione] = useState<{
    isOpen: boolean;
    row: Fuoco | null;
    tipo: TipoSegnalazione;
  }>({ isOpen: false, row: null, tipo: "dato_errato" });

  const handleSegnala = useCallback(
    (row: Fuoco, tipo: TipoSegnalazione = "dato_errato") =>
      setSegnalazione({ isOpen: true, row, tipo }),
    [],
  );

  const closeSegnalazione = useCallback(
    () => setSegnalazione((prev) => ({ ...prev, isOpen: false })),
    [],
  );

  const registerRow = (id: number) => (el: HTMLElement | null) => {
    tableRowsRef.current[id] = el;
  };

  const rowProps = (row: Fuoco) => ({
    row,
    expanded: expandedId === row.id,
    onRowClick: handleRowClick,
    loadingParenti,
    parentiData,
    onViewArchivio: openViewer,
    onSegnala: handleSegnala,
  });

  // Le frecce restano: quella della colonna attiva è piena, le altre appena accennate.
  const renderSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) return <ArrowUpDown className="h-3.5 w-3.5 opacity-35" aria-hidden="true" />;
    const Icon = sortOrder === "ASC" ? ArrowUp : ArrowDown;
    return <Icon className="h-4 w-4" strokeWidth={2.75} aria-hidden="true" />;
  };

  // Righe vecchie attenuate ma leggibili: segnalano l'attesa senza far
  // sparire la tabella a ogni cambio di pagina.
  const staleClasses = `transition-opacity motion-reduce:transition-none ${stale ? "opacity-50" : ""}`;

  const thClasses = "px-4 py-2 text-left text-base font-semibold text-accent-strong";

  // Il pulsante dentro l'intestazione rende l'ordinamento raggiungibile da
  // tastiera; aria-sort annuncia colonna e verso correnti.
  // Il suggerimento del glossario sta accanto al pulsante di ordinamento,
  // non dentro: due interattivi annidati non sono raggiungibili da tastiera.
  const sortableHeader = (column: string, label: string, term?: string) => (
    <th
      key={column}
      className={thClasses}
      scope="col"
      aria-sort={sortBy === column ? (sortOrder === "ASC" ? "ascending" : "descending") : "none"}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleSort(column)}
          className="flex items-center gap-1.5 min-h-11 font-semibold hover:underline underline-offset-4"
        >
          {label}
          {renderSortIcon(column)}
        </button>
        {term && <GlossaryTerm id={term} />}
      </div>
    </th>
  );

  const errorState = (compact = false) => (
    <div role="alert" className={`${compact ? "px-4 py-8" : "px-6 py-12"} text-center text-text-main bg-red-500/10 border border-red-500/40 rounded-ui`}>
      <p className="font-bold text-lg mb-1">{t("loadError")}</p>
      <p className="text-sm text-text-accent mb-4">{error}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center min-h-11 px-4 rounded-ui bg-primary text-on-primary text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          {t("retry")}
        </button>
      )}
    </div>
  );

  const emptyState = () => (
    <div className="px-6 py-12 text-center">
      <p className="text-text-main font-bold mb-1">{t("emptyTitle")}</p>
      <p className="text-sm text-text-accent mb-4">{t("emptyHint")}</p>
      {resetFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center min-h-11 px-4 rounded-ui border border-border-base bg-bg-main text-accent-strong text-sm font-bold hover:bg-item-hover transition-colors"
        >
          {t("resetFilters")}
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4 pb-12">
      <div className="flex flex-wrap items-baseline justify-between border-b border-border-base pb-1.5 gap-x-4 gap-y-1">
        <h2 className="text-xl md:text-2xl font-bold text-accent-strong font-serif">{t("heading")}</h2>
        {/* Annunciato ai lettori di schermo: è l'unico riscontro che una
            ricerca è andata a buon fine senza guardare la tabella. */}
        <div className="flex items-baseline gap-4">
          <span role="status" aria-live="polite" className="italic text-text-accent tabular-nums">
            {Number(totalRecords || 0).toLocaleString(locale)} {totalRecords === 1 ? t("result") : t("results")}
          </span>
          <ExportMenu search={search} totalRecords={totalRecords} />
        </div>
      </div>

      <div className="bg-bg-main border border-border-base rounded-ui overflow-hidden">
        {isDesktop ? (
          <div className="overflow-x-auto">
            <table className="min-w-full" aria-busy={fetching}>
              <thead>
                <tr className="border-b border-border-base">
                  <th scope="col" className="pl-3 pr-0 py-2 w-10">
                    <span className="sr-only">{t("colSelect")}</span>
                  </th>
                  {sortableHeader("nome", t("colHead"), "fuoco")}
                  {sortableHeader("localita", t("colPlace"))}
                  {sortableHeader("fortune", t("colSummary"))}
                  <th scope="col" className={thClasses}>
                    <span className="inline-flex items-center gap-1">
                      {t("colRefs")} <GlossaryTerm id="campione" />
                    </span>
                  </th>
                  <th scope="col" className="px-3 py-2 w-10">
                    <span className="sr-only">{t("expand")}</span>
                  </th>
                </tr>
              </thead>

              <tbody className={`bg-bg-main ${staleClasses}`}>
                {error ? (
                  <tr>
                    <td colSpan={6} className="p-4">
                      {errorState()}
                    </td>
                  </tr>
                ) : loading ? (
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="animate-pulse motion-reduce:animate-none">
                      <td className="px-6 py-4" colSpan={6}>
                        <div className="h-8 bg-border-base/50 rounded-ui flex items-center px-4">
                          {i === 0 && <span className="text-text-accent font-serif text-sm">{t("loading")}</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : data.length > 0 ? (
                  data.map((row) => <CatastoRow key={row.id} ref={registerRow(row.id)} {...rowProps(row)} />)
                ) : (
                  <tr>
                    <td colSpan={6}>{emptyState()}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="divide-y divide-border-base" aria-busy={fetching}>
            {error ? (
              <div className="p-2">{errorState(true)}</div>
            ) : loading ? (
              Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="animate-pulse motion-reduce:animate-none p-4 space-y-3 bg-bg-main">
                  <div className="h-5 bg-border-base/50 rounded-ui w-1/3"></div>
                  <div className="h-4 bg-border-base/50 rounded-ui w-1/2"></div>
                  <div className="h-4 bg-border-base/50 rounded-ui w-1/4"></div>
                </div>
              ))
            ) : data.length > 0 ? (
              <div className={`p-2 space-y-3 bg-bg-main ${staleClasses}`}>
                {data.map((row) => (
                  <CatastoMobileCard key={row.id} ref={registerRow(row.id)} {...rowProps(row)} />
                ))}
              </div>
            ) : (
              <div className="bg-bg-main">{emptyState()}</div>
            )}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          loading={fetching}
          handlePageChange={handlePageChange}
        />
      </div>

      <ArchivioViewerModal
        isOpen={viewerTarget !== null}
        onClose={closeViewer}
        codiceArchivio={viewerTarget?.codiceArchivio ?? ""}
        foglio={viewerTarget?.foglio ?? ""}
        volume={viewerTarget?.volume ?? ""}
        riferimento={viewer?.riferimento ?? "campione"}
        nome={viewerRow?.nome ?? ""}
        onSegnalaSegnatura={viewerRow ? () => handleSegnala(viewerRow, "segnatura") : undefined}
      />

      <SegnalazioneModal
        isOpen={segnalazione.isOpen}
        onClose={closeSegnalazione}
        row={segnalazione.row}
        defaultTipo={segnalazione.tipo}
      />
    </div>
  );
}
