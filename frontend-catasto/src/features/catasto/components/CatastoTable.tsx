import React, { useCallback, useState } from "react";
import { BookOpen, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import CatastoRow, { CatastoMobileCard } from "./CatastoRow";
import Pagination from "./Pagination";
import ArchivioViewerModal from "./ArchivioViewerModal";
import SegnalazioneModal from "../../segnalazioni/components/SegnalazioneModal";
import { useFilters } from "../../../context/FilterContext";
import type { Fuoco, Parenti, TipoSegnalazione } from "@catasto/shared";
import type { RiferimentoArchivio } from "../lib/archivio";
import { parseSegnaturaPortata } from "../lib/segnatura";
import { useLanguage, useT } from "../../../i18n";
import { catastoTableMessages } from "./CatastoTable.messages";

interface CatastoTableProps {
  /** Tabella sopra il breakpoint lg, card sotto: se ne monta una sola. */
  isDesktop: boolean;
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

/**
 * Volume e carta da aprire nel visore. La portata ha volume e carta solo
 * nella segnatura accettata, e un codice d'archivio solo se il suo volume è
 * fra quelli digitalizzati del fondo Catasto: altrimenti non si apre.
 */
function viewerVolume(row: Fuoco, riferimento: RiferimentoArchivio) {
  if (riferimento === "campione") {
    return { codiceArchivio: row.codice_archivio ?? "", volume: row.volume ?? "", foglio: row.foglio ?? "" };
  }
  if (!row.codice_archivio_portata || !row.segnatura_portata) return null;
  const { volume, carta } = parseSegnaturaPortata(row.segnatura_portata);
  if (!volume || !carta) return null;
  return { codiceArchivio: row.codice_archivio_portata, volume, foglio: carta };
}

export default function CatastoTable({
  isDesktop,
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

  // Gestione icone ordinamento con colori dinamici
  const renderSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey)
      return (
        <ArrowUpDown className="h-4 w-4 text-text-accent opacity-30 ml-1" />
      );

    return sortOrder === "ASC" ? (
      <ArrowUp className="h-4 w-4 text-primary ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 text-primary ml-1" />
    );
  };

  // Righe vecchie attenuate ma leggibili: segnalano l'attesa senza far
  // sparire la tabella a ogni cambio di pagina.
  const staleClasses = `transition-opacity motion-reduce:transition-none ${stale ? "opacity-50" : ""}`;

  const thClasses =
    "bg-bg-sidebar px-6 py-2 text-left text-xs font-bold text-text-accent uppercase tracking-wider";

  // Il pulsante dentro l'intestazione rende l'ordinamento raggiungibile da
  // tastiera; aria-sort annuncia colonna e verso correnti.
  const sortableHeader = (column: string, label: string) => (
    <th
      key={column}
      className={thClasses}
      scope="col"
      aria-sort={sortBy === column ? (sortOrder === "ASC" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => handleSort(column)}
        className="flex items-center gap-1 min-h-11 w-full uppercase tracking-wider font-bold hover:text-primary transition-colors"
      >
        {label}
        {renderSortIcon(column)}
      </button>
    </th>
  );

  const errorState = (compact = false) => (
    <div role="alert" className={`${compact ? "px-4 py-8" : "px-6 py-12"} text-center text-text-main bg-red-500/10 border border-red-500/40 rounded`}>
      <p className="font-bold text-lg mb-1">{t("loadError")}</p>
      <p className="text-sm text-text-accent mb-4">{error}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center min-h-11 px-4 rounded bg-primary text-on-primary text-sm font-bold hover:bg-primary/90 transition-colors"
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
          className="inline-flex items-center min-h-11 px-4 rounded border border-border-base bg-bg-main text-accent-strong text-sm font-bold hover:bg-item-hover transition-colors"
        >
          {t("resetFilters")}
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border-base pb-2 gap-2">
        <h2 className="text-lg md:text-xl font-bold text-primary flex items-center gap-2 font-serif">
          <BookOpen className="h-5 w-5 md:h-6 md:w-6" /> {t("heading")}
        </h2>
        {/* Annunciato ai lettori di schermo: è l'unico riscontro che una
            ricerca è andata a buon fine senza guardare la tabella. */}
        <span
          role="status"
          aria-live="polite"
          className="bg-primary text-on-primary px-2 py-1 md:px-3 text-xs md:text-sm font-bold rounded-full tabular-nums"
        >
          {Number(totalRecords || 0).toLocaleString(locale)} {totalRecords === 1 ? t("result") : t("results")}
        </span>
      </div>

      <div className="bg-bg-main shadow-lg border border-border-base rounded-sm overflow-hidden">
        {isDesktop ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-base" aria-busy={fetching}>
              <thead className="bg-bg-sidebar">
                <tr>
                  {sortableHeader("nome", t("colHead"))}
                  {sortableHeader("localita", t("colPlace"))}
                  {sortableHeader("fortune", t("colSummary"))}
                  <th scope="col" className={thClasses}>
                    {t("colRefs")}
                  </th>
                  <th scope="col" className="px-6 py-4 w-10">
                    <span className="sr-only">{t("expand")}</span>
                  </th>
                </tr>
              </thead>

              <tbody className={`bg-bg-main divide-y divide-border-base ${staleClasses}`}>
                {error ? (
                  <tr>
                    <td colSpan={5} className="p-4">
                      {errorState()}
                    </td>
                  </tr>
                ) : loading ? (
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="animate-pulse motion-reduce:animate-none">
                      <td className="px-6 py-4" colSpan={5}>
                        <div className="h-8 bg-border-base/50 rounded flex items-center px-4">
                          {i === 0 && <span className="text-text-accent font-serif text-sm">{t("loading")}</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : data.length > 0 ? (
                  data.map((row) => <CatastoRow key={row.id} ref={registerRow(row.id)} {...rowProps(row)} />)
                ) : (
                  <tr>
                    <td colSpan={5}>{emptyState()}</td>
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
                  <div className="h-5 bg-border-base/50 rounded w-1/3"></div>
                  <div className="h-4 bg-border-base/50 rounded w-1/2"></div>
                  <div className="h-4 bg-border-base/50 rounded w-1/4"></div>
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
