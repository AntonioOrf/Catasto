import React, { forwardRef } from "react";
import {
  Briefcase,
  Layers,
  Coins,
  Home,
  Bookmark,
  FileText,
  ChevronDown,
  ChevronRight,
  Info,
  Users,
  PawPrint,
  Flag,
  Hammer,
  ExternalLink,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import type { Fuoco, Parenti, TipoSegnalazione } from "@catasto/shared";
import type { RiferimentoArchivio } from "../lib/archivio";
import { parseSegnaturaPortata } from "../lib/segnatura";
import { eta, fiorini, piviereEPopolo } from "../lib/formato";

export interface CatastoRowProps {
  row: Fuoco;
  expanded: boolean;
  onRowClick: (id: number) => void;
  loadingParenti: boolean;
  parentiData: Parenti[];
  /** Apre il visore sul volume del campione o, se digitalizzato, della portata. */
  onViewArchivio?: (row: Fuoco, riferimento: RiferimentoArchivio) => void;
  onSegnala?: (row: Fuoco, tipo?: TipoSegnalazione) => void;
}

const smallLabel = "text-[11px] md:text-xs text-text-accent uppercase block";
const sectionTitle =
  "text-xs md:text-sm font-bold text-primary uppercase tracking-wider mb-2 md:mb-3 flex items-center gap-2 border-b border-border-base pb-1";
const dashedSection = "pt-2 border-t border-dashed border-border-base";

/**
 * Riga e card si espandono al click: senza questo handler restano
 * irraggiungibili da tastiera. Il controllo sul target evita che Invio su un
 * pulsante interno (visore, segnalazione) espanda anche la riga.
 */
const toggleOnKey = (id: number, onRowClick: (id: number) => void) => (e: React.KeyboardEvent) => {
  if (e.target !== e.currentTarget) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    onRowClick(id);
  }
};

/** Esegue `action` senza propagare il click alla riga, che altrimenti si espanderebbe. */
const stop = (action: () => void) => (e: React.MouseEvent) => {
  e.stopPropagation();
  action();
};

const ExpandIcon = ({ expanded }: { expanded: boolean }) =>
  expanded ? (
    <ChevronDown className="h-5 w-5 text-primary" aria-hidden="true" />
  ) : (
    <ChevronRight className="h-5 w-5 text-text-accent opacity-50" aria-hidden="true" />
  );

/** Etichetta che distingue campione e portata, uguale nei due riquadri. */
const RefLabel = ({ children }: { children: string }) => (
  <span className="font-sans text-[10px] uppercase tracking-wider text-text-accent">{children}</span>
);

/** Righe "Vol." e "c." del riquadro, identiche per campione e portata. */
const VolumeCarta = ({ volume, carta, link = false }: { volume: string; carta: string; link?: boolean }) => (
  <>
    <span className="flex items-center gap-2">
      <Bookmark className="h-3 w-3 text-primary flex-shrink-0" aria-hidden="true" />
      <span className="font-bold">Vol.</span>
      <span className={link ? "text-primary underline underline-offset-2" : ""}>{volume}</span>
    </span>
    <span className="flex items-center gap-2">
      <FileText className="h-3 w-3 text-primary flex-shrink-0" aria-hidden="true" />
      <span className="font-bold">c.</span>
      <span className={link ? "text-primary underline underline-offset-2" : ""}>{carta}</span>
    </span>
  </>
);

const refBase = {
  block: "flex flex-col gap-1 text-sm text-text-main font-mono p-2 rounded w-fit border text-left",
  inline: "inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border",
};
const refStatic = {
  block: "border-border-base bg-bg-sidebar",
  inline: "text-text-accent bg-bg-sidebar border-border-base",
};

/**
 * Riferimento del campione: pulsante verso il visore quando il volume è
 * digitalizzato, testo semplice altrimenti.
 */
const ArchiveReference = ({
  row,
  onViewArchivio,
  variant,
}: {
  row: Fuoco;
  onViewArchivio?: CatastoRowProps["onViewArchivio"];
  variant: "block" | "inline";
}) => {
  const canView = Boolean(row.codice_archivio && onViewArchivio);
  const volume = row.volume || "?";
  const foglio = row.foglio || "?";

  const content =
    variant === "block" ? (
      <>
        <RefLabel>Campione</RefLabel>
        <VolumeCarta volume={volume} carta={foglio} link={canView} />
      </>
    ) : (
      <>
        <RefLabel>Campione</RefLabel>
        <span>
          Vol. {volume} c. {foglio}
        </span>
        {canView && <ExternalLink className="h-3 w-3" aria-hidden="true" />}
      </>
    );

  if (!canView) {
    return <span className={`${refBase[variant]} ${refStatic[variant]}`}>{content}</span>;
  }

  return (
    <button
      type="button"
      onClick={stop(() => onViewArchivio?.(row, "campione"))}
      title="Visualizza il manoscritto originale"
      aria-label={`Campione: visualizza il manoscritto, volume ${volume}, carta ${foglio}`}
      className={`${refBase[variant]} ${
        variant === "block"
          ? "border-primary/50 bg-primary/5 hover:bg-primary/10 shadow-sm"
          : "text-primary bg-primary/10 hover:bg-primary/20 border-primary/20 min-h-8"
      } transition-colors`}
    >
      {content}
    </button>
  );
};

/**
 * La segnatura della portata non esiste nel dump dell'Archivio: compare solo
 * per i fuochi in cui una segnalazione è stata verificata e accettata. Sta
 * accanto al campione, nello stesso formato; il fondo compare solo se non è
 * ASFi, Catasto. Quando manca non si mostra nulla - né etichetta né
 * placeholder - perché un "N/D" suggerirebbe un dato assente per quel fuoco
 * invece che per l'intera fonte. Se il volume della portata è digitalizzato
 * (il backend ne ha trovato il codice d'archivio) apre il visore come il
 * campione.
 */
const PortataReference = ({
  row,
  onViewArchivio,
  variant,
}: {
  row: Fuoco;
  onViewArchivio?: CatastoRowProps["onViewArchivio"];
  variant: "block" | "inline";
}) => {
  if (!row.segnatura_portata) return null;
  const { fondo, volume, carta, testo } = parseSegnaturaPortata(row.segnatura_portata);
  const canView = Boolean(row.codice_archivio_portata && volume && carta && onViewArchivio);

  let content: React.ReactNode;
  if (variant === "inline") {
    const rif = volume && carta ? `Vol. ${volume} c. ${carta}` : testo;
    content = (
      <>
        <RefLabel>Portata</RefLabel>
        <span>{fondo ? `${fondo}, ${rif}` : rif}</span>
        {canView && <ExternalLink className="h-3 w-3" aria-hidden="true" />}
      </>
    );
  } else {
    content = (
      <>
        <RefLabel>Portata</RefLabel>
        {fondo && (
          <span className="flex items-start gap-2">
            <ScrollText className="h-3 w-3 text-primary flex-shrink-0 mt-1" aria-hidden="true" />
            <span>{fondo}</span>
          </span>
        )}
        {volume && carta ? (
          <VolumeCarta volume={volume} carta={carta} link={canView} />
        ) : (
          <span className="flex items-start gap-2">
            <Bookmark className="h-3 w-3 text-primary flex-shrink-0 mt-1" aria-hidden="true" />
            <span>{testo}</span>
          </span>
        )}
      </>
    );
  }

  const blockWidth = variant === "block" ? " max-w-48" : "";
  if (!canView) {
    return (
      <span
        className={`${refBase[variant]} ${refStatic[variant]}${blockWidth}`}
        title={variant === "inline" ? `Portata: ${row.segnatura_portata}` : row.segnatura_portata}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={stop(() => onViewArchivio?.(row, "portata"))}
      title={`Visualizza la portata originale: ${row.segnatura_portata}`}
      aria-label={`Portata: visualizza il manoscritto, volume ${volume}, carta ${carta}`}
      className={`${refBase[variant]}${blockWidth} ${
        variant === "block"
          ? "border-primary/50 bg-primary/5 hover:bg-primary/10 shadow-sm"
          : "text-primary bg-primary/10 hover:bg-primary/20 border-primary/20 min-h-8"
      } transition-colors`}
    >
      {content}
    </button>
  );
};

const Location = ({ row }: { row: Fuoco }) => {
  const dettaglio = piviereEPopolo(row.piviere, row.popolo);
  return (
    <>
      <div className="font-bold text-primary flex items-center gap-1">
        <Layers className="h-3 w-3 flex-shrink-0" aria-hidden="true" /> {row.serie || "Serie N/D"}
      </div>
      <div className="text-text-main ml-2 border-l-2 border-border-base pl-2">{row.quartiere || "Quartiere N/D"}</div>
      {dettaglio && (
        <div className="text-text-accent ml-2 border-l-2 border-border-base pl-2 italic text-[11px] md:text-xs leading-snug">
          {dettaglio}
        </div>
      )}
    </>
  );
};

const DetailItem = ({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) => (
  <div>
    <span className={smallLabel}>{label}</span>
    <span className={strong ? "font-bold text-primary text-sm md:text-lg" : "font-bold text-text-main"}>{value}</span>
  </div>
);

const DetailRow = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: string }) => (
  <div className="flex items-start gap-2">
    <Icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
    <div>
      <span className={smallLabel}>{label}</span>
      <span className="text-text-main">{value || "Nessun dato"}</span>
    </div>
  </div>
);

/** Invito a contribuire, nel dettaglio espanso, solo se la portata non è nota. */
const SegnaturaPortataMancante = ({ row, onSegnala }: Pick<CatastoRowProps, "row" | "onSegnala">) =>
  !row.segnatura_portata && onSegnala ? (
    <button
      type="button"
      onClick={stop(() => onSegnala(row, "segnatura"))}
      className="min-h-11 text-left text-[11px] md:text-xs text-text-accent hover:text-primary underline underline-offset-2 transition-colors"
    >
      Segnatura della portata non nota — contribuisci
    </button>
  ) : null;

const SegnalaButton = ({ row, onSegnala }: Pick<CatastoRowProps, "row" | "onSegnala">) => {
  if (!onSegnala) return null;
  return (
    <button
      type="button"
      onClick={stop(() => onSegnala(row, "dato_errato"))}
      className="flex items-center gap-1 min-h-11 text-[11px] md:text-xs text-text-accent hover:text-primary transition-colors uppercase tracking-wider"
      title="Segnala un errore in questa scheda"
    >
      <Flag className="h-3.5 w-3.5" aria-hidden="true" /> Segnala un errore
    </button>
  );
};

const EconomicDetails = ({ row, onSegnala }: Pick<CatastoRowProps, "row" | "onSegnala">) => (
  <div>
    <h3 className={sectionTitle}>
      <Info className="h-4 w-4" aria-hidden="true" /> Dettagli Economici
    </h3>
    <div className="bg-bg-main p-3 md:p-4 rounded border border-border-base shadow-sm space-y-3 md:space-y-4 text-xs md:text-sm">
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <DetailItem label="Credito" value={fiorini(row.credito)} />
        <DetailItem label="Credito ai Monti" value={fiorini(row.credito_m)} />
        <DetailItem label="Fortune" value={fiorini(row.fortune)} />
        <DetailItem label="Deduzioni" value={fiorini(row.deduzioni)} />
        <DetailItem label="Imponibile Totale" value={fiorini(row.imponibile)} strong />
      </div>
      <div className={`${dashedSection} space-y-2`}>
        <DetailRow icon={PawPrint} label="Bestiame" value={row.bestiame} />
        <DetailRow icon={Flag} label="Immigrazione" value={row.immigrazione} />
        <DetailRow icon={Hammer} label="Rapporto Mestiere" value={row.rapporto_mestiere} />
      </div>
      <div className={dashedSection}>
        <span className={`${smallLabel} mb-1`}>Particolarità Fuoco</span>
        <p className="italic text-text-main bg-bg-sidebar p-2 rounded border border-border-base">
          {row.particolarita_fuoco || "Nessuna particolarità registrata."}
        </p>
      </div>
      <div className={`${dashedSection} flex flex-wrap items-center justify-between gap-2`}>
        <SegnaturaPortataMancante row={row} onSegnala={onSegnala} />
        <SegnalaButton row={row} onSegnala={onSegnala} />
      </div>
    </div>
  </div>
);

const FamilyComposition = ({ loading, parenti }: { loading: boolean; parenti: Parenti[] }) => (
  <div>
    <h3 className={sectionTitle}>
      <Users className="h-4 w-4" aria-hidden="true" /> Composizione Familiare
    </h3>
    {loading ? (
      <div className="text-sm text-text-accent italic" role="status">Caricamento...</div>
    ) : parenti.length > 0 ? (
      <div className="overflow-x-auto border border-border-base rounded-md bg-bg-main">
        <table className="min-w-full divide-y divide-border-base">
          <thead className="bg-primary/10">
            <tr>
              {["Parente", "Età", "Stato"].map((label) => (
                <th key={label} scope="col" className="px-2 py-2 text-left text-[11px] md:text-xs font-medium text-primary uppercase">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-bg-main divide-y divide-border-base">
            {parenti.map((parente, idx) => (
              <tr key={idx} className="text-xs md:text-sm text-text-main">
                <td className="px-2 py-2 font-medium">
                  {parente.parentela_desc || "Membro"}
                  {parente.sesso && <span className="text-[11px] text-text-accent ml-1">({parente.sesso})</span>}
                </td>
                <td className="px-2 py-2">{eta(parente.eta)}</td>
                <td className="px-2 py-2">
                  <div className="flex flex-col">
                    <span>{parente.stato_civile}</span>
                    <span className="text-[11px] italic text-text-accent">{parente.particolarita}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="text-xs md:text-sm text-text-accent italic p-3 border border-dashed border-border-base rounded bg-bg-sidebar">
        Nessun parente registrato.
      </div>
    )}
  </div>
);

/** Contenuto espanso, identico in tabella e card. */
const ExpandedDetails = ({ row, loadingParenti, parentiData, onSegnala }: Omit<CatastoRowProps, "expanded" | "onRowClick" | "onViewArchivio">) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
    <EconomicDetails row={row} onSegnala={onSegnala} />
    <FamilyComposition loading={loadingParenti} parenti={parentiData} />
  </div>
);

const CatastoRow = forwardRef<HTMLTableRowElement, CatastoRowProps>(
  ({ row, expanded, onRowClick, loadingParenti, parentiData, onViewArchivio, onSegnala }, ref) => (
    <>
      <tr
        ref={ref}
        onClick={() => onRowClick(row.id)}
        onKeyDown={toggleOnKey(row.id, onRowClick)}
        tabIndex={0}
        aria-expanded={expanded}
        className={`cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2 border-b border-border-base ${
          expanded ? "bg-primary/10" : "bg-bg-table hover:bg-primary/5"
        }`}
      >
        <td className="px-6 py-4">
          <div className="text-lg font-medium text-text-main font-serif leading-tight">{row.nome}</div>
          <div className="text-xs text-text-accent flex items-center gap-1 mt-1">
            <Briefcase className="h-3 w-3" aria-hidden="true" /> {row.mestiere || "Nessun mestiere"}
          </div>
        </td>

        <td className="px-6 py-4">
          <div className="flex flex-col gap-1 text-sm">
            <Location row={row} />
          </div>
        </td>

        <td className="px-6 py-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-primary font-bold font-serif text-base tabular-nums">
              <Coins className="h-4 w-4" aria-hidden="true" /> {fiorini(row.fortune)}
            </div>
            <div className="flex items-center gap-1 text-xs text-text-main opacity-80">
              <Home className="h-3 w-3" aria-hidden="true" /> {row.casa || "N/D"}
            </div>
          </div>
        </td>

        <td className="px-6 py-4">
          <div className="flex items-start gap-2">
            <ArchiveReference row={row} onViewArchivio={onViewArchivio} variant="block" />
            <PortataReference row={row} onViewArchivio={onViewArchivio} variant="block" />
          </div>
        </td>

        <td className="px-6 py-4 text-right">
          <ExpandIcon expanded={expanded} />
        </td>
      </tr>

      {expanded && (
        <tr className="bg-primary/5">
          <td colSpan={5} className="px-6 py-6 border-b-2 border-text-accent/30">
            <ExpandedDetails row={row} loadingParenti={loadingParenti} parentiData={parentiData} onSegnala={onSegnala} />
          </td>
        </tr>
      )}
    </>
  ),
);

export const CatastoMobileCard = React.memo(
  forwardRef<HTMLDivElement, CatastoRowProps>(
    ({ row, expanded, onRowClick, loadingParenti, parentiData, onViewArchivio, onSegnala }, ref) => (
      <div
        ref={ref}
        onClick={() => onRowClick(row.id)}
        onKeyDown={toggleOnKey(row.id, onRowClick)}
        tabIndex={0}
        aria-expanded={expanded}
        className={`focus-visible:outline-2 focus-visible:outline-primary p-4 rounded-lg border transition-colors cursor-pointer shadow-sm ${
          expanded ? "bg-primary/10 border-primary" : "bg-bg-table border-border-base hover:border-primary/50"
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-base font-serif font-bold text-text-main leading-tight truncate">{row.nome}</h3>
            <p className="text-xs text-text-accent flex items-center gap-1 mt-1 truncate">
              <Briefcase className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              {row.mestiere || "Nessun mestiere"}
            </p>
          </div>
          <div className="flex-shrink-0 mt-0.5">
            <ExpandIcon expanded={expanded} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-dashed border-border-base text-xs">
          <div className="space-y-1">
            <Location row={row} />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-primary font-bold font-serif text-sm tabular-nums">
              <Coins className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" /> {fiorini(row.fortune)}
            </div>
            <div className="flex items-center gap-1 text-text-main opacity-80 pl-1">
              <Home className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" /> {row.casa || "N/D"}
            </div>
            <div className="mt-1.5 pl-1 flex flex-wrap gap-1">
              <ArchiveReference row={row} onViewArchivio={onViewArchivio} variant="inline" />
              <PortataReference row={row} onViewArchivio={onViewArchivio} variant="inline" />
            </div>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t-2 border-text-accent/30 cursor-auto" onClick={(e) => e.stopPropagation()}>
            <ExpandedDetails row={row} loadingParenti={loadingParenti} parentiData={parentiData} onSegnala={onSegnala} />
          </div>
        )}
      </div>
    ),
  ),
);

export default React.memo(CatastoRow);
