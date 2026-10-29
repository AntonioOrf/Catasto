import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useQueries } from "@tanstack/react-query";
import { Check, ExternalLink, Link2, X } from "lucide-react";
import type { Fuoco, Parenti } from "@catasto/shared";
import { fetchParentiData } from "../../../api/catastoService";
import { useModal } from "../../../hooks/useModal";
import { useIsDesktop } from "../../../hooks/useMediaQuery";
import { useLanguage, useT } from "../../../i18n";
import ArchivioViewerModal from "../../catasto/components/ArchivioViewerModal";
import { fiorini, piviereEPopolo } from "../../catasto/lib/formato";
import { viewerVolume } from "../../catasto/lib/viewer-volume";
import Spinner from "../../../components/common/Spinner";
import { useCompare } from "../compare-context";
import { compareMessages } from "../compare.messages";
import { buildCompareUrl } from "../lib/compare-selection";
import { diffFromFirst, etaList, statoCivileSummary } from "../lib/compare-format";

type T = ReturnType<typeof useT<keyof (typeof compareMessages)["it"]>>;

const ECONOMY = [
  ["fortune", "Fortune", "Fortune"],
  ["credito", "Credito", "Credit"],
  ["credito_m", "Credito ai Monti", "Credit in the Monte"],
  ["imponibile", "Imponibile", "Taxable assets"],
  ["deduzioni", "Deduzioni", "Deductions"],
] as const;

interface Row {
  key: string;
  label: string;
  /** Contenuto della cella per il fuoco i-esimo. */
  cell: (fuoco: Fuoco, index: number) => ReactNode;
}

interface Section {
  title: string;
  rows: Row[];
}

/**
 * Vista di confronto: una colonna per fuoco su desktop (tabella vera, con
 * intestazioni di riga e di colonna), schede scorrevoli su mobile. I dati
 * economici mostrano la differenza dal primo fuoco in parole e segno, non solo
 * con un colore.
 */
export default function CompareView() {
  const t = useT(compareMessages);
  const { lang } = useLanguage();
  const isDesktop = useIsDesktop();
  const { viewOpen, closeView, fuochi, ids, loading, error } = useCompare();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<Fuoco | null>(null);
  const [copied, setCopied] = useState(false);

  useModal(viewOpen, closeView, dialogRef);

  const parentiQueries = useQueries({
    queries: fuochi.map((f) => ({
      queryKey: ["parenti", lang, Number(f.id)],
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchParentiData(Number(f.id), signal),
      enabled: viewOpen,
      staleTime: 10 * 60 * 1000,
    })),
  });
  const parenti = (i: number): Parenti[] | undefined => parentiQueries[i]?.data;

  const share = useCallback(async () => {
    const url = buildCompareUrl(ids);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt(t("copyPrompt"), url);
    }
  }, [ids, t]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 3000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!viewOpen) return null;

  const first = fuochi[0];
  const nd = <span className="italic text-text-accent">{t("nd")}</span>;

  const economyCell = (key: (typeof ECONOMY)[number][0]) => (f: Fuoco, i: number) => {
    const value = f[key] as number | null | undefined;
    if (value === null || value === undefined) return nd;
    const diff = i === 0 ? null : diffFromFirst(value, first?.[key] as number | null);
    const abs = diff === null ? "" : fiorini(Math.abs(diff), lang);
    return (
      <>
        <span className="font-bold tabular-nums">{fiorini(value, lang)}</span>
        {i === 0 ? (
          <span className="block text-[11px] text-text-accent">{t("reference")}</span>
        ) : diff !== null ? (
          <span className={`block text-[11px] tabular-nums ${diff === 0 ? "text-text-accent" : "text-text-main"}`}>
            {diff === 0 ? t("same") : diff > 0 ? `▲ ${t("more", { d: abs })}` : `▼ ${t("less", { d: abs })}`}
          </span>
        ) : null}
      </>
    );
  };

  const sections: Section[] = [
    {
      title: t("place"),
      rows: [
        { key: "mestiere", label: t("occupation"), cell: (f) => f.mestiere || nd },
        { key: "rapporto", label: t("relation"), cell: (f) => f.rapporto_mestiere || nd },
        {
          key: "localita",
          label: t("place"),
          cell: (f) => {
            const parts = [f.serie, f.quartiere, piviereEPopolo(f.piviere, f.popolo)].filter(Boolean);
            return parts.length > 0 ? parts.join(" · ") : nd;
          },
        },
        { key: "casa", label: t("house"), cell: (f) => f.casa || nd },
      ],
    },
    {
      title: t("economy"),
      rows: ECONOMY.map(([key, it, en]) => ({ key, label: lang === "en" ? en : it, cell: economyCell(key) })),
    },
    {
      title: t("family"),
      rows: [
        { key: "membri", label: t("members"), cell: (_f, i) => (parenti(i) ? String(parenti(i)!.length) : "…") },
        {
          key: "eta",
          label: t("ages"),
          cell: (_f, i) => (parenti(i) ? (parenti(i)!.length > 0 ? etaList(parenti(i)!) : t("noRelatives")) : "…"),
        },
        {
          key: "stato",
          label: t("maritalStatus"),
          cell: (_f, i) => (parenti(i) ? (parenti(i)!.length > 0 ? statoCivileSummary(parenti(i)!, t("nd")) : t("noRelatives")) : "…"),
        },
      ],
    },
    {
      title: t("source"),
      rows: [{ key: "carta", label: t("source"), cell: (f) => <SourceCell fuoco={f} t={t} onOpen={setViewer} /> }],
    },
  ];

  const viewerTarget = viewer ? viewerVolume(viewer, "campione") : null;

  return (
    <div className="fixed inset-0 z-[55] flex items-stretch md:items-center justify-center bg-bg-main/95 backdrop-blur-sm md:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-title"
        tabIndex={-1}
        className="bg-bg-sidebar md:border border-border-base md:rounded-ui w-full max-w-6xl max-h-full md:max-h-[92vh] flex flex-col overflow-hidden focus:outline-none"
      >
        <div className="flex items-center justify-between gap-2 p-3 md:p-4 border-b border-border-base">
          <h2 id="compare-title" className="text-base md:text-lg font-serif font-bold text-accent-strong">
            {t("title")}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={share}
              className="inline-flex items-center gap-1.5 min-h-11 px-3 rounded-ui text-xs font-bold small-caps text-accent-strong hover:bg-item-hover"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
              {copied ? t("copied") : t("share")}
            </button>
            <button
              type="button"
              onClick={closeView}
              aria-label={t("close")}
              className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-ui hover:bg-item-hover"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <p role="status" aria-live="polite" className="sr-only">
          {copied ? t("copied") : ""}
        </p>

        <div className="overflow-auto p-3 md:p-4 font-serif text-sm text-text-main">
          {error ? (
            <p role="alert" className="p-4 bg-red-500/10 border border-red-500/40 rounded-ui">{error}</p>
          ) : loading && fuochi.length === 0 ? (
            <div className="py-12 flex justify-center">
              <Spinner label={t("loading")} />
            </div>
          ) : isDesktop ? (
            <table className="w-full border-collapse table-fixed">
              <caption className="sr-only">{t("title")}</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-44 text-left text-xs small-caps text-text-accent p-2">{t("attribute")}</th>
                  {fuochi.map((f) => (
                    <th key={f.id} scope="col" className="text-left p-2 align-bottom text-base font-bold text-primary">{f.nome}</th>
                  ))}
                </tr>
              </thead>
              {sections.map((section) => (
                <tbody key={section.title} className="border-t-2 border-border-base">
                  {section.rows.map((row) => (
                    <tr key={row.key} className="border-b border-border-base/40 align-top">
                      <th scope="row" className="text-left p-2 text-xs small-caps text-text-accent font-semibold">{row.label}</th>
                      {fuochi.map((f, i) => (
                        <td key={f.id} className="p-2">{row.cell(f, i)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          ) : (
            <ul className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
              {fuochi.map((f, i) => (
                <li key={f.id} className="snap-start shrink-0 w-[85%] bg-bg-main border border-border-base rounded-ui p-3">
                  <h3 className="text-base font-bold text-primary mb-2">{f.nome}</h3>
                  {sections.map((section) => (
                    <dl key={section.title} className="border-t border-dashed border-border-base pt-2 mt-2 space-y-1.5">
                      {section.rows.map((row) => (
                        <div key={row.key}>
                          <dt className="text-[11px] small-caps text-text-accent">{row.label}</dt>
                          <dd>{row.cell(f, i)}</dd>
                        </div>
                      ))}
                    </dl>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

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

function SourceCell({ fuoco, t, onOpen }: { fuoco: Fuoco; t: T; onOpen: (f: Fuoco) => void }) {
  const rif = `Vol. ${fuoco.volume || "?"}, c. ${fuoco.foglio || "?"}`;
  if (!fuoco.codice_archivio) {
    return (
      <>
        <span className="font-mono text-xs">{rif}</span>
        <span className="block text-[11px] text-text-accent">{t("notDigitized")}</span>
      </>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onOpen(fuoco)}
      aria-label={t("openCardAria", { nome: fuoco.nome })}
      className="inline-flex items-center gap-1.5 min-h-11 px-2 rounded-ui border border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-xs"
    >
      <span className="font-mono">{rif}</span>
      <span className="font-bold">{t("openCard")}</span>
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}
