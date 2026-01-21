import React, { forwardRef } from 'react';
import { Briefcase, Layers, Coins, Home, Bookmark, FileText, ChevronDown, ChevronRight, Info, Users, PawPrint, Flag, Hammer } from 'lucide-react';

const CatastoRow = forwardRef(({ row, expanded, onRowClick, loadingParenti, parentiData }, ref) => {

  const rowClasses = expanded
    ? 'bg-item-selected/10 border-l-4 border-l-item-selected'
    : 'hover:bg-item-hover/50 border-l-4 border-l-transparent';

  return (
    <>
      <tr
        ref={ref}
        onClick={() => onRowClick(row.id)}
        // 👇 MODIFICA QUI: Ho aggiunto 'bg-bg-main'.
        // Questo forza la riga ad avere il colore del tema (scuro in dark, chiaro in light)
        className={`cursor-pointer transition-colors border-b border-border-base bg-bg-main ${rowClasses}`}
      >
        {/* NOME E MESTIERE */}
        <td className="px-3 py-3 md:px-6 md:py-4">
          <div className="flex flex-col justify-center">
            <div className="text-base md:text-lg font-medium text-text-main font-serif leading-tight">
              {row.nome}
            </div>
            <div className="text-xs text-text-accent flex items-center gap-1 font-sans mt-1">
              <Briefcase className="h-3 w-3" /> {row.mestiere || "Nessun mestiere"}
            </div>
          </div>
        </td>

        {/* LOCALIZZAZIONE */}
        <td className="px-3 py-3 md:px-6 md:py-4">
          <div className="flex flex-col gap-1 text-xs md:text-sm">
            <div className="font-bold text-item-selected flex items-center gap-1">
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
            <div className="flex items-center gap-1 text-item-selected font-bold font-serif text-sm md:text-base">
              <Coins className="h-3 w-3 md:h-4 md:w-4" />
              {row.fortune ? row.fortune.toLocaleString() : 0}
              <span className="hidden md:inline"> fiorini</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] md:text-xs text-text-main font-sans opacity-80">
              <Home className="h-3 w-3" /> {row.casa || "N/D"}
            </div>
            {/* Mobile Volume Info */}
            <div className="md:hidden flex items-center gap-2 text-[10px] text-text-main font-mono bg-bg-sidebar px-1 rounded w-fit border border-border-base mt-1">
              <span>Vol. {row.volume}</span><span>c. {row.foglio}</span>
            </div>
          </div>
        </td>

        {/* RIFERIMENTI (Desktop only) */}
        <td className="hidden md:table-cell px-6 py-4">
          <div className="flex flex-col gap-1 text-sm text-text-main font-mono bg-bg-sidebar p-2 rounded w-fit border border-border-base">
            <div className="flex items-center gap-2">
              <Bookmark className="h-3 w-3 text-item-selected" />
              <span className="font-bold">Vol.</span> {row.volume || '?'}
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3 text-item-selected" />
              <span className="font-bold">c.</span> {row.foglio || '?'}
            </div>
          </div>
        </td>

        {/* FRECCIA ESPANSIONE */}
        <td className="px-2 py-3 md:px-6 md:py-4 text-right">
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-item-selected" />
          ) : (
            <ChevronRight className="h-5 w-5 text-text-accent opacity-50" />
          )}
        </td>
      </tr>

      {/* --- DETTAGLI ESPANSI --- */}
      {expanded && (
        <tr className="bg-bg-sidebar/50">
          <td colSpan="5" className="px-4 py-4 md:px-6 md:py-6 border-b-2 border-text-accent/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

              {/* COLONNA 1: DETTAGLI ECONOMICI */}
              <div>
                <h3 className="text-xs md:text-sm font-bold text-item-selected uppercase tracking-wider mb-2 md:mb-3 flex items-center gap-2 border-b border-border-base pb-1">
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
                      <span className="font-bold text-item-selected text-base md:text-lg">{row.imponibile || 0} fiorini</span>
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
                </div>
              </div>

              {/* COLONNA 2: FAMIGLIA */}
              <div>
                <h3 className="text-xs md:text-sm font-bold text-item-selected uppercase tracking-wider mb-2 md:mb-3 flex items-center gap-2 border-b border-border-base pb-1">
                  <Users className="h-4 w-4" /> Composizione Familiare
                </h3>

                {loadingParenti ? (
                  <div className="text-sm text-text-accent italic">Caricamento...</div>
                ) : parentiData.length > 0 ? (
                  <div className="overflow-hidden border border-border-base rounded-md bg-bg-main">
                    <table className="min-w-full divide-y divide-border-base">
                      <thead className="bg-bg-sidebar">
                        <tr>
                          <th className="px-2 py-2 text-left text-[10px] md:text-xs font-medium text-item-selected uppercase">Parente</th>
                          <th className="px-2 py-2 text-left text-[10px] md:text-xs font-medium text-item-selected uppercase">Età</th>
                          <th className="px-2 py-2 text-left text-[10px] md:text-xs font-medium text-item-selected uppercase">Stato</th>
                        </tr>
                      </thead>
                      <tbody className="bg-bg-main divide-y divide-border-base">
                        {parentiData.map((parente, idx) => (
                          <tr key={idx} className="text-xs md:text-sm text-text-main">
                            <td className="px-2 py-2 font-medium">
                              {parente.parentela_desc || "Membro"}
                              {parente.sesso && <span className="text-[10px] text-text-accent ml-1">({parente.sesso})</span>}
                            </td>
                            <td className="px-2 py-2">{parente.eta ? parente.eta : '-'}</td>
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
});

// Helper Components
const DetailItem = ({ label, value }) => (
  <div>
    <span className="text-[10px] md:text-xs text-text-accent uppercase block">{label}</span>
    <span className="font-bold text-text-main">{value}</span>
  </div>
);

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2">
    <Icon className="h-4 w-4 text-item-selected mt-0.5 flex-shrink-0" />
    <div>
      <span className="text-[10px] md:text-xs text-text-accent uppercase block">{label}</span>
      <span className="text-text-main">{value || "Nessun dato"}</span>
    </div>
  </div>
);

export default React.memo(CatastoRow);