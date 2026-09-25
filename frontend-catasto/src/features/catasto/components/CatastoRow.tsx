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
  Flag as FlagIcon,
  ScrollText
} from "lucide-react";
import type { TipoSegnalazione } from "@catasto/shared";

interface CatastoRowProps {
  row: any;
  expanded: boolean;
  onRowClick: (id: number) => void;
  loadingParenti: boolean;
  parentiData: any[];
  onViewArchivio?: (row: any) => void;
  onSegnala?: (row: any, tipo?: TipoSegnalazione) => void;
}

/**
 * La segnatura della portata non esiste nel dump dell'Archivio: compare solo
 * per i fuochi in cui una segnalazione è stata verificata e accettata. Quando
 * manca non si mostra nulla - né etichetta né placeholder - perché un "N/D"
 * suggerirebbe un dato assente per quel fuoco invece che per l'intera fonte.
 */
const SegnaturaPortata = ({ row, onSegnala }: { row: any; onSegnala?: CatastoRowProps["onSegnala"] }) => {
  if (!row.segnatura_portata) {
    return onSegnala ? (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSegnala(row, "segnatura");
        }}
        className="text-[10px] md:text-xs text-text-accent hover:text-primary underline underline-offset-2 transition-colors"
      >
        Segnatura della portata non nota — contribuisci
      </button>
    ) : null;
  }

  return (
    <div className="flex items-start gap-2">
      <ScrollText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <span className="text-[10px] md:text-xs text-text-accent uppercase block">
          Segnatura della portata
        </span>
        <span className="text-text-main font-mono text-xs md:text-sm">{row.segnatura_portata}</span>
      </div>
    </div>
  );
};

const SegnalaButton = ({ row, onSegnala }: { row: any; onSegnala?: CatastoRowProps["onSegnala"] }) => {
  if (!onSegnala) return null;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSegnala(row, "dato_errato");
      }}
      className="flex items-center gap-1 text-[10px] md:text-xs text-text-accent hover:text-primary transition-colors uppercase tracking-wider"
      title="Segnala un errore in questa scheda"
    >
      <FlagIcon className="h-3.5 w-3.5" /> Segnala un errore
    </button>
  );
};

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

const CatastoRow = forwardRef<HTMLTableRowElement, CatastoRowProps>(
  ({ row, expanded, onRowClick, loadingParenti, parentiData, onViewArchivio, onSegnala }, ref) => {

    const rowClasses = expanded
      ? "bg-primary/10 border-l-4 border-l-primary"
      : "hover:bg-primary/5 border-l-4 border-l-transparent";

    return (
      <>
        <tr
          ref={ref}
          onClick={() => onRowClick(row.id)}
          onKeyDown={toggleOnKey(row.id, onRowClick)}
          tabIndex={0}
          aria-expanded={expanded}
          className={`cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2 border-b border-border-base bg-bg-table ${rowClasses}`}
        >
          {/* NOME E MESTIERE */}
          <td className="px-3 py-3 md:px-6 md:py-4">
            <div className="flex flex-col justify-center">
              <div className="text-base md:text-lg font-medium text-text-main font-serif leading-tight">
                {row.nome}
              </div>
              <div className="text-xs text-text-accent flex items-center gap-1 font-sans mt-1">
                <Briefcase className="h-3 w-3" />{" "}
                {row.mestiere || "Nessun mestiere"}
              </div>
            </div>
          </td>

          {/* LOCALIZZAZIONE */}
          <td className="px-3 py-3 md:px-6 md:py-4">
            <div className="flex flex-col gap-1 text-xs md:text-sm">
              <div className="font-bold text-primary flex items-center gap-1">
                <Layers className="h-3 w-3" /> {row.serie || "Serie N/D"}
              </div>
              <div className="text-text-main ml-2 border-l-2 border-border-base pl-2">
                {row.quartiere}
              </div>
              <div className="text-text-accent ml-2 border-l-2 border-border-base pl-2 italic text-[10px] md:text-xs">
                {row.piviere} &raquo; {row.popolo}
              </div>
            </div>
          </td>

          {/* DATI ECONOMICI SINTETICI */}
          <td className="px-3 py-3 md:px-6 md:py-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-primary font-bold font-serif text-sm md:text-base">
                <Coins className="h-3 w-3 md:h-4 md:w-4" />
                {row.fortune ? row.fortune.toLocaleString() : 0}
                <span className="hidden lg:inline"> fiorini</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] lg:text-xs text-text-main font-sans opacity-80">
                <Home className="h-3 w-3" /> {row.casa || "N/D"}
              </div>
              <div className="lg:hidden flex items-center gap-2 text-[10px] text-text-main font-mono bg-bg-sidebar px-1 rounded w-fit border border-border-base mt-1">
                {row.codice_archivio ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(onViewArchivio) onViewArchivio(row); }}
                    className="flex items-center gap-1 text-primary hover:underline hover:brightness-110 active:scale-95 transition-all"
                    title="Visualizza Manoscritto"
                  >
                    <span>Vol. {row.volume}</span>
                    <span>c. {row.foglio}</span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </button>
                ) : (
                  <>
                    <span>Vol. {row.volume}</span>
                    <span>c. {row.foglio}</span>
                  </>
                )}
              </div>
            </div>
          </td>

          {/* RIFERIMENTI (Desktop only) */}
          <td className="hidden lg:table-cell px-6 py-4">
            <div className={`flex flex-col gap-1 text-sm text-text-main font-mono p-2 rounded w-fit border ${row.codice_archivio ? 'border-primary/50 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors shadow-sm' : 'border-border-base bg-bg-sidebar'}`}
                 onClick={(e) => { 
                   if (row.codice_archivio && onViewArchivio) {
                     e.stopPropagation(); onViewArchivio(row); 
                   }
                 }}
                 title={row.codice_archivio ? "Visualizza Manoscritto Originale" : undefined}
            >
              <div className="flex items-center gap-2">
                <Bookmark className="h-3 w-3 text-primary" />
                <span className="font-bold">Vol.</span> 
                <span className={row.codice_archivio ? 'text-primary underline underline-offset-2' : ''}>{row.volume || "?"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3 text-primary" />
                <span className="font-bold">c.</span> 
                <span className={row.codice_archivio ? 'text-primary underline underline-offset-2' : ''}>{row.foglio || "?"}</span>
              </div>
            </div>
          </td>

          <td className="px-2 py-3 md:px-6 md:py-4 text-right">
            {expanded ? (
              <ChevronDown className="h-5 w-5 text-primary" />
            ) : (
              <ChevronRight className="h-5 w-5 text-text-accent opacity-50" />
            )}
          </td>
        </tr>

        {expanded && (
          <tr className="bg-primary/5 border-l-4 border-l-primary">
            <td colSpan={5} className="px-4 py-4 md:px-6 md:py-6 border-b-2 border-text-accent/30">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div>
                  <h3 className="text-xs md:text-sm font-bold text-primary uppercase tracking-wider mb-2 md:mb-3 flex items-center gap-2 border-b border-border-base pb-1">
                    <Info className="h-4 w-4" /> Dettagli Economici
                  </h3>
                  <div className="bg-bg-main p-3 md:p-4 rounded border border-border-base shadow-sm space-y-3 md:space-y-4 text-xs md:text-sm">
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <DetailItem label="Credito" value={`${row.credito || 0} fiorini`} />
                      <DetailItem label="Credito ai Monti" value={`${row.credito_m || 0} fiorini`} />
                      <DetailItem label="Fortune" value={`${row.fortune || 0} fiorini`} />
                      <DetailItem label="Deduzioni" value={`${row.deduzioni || 0} fiorini`} />
                      <div>
                        <span className="text-[10px] md:text-xs text-text-accent uppercase block">Imponibile Totale</span>
                        <span className="font-bold text-primary text-base md:text-lg">{row.imponibile || 0} fiorini</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-dashed border-border-base space-y-2">
                      <DetailRow icon={PawPrint} label="Bestiame" value={row.bestiame} />
                      <DetailRow icon={Flag} label="Immigrazione" value={row.immigrazione} />
                      <DetailRow icon={Hammer} label="Rapporto Mestiere" value={row.rapporto_mestiere} />
                    </div>
                    <div className="pt-2 border-t border-dashed border-border-base">
                      <span className="text-[10px] md:text-xs text-text-accent uppercase block mb-1">Particolarità Fuoco</span>
                      <p className="italic text-text-main bg-bg-sidebar p-2 rounded border border-border-base">
                        {row.particolarita_fuoco || "Nessuna particolarità registrata."}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-dashed border-border-base flex flex-wrap items-center justify-between gap-2">
                      <SegnaturaPortata row={row} onSegnala={onSegnala} />
                      <SegnalaButton row={row} onSegnala={onSegnala} />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-bold text-primary uppercase tracking-wider mb-2 md:mb-3 flex items-center gap-2 border-b border-border-base pb-1">
                    <Users className="h-4 w-4" /> Composizione Familiare
                  </h3>
                  {loadingParenti ? (
                    <div className="text-sm text-text-accent italic">Caricamento...</div>
                  ) : parentiData.length > 0 ? (
                    <div className="overflow-hidden border border-border-base rounded-md bg-bg-main">
                      <table className="min-w-full divide-y divide-border-base">
                        <thead className="bg-primary/10">
                          <tr>
                            <th className="px-2 py-2 text-left text-[10px] md:text-xs font-medium text-primary uppercase">Parente</th>
                            <th className="px-2 py-2 text-left text-[10px] md:text-xs font-medium text-primary uppercase">Età</th>
                            <th className="px-2 py-2 text-left text-[10px] md:text-xs font-medium text-primary uppercase">Stato</th>
                          </tr>
                        </thead>
                        <tbody className="bg-bg-main divide-y divide-border-base">
                          {parentiData.map((parente: any, idx: number) => (
                            <tr key={idx} className="text-xs md:text-sm text-text-main">
                              <td className="px-2 py-2 font-medium">
                                {parente.parentela_desc || "Membro"}
                                {parente.sesso && <span className="text-[10px] text-text-accent ml-1">({parente.sesso})</span>}
                              </td>
                              <td className="px-2 py-2">{parente.eta ? parente.eta : "-"}</td>
                              <td className="px-2 py-2">
                                <div className="flex flex-col">
                                  <span>{parente.stato_civile}</span>
                                  <span className="text-[10px] italic text-text-accent">{parente.particolarita}</span>
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
              </div>
            </td>
          </tr>
        )}
      </>
    );
  }
);

const DetailItem = ({ label, value }: any) => (
  <div>
    <span className="text-[10px] md:text-xs text-text-accent uppercase block">{label}</span>
    <span className="font-bold text-text-main">{value}</span>
  </div>
);

const DetailRow = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-start gap-2">
    <Icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
    <div>
      <span className="text-[10px] md:text-xs text-text-accent uppercase block">{label}</span>
      <span className="text-text-main">{value || "Nessun dato"}</span>
    </div>
  </div>
);

export const CatastoMobileCard = React.memo(
  forwardRef<HTMLDivElement, CatastoRowProps>(
    ({ row, expanded, onRowClick, loadingParenti, parentiData, onViewArchivio, onSegnala }, ref) => {
      const cardClasses = expanded
        ? "bg-primary/10 border-primary"
        : "bg-bg-table border-border-base hover:border-primary/50";

      return (
        <div
          ref={ref}
          onClick={() => onRowClick(row.id)}
          onKeyDown={toggleOnKey(row.id, onRowClick)}
          tabIndex={0}
          className={`focus-visible:outline-2 focus-visible:outline-primary p-4 rounded-lg border transition-all cursor-pointer shadow-sm ${cardClasses}`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-base font-serif font-bold text-text-main leading-tight truncate">
                {row.nome}
              </h3>
              <p className="text-xs text-text-accent flex items-center gap-1 mt-1 truncate">
                <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                {row.mestiere || "Nessun mestiere"}
              </p>
            </div>
            <div className="flex-shrink-0 mt-0.5">
              {expanded ? (
                <ChevronDown className="h-5 w-5 text-primary" />
              ) : (
                <ChevronRight className="h-5 w-5 text-text-accent opacity-50" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-dashed border-border-base text-xs">
            {/* Localizzazione */}
            <div className="space-y-1">
              <div className="font-bold text-primary flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 flex-shrink-0" /> {row.serie || "Serie N/D"}
              </div>
              <div className="text-text-main font-medium pl-1">
                {row.quartiere || "Quartiere N/D"}
              </div>
              <div className="text-text-accent italic text-[11px] pl-1 leading-snug">
                {row.piviere} &raquo; {row.popolo}
              </div>
            </div>

            {/* Dati Economici & Riferimenti */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-primary font-bold font-serif text-sm">
                <Coins className="h-3.5 w-3.5 flex-shrink-0" />
                {row.fortune ? row.fortune.toLocaleString() : 0} fiorini
              </div>
              <div className="flex items-center gap-1 text-text-main opacity-80 pl-1">
                <Home className="h-3.5 w-3.5 flex-shrink-0" /> {row.casa || "N/D"}
              </div>
              
              {/* Riferimento Archivio */}
              <div className="mt-1.5 pl-1">
                {row.codice_archivio ? (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if(onViewArchivio) onViewArchivio(row); 
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded border border-primary/20 active:scale-95 transition-all"
                  >
                    <span>Vol. {row.volume} c. {row.foglio}</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-text-accent bg-bg-sidebar px-2 py-0.5 rounded border border-border-base">
                    Vol. {row.volume || "?"} c. {row.foglio || "?"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Expanded Content */}
          {expanded && (
            <div className="mt-4 pt-4 border-t-2 border-text-accent/30 space-y-4" onClick={(e) => e.stopPropagation()}>
              {/* Dettagli Economici */}
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2 border-b border-border-base pb-1">
                  <Info className="h-3.5 w-3.5" /> Dettagli Economici
                </h4>
                <div className="bg-bg-main p-3 rounded border border-border-base space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <DetailItem label="Credito" value={`${row.credito || 0} fiorini`} />
                    <DetailItem label="Credito ai Monti" value={`${row.credito_m || 0} fiorini`} />
                    <DetailItem label="Fortune" value={`${row.fortune || 0} fiorini`} />
                    <DetailItem label="Deduzioni" value={`${row.deduzioni || 0} fiorini`} />
                    <div className="col-span-2">
                      <span className="text-[10px] text-text-accent uppercase block">Imponibile Totale</span>
                      <span className="font-bold text-primary text-sm">{row.imponibile || 0} fiorini</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-dashed border-border-base space-y-2">
                    <DetailRow icon={PawPrint} label="Bestiame" value={row.bestiame} />
                    <DetailRow icon={Flag} label="Immigrazione" value={row.immigrazione} />
                    <DetailRow icon={Hammer} label="Rapporto Mestiere" value={row.rapporto_mestiere} />
                  </div>
                  <div className="pt-2 border-t border-dashed border-border-base">
                    <span className="text-[10px] text-text-accent uppercase block mb-1">Particolarità Fuoco</span>
                    <p className="italic text-text-main bg-bg-sidebar p-2 rounded border border-border-base">
                      {row.particolarita_fuoco || "Nessuna particolarità registrata."}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-dashed border-border-base space-y-2">
                    <SegnaturaPortata row={row} onSegnala={onSegnala} />
                    <SegnalaButton row={row} onSegnala={onSegnala} />
                  </div>
                </div>
              </div>

              {/* Composizione Familiare */}
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2 border-b border-border-base pb-1">
                  <Users className="h-3.5 w-3.5" /> Composizione Familiare
                </h4>
                {loadingParenti ? (
                  <div className="text-xs text-text-accent italic">Caricamento...</div>
                ) : parentiData.length > 0 ? (
                  <div className="overflow-hidden border border-border-base rounded bg-bg-main">
                    <table className="min-w-full divide-y divide-border-base">
                      <thead className="bg-primary/10">
                        <tr>
                          <th className="px-2 py-1.5 text-left text-[10px] font-medium text-primary uppercase">Parente</th>
                          <th className="px-2 py-1.5 text-left text-[10px] font-medium text-primary uppercase">Età</th>
                          <th className="px-2 py-1.5 text-left text-[10px] font-medium text-primary uppercase">Stato</th>
                        </tr>
                      </thead>
                      <tbody className="bg-bg-main divide-y divide-border-base text-xs">
                        {parentiData.map((parente: any, idx: number) => (
                          <tr key={idx} className="text-text-main">
                            <td className="px-2 py-1.5 font-medium">
                              {parente.parentela_desc || "Membro"}
                              {parente.sesso && <span className="text-[10px] text-text-accent ml-1">({parente.sesso})</span>}
                            </td>
                            <td className="px-2 py-1.5">{parente.eta ? parente.eta : "-"}</td>
                            <td className="px-2 py-1.5">
                              <div className="flex flex-col">
                                <span>{parente.stato_civile}</span>
                                <span className="text-[10px] italic text-text-accent">{parente.particolarita}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-xs text-text-accent italic p-3 border border-dashed border-border-base rounded bg-bg-sidebar">
                    Nessun parente registrato.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }
  )
);

export default React.memo(CatastoRow);
