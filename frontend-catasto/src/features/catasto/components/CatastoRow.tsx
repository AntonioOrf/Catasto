import React, { forwardRef } from "react";
import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { COMPARE_MAX_FUOCHI, type Fuoco, type Parenti, type TipoSegnalazione } from "@catasto/shared";
import type { RiferimentoArchivio } from "../lib/archivio";
import { parseSegnaturaPortata } from "../lib/segnatura";
import { cifra, eta, nonIndicato, piviereEPopolo } from "../lib/formato";
import { useLanguage, useT } from "../../../i18n";
import { catastoRowMessages } from "./CatastoRow.messages";
import { useOptionalCompare } from "../../compare/compare-context";
import GlossaryTerm from "../../glossary/GlossaryTerm";
import { compareMessages } from "../../compare/compare.messages";

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

/**
 * Riga e scheda del fuoco secondo la revisione grafica (#44, #45): niente
 * icone sui dati, etichette in maiuscoletto vero, numeri in cifre tabellari,
 * riferimenti come link nel carattere del sito. L'unica icona dei dati è il
 * libro, che dice che il link apre la carta.
 */

const smallCapsLabel = "small-caps text-text-accent";
const missing = "italic text-text-accent";

/** Esegue `action` senza propagare il click alla riga, che altrimenti si espanderebbe. */
const stop = (action: () => void) => (e: React.MouseEvent) => {
  e.stopPropagation();
  action();
};

/** Id del dettaglio espanso, per aria-controls. */
const detailsId = (id: number) => `fuoco-dettagli-${id}`;

/**
 * Unico controllo da tastiera per aprire e chiudere la scheda: prima era la
 * riga stessa (tabIndex=0), che conteneva altri pulsanti, cioè interattivi
 * annidati. Il clic sul resto della riga resta come scorciatoia col mouse.
 */
const ExpandButton = ({ row, expanded, onRowClick }: Pick<CatastoRowProps, "row" | "expanded" | "onRowClick">) => {
  const t = useT(catastoRowMessages);
  const label = t(expanded ? "collapseDetails" : "expandDetails", { nome: row.nome });
  return (
    <button
      type="button"
      onClick={stop(() => onRowClick(row.id))}
      aria-expanded={expanded}
      aria-controls={expanded ? detailsId(row.id) : undefined}
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-ui text-text-accent hover:text-primary hover:bg-primary/10 transition-colors"
    >
      {expanded ? <ChevronDown className="h-5 w-5 text-primary" aria-hidden="true" /> : <ChevronRight className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
};

/**
 * Casella del confronto: piccola e senza testo nella tabella, perché la
 * scelta è un'azione secondaria; il nome accessibile dice cosa fa. Fuori
 * dalla home (nessun provider) non c'è.
 */
export const CompareCheckbox = ({ row, withLabel = false }: { row: Fuoco; withLabel?: boolean }) => {
  const compare = useOptionalCompare();
  const t = useT(compareMessages);
  if (!compare) return null;
  const checked = compare.isSelected(row.id);
  const disabled = !checked && compare.full;
  return (
    <label
      onClick={(e) => e.stopPropagation()}
      title={disabled ? t("full", { max: COMPARE_MAX_FUOCHI }) : undefined}
      className={`inline-flex items-center justify-center gap-1.5 min-h-8 min-w-8 text-sm ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${checked ? "text-primary" : "text-text-accent"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={() => compare.toggle(row)}
        aria-label={t("checkboxAria", { nome: row.nome })}
        className="h-[15px] w-[15px] m-0"
      />
      {withLabel && <span aria-hidden="true">{t("checkbox")}</span>}
    </label>
  );
};

/** Link alla carta: testo nel carattere del sito con l'icona del libro; testo semplice se il volume non è digitalizzato. */
const CartaLink = ({
  text,
  ariaLabel,
  title,
  onOpen,
}: {
  text: string;
  ariaLabel: string;
  title?: string;
  onOpen?: () => void;
}) => {
  if (!onOpen) return <span title={title}>{text}</span>;
  return (
    <button
      type="button"
      onClick={stop(onOpen)}
      aria-label={ariaLabel}
      title={title}
      className="inline-flex items-center gap-1.5 min-h-8 text-left text-primary underline underline-offset-[3px] decoration-primary/50 hover:decoration-primary"
    >
      <BookOpen className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </button>
  );
};

/** «campione» in maiuscoletto e «Vol. 72, c. 33» come link; la portata, quando è nota, uguale. */
const References = ({ row, onViewArchivio }: Pick<CatastoRowProps, "row" | "onViewArchivio">) => {
  const t = useT(catastoRowMessages);
  const volume = row.volume || "?";
  const foglio = row.foglio || "?";
  const canViewCampione = Boolean(row.codice_archivio && onViewArchivio);

  const portata = row.segnatura_portata ? parseSegnaturaPortata(row.segnatura_portata) : null;
  const canViewPortata = Boolean(portata && row.codice_archivio_portata && portata.volume && portata.carta && onViewArchivio);
  const portataText = portata
    ? [portata.fondo, portata.volume && portata.carta ? `${t("vol")} ${portata.volume}, ${t("carta")} ${portata.carta}` : portata.testo]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <div className="flex flex-col gap-1 text-sm">
      <div>
        <span className={`block ${smallCapsLabel}`}>{t("campione")}</span>
        <CartaLink
          text={`${t("vol")} ${volume}, ${t("carta")} ${foglio}`}
          ariaLabel={t("campioneAria", { volume, carta: foglio })}
          title={canViewCampione ? t("viewManuscript") : t("notDigitized")}
          onOpen={canViewCampione ? () => onViewArchivio?.(row, "campione") : undefined}
        />
      </div>
      {portata && (
        <div>
          <span className={`block ${smallCapsLabel}`}>{t("portata")}</span>
          <CartaLink
            text={portataText}
            ariaLabel={t("portataAria", { volume: portata.volume ?? "", carta: portata.carta ?? "" })}
            title={canViewPortata ? t("viewPortata", { segnatura: row.segnatura_portata ?? "" }) : t("portataTitle", { segnatura: row.segnatura_portata ?? "" })}
            onOpen={canViewPortata ? () => onViewArchivio?.(row, "portata") : undefined}
          />
        </div>
      )}
    </div>
  );
};

/** La serie in maiuscoletto, poi quartiere e «piviere » popolo» sotto un filetto verticale. */
const Location = ({ row }: { row: Fuoco }) => {
  const t = useT(catastoRowMessages);
  const dettaglio = piviereEPopolo(row.piviere, row.popolo);
  return (
    <div className="text-sm">
      <div className={`small-caps text-base ${row.serie ? "text-accent-strong" : "text-text-accent"}`}>{row.serie || t("serieNd")}</div>
      <div className="border-l-2 border-border-base/40 pl-2 mt-0.5">
        <div className={row.quartiere ? "text-text-main" : missing}>{row.quartiere || t("quartiereNd")}</div>
        {dettaglio && <div className="text-text-accent italic leading-snug">{dettaglio}</div>}
      </div>
    </div>
  );
};

/** La cifra in grassetto con «fiorini» in maiuscoletto; il dato assente resta assente. */
const Fiorini = ({ value }: { value: number | null | undefined }) => {
  const t = useT(catastoRowMessages);
  const { lang } = useLanguage();
  const n = cifra(value, lang);
  if (n === null) return <span className={missing}>{nonIndicato(lang)}</span>;
  return (
    <span>
      <span className="font-bold tabular-nums">{n}</span> <span className={smallCapsLabel}>{t("fiorini")}</span>
    </span>
  );
};

const Summary = ({ row }: { row: Fuoco }) => {
  const t = useT(catastoRowMessages);
  return (
    <div className="text-base">
      <Fiorini value={row.fortune} />
      <div className="text-sm italic text-text-accent">{row.casa || t("nd")}</div>
    </div>
  );
};

/* ---------- Scheda del fuoco (#45) ---------- */

const sectionTitle = "text-base md:text-lg font-semibold text-accent-strong border-b border-border-base pb-1 mb-3";

/** Una riga del conto: etichetta, glossario e cifra allineata a destra. */
const ContoRow = ({ label, term, value, minus = false }: { label: string; term: string; value: number | null | undefined; minus?: boolean }) => {
  const { lang } = useLanguage();
  const n = cifra(value, lang);
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <dt className="flex items-center gap-1">
        {label} <GlossaryTerm id={term} />
      </dt>
      <dd className="m-0 tabular-nums text-right">
        {n === null ? <span className={missing}>{nonIndicato(lang)}</span> : minus && Number(value) !== 0 ? `− ${n}` : n}
      </dd>
    </div>
  );
};

/** Voce in maiuscoletto con il valore sotto; «nessun dato» in corsivo attenuato. */
const Voce = ({ label, value }: { label: string; value?: string | null }) => {
  const t = useT(catastoRowMessages);
  return (
    <div>
      <dt className={`${smallCapsLabel} text-sm`}>{label}</dt>
      <dd className={`m-0 ${value ? "text-text-main" : missing}`}>{value || t("noData")}</dd>
    </div>
  );
};

const EconomicDetails = ({ row }: { row: Fuoco }) => {
  const t = useT(catastoRowMessages);
  const { lang } = useLanguage();
  const imponibile = cifra(row.imponibile, lang);
  return (
    <section aria-labelledby={`${detailsId(row.id)}-eco`}>
      <h3 id={`${detailsId(row.id)}-eco`} className={sectionTitle}>
        {t("economicDetails")}
      </h3>
      {/* La stima si legge come un conto: le voci, le deduzioni col meno, il totale sotto un filetto. */}
      <dl className="m-0 text-sm md:text-base">
        <ContoRow label={t("fortune")} term="fortune" value={row.fortune} />
        <ContoRow label={t("credito")} term="credito" value={row.credito} />
        <ContoRow label={t("creditoM")} term="credito_m" value={row.credito_m} />
        <ContoRow label={t("deduzioni")} term="deduzioni" value={row.deduzioni} minus />
        <div className="flex items-baseline justify-between gap-4 pt-2 mt-1 border-t border-border-base font-bold text-accent-strong">
          <dt className="flex items-center gap-1">
            {t("imponibile")} <GlossaryTerm id="imponibile" />
          </dt>
          <dd className="m-0 tabular-nums text-right">{imponibile ?? <span className={`${missing} font-normal`}>{nonIndicato(lang)}</span>}</dd>
        </div>
      </dl>

      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm md:text-base">
        <Voce label={t("bestiame")} value={row.bestiame} />
        <Voce label={t("immigrazione")} value={row.immigrazione} />
        <Voce label={t("rapporto")} value={row.rapporto_mestiere} />
      </dl>

      <div className="mt-4 pt-3 border-t border-dotted border-border-base text-sm md:text-base">
        <h4 className={`${smallCapsLabel} text-sm font-normal`}>{t("particolarita")}</h4>
        <p className={`m-0 ${row.particolarita_fuoco ? "text-text-main" : missing}`}>
          {row.particolarita_fuoco || t("noParticolarita")}
        </p>
      </div>
    </section>
  );
};

const FamilyComposition = ({ row, loading, parenti }: { row: Fuoco; loading: boolean; parenti: Parenti[] }) => {
  const t = useT(catastoRowMessages);
  const title = loading
    ? t("family")
    : parenti.length === 1
      ? t("familyCountOne")
      : t("familyCount", { n: parenti.length });
  return (
    <section aria-labelledby={`${detailsId(row.id)}-fam`}>
      <h3 id={`${detailsId(row.id)}-fam`} className={sectionTitle}>
        {title}
      </h3>
      {loading ? (
        <p className="text-sm text-text-accent italic" role="status">{t("loading")}</p>
      ) : parenti.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm md:text-base">
            <thead>
              <tr className="border-b border-border-base">
                {[t("colRelative"), t("colAge"), t("colStatus")].map((label, i) => (
                  <th key={label} scope="col" className={`py-1.5 pr-3 font-semibold text-accent-strong ${i === 1 ? "text-right" : "text-left"}`}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parenti.map((parente, idx) => (
                <tr key={idx} className="border-b border-border-base/30 align-top">
                  <td className="py-1.5 pr-3">
                    {parente.parentela_desc || t("member")}
                    {parente.sesso && <span className={`${smallCapsLabel} ml-1.5`}>{parente.sesso}</span>}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{eta(parente.eta)}</td>
                  <td className="py-1.5 pr-3">
                    {parente.stato_civile}
                    {parente.particolarita && <span className="block text-sm italic text-text-accent">{parente.particolarita}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={`text-sm ${missing}`}>{t("noRelatives")}</p>
      )}
    </section>
  );
};

/** Riga delle azioni, solo testo; l'unica icona è il libro della carta. */
const Actions = ({ row, onViewArchivio, onSegnala }: Pick<CatastoRowProps, "row" | "onViewArchivio" | "onSegnala">) => {
  const t = useT(catastoRowMessages);
  const link = "min-h-11 inline-flex items-center gap-1.5 text-left underline underline-offset-[3px] hover:decoration-2";
  return (
    <div className="mt-6 pt-3 border-t border-border-base flex flex-wrap items-center gap-x-6 gap-y-1 text-sm md:text-base">
      {row.codice_archivio && onViewArchivio && (
        <button type="button" onClick={stop(() => onViewArchivio(row, "campione"))} className={`${link} text-primary`}>
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          {t("openCarta", { carta: row.foglio || "?" })}
        </button>
      )}
      {!row.segnatura_portata && onSegnala && (
        <button type="button" onClick={stop(() => onSegnala(row, "segnatura"))} className={`${link} text-text-accent hover:text-primary`}>
          {t("portataMissing")}
        </button>
      )}
      {onSegnala && (
        <button type="button" onClick={stop(() => onSegnala(row, "dato_errato"))} className={`${link} text-text-accent hover:text-primary`} title={t("reportTitle")}>
          {t("report")}
        </button>
      )}
    </div>
  );
};

/** Contenuto espanso, identico in tabella e card. */
const ExpandedDetails = ({ row, loadingParenti, parentiData, onSegnala, onViewArchivio }: Omit<CatastoRowProps, "expanded" | "onRowClick">) => (
  <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
      <EconomicDetails row={row} />
      <FamilyComposition row={row} loading={loadingParenti} parenti={parentiData} />
    </div>
    <Actions row={row} onViewArchivio={onViewArchivio} onSegnala={onSegnala} />
  </>
);

/* ---------- Riga della tabella (#44) ---------- */

const CatastoRow = forwardRef<HTMLTableRowElement, CatastoRowProps>(
  ({ row, expanded, onRowClick, loadingParenti, parentiData, onViewArchivio, onSegnala }, ref) => {
    const t = useT(catastoRowMessages);
    // Riga aperta: fondo appena tinto e un filetto a sinistra, sulla riga e sul dettaglio.
    const filetto = `border-l-[3px] ${expanded ? "border-l-primary" : "border-l-transparent"}`;
    return (
      <>
        <tr
          ref={ref}
          onClick={() => onRowClick(row.id)}
          className={`cursor-pointer transition-colors border-b border-border-base/40 align-top ${
            expanded ? "bg-item-selected-open" : "bg-bg-table hover:bg-primary/5"
          }`}
        >
          <td className={`pl-3 pr-0 py-4 w-10 ${filetto}`}>
            <CompareCheckbox row={row} />
          </td>
          <td className="px-4 py-4">
            <div className={`text-lg leading-tight ${expanded ? "text-accent-strong font-semibold" : "text-text-main"}`}>{row.nome}</div>
            <div className={`text-sm italic mt-0.5 ${row.mestiere ? "text-text-accent" : "text-text-accent/80"}`}>{row.mestiere || t("noOccupation")}</div>
          </td>
          <td className="px-4 py-4">
            <Location row={row} />
          </td>
          <td className="px-4 py-4">
            <Summary row={row} />
          </td>
          <td className="px-4 py-4">
            <References row={row} onViewArchivio={onViewArchivio} />
          </td>
          <td className="px-3 py-3 text-right">
            <ExpandButton row={row} expanded={expanded} onRowClick={onRowClick} />
          </td>
        </tr>

        {expanded && (
          <tr id={detailsId(row.id)} className="bg-item-selected-open">
            <td colSpan={6} className={`px-6 md:px-8 py-6 border-b border-border-base ${filetto}`}>
              <ExpandedDetails
                row={row}
                loadingParenti={loadingParenti}
                parentiData={parentiData}
                onSegnala={onSegnala}
                onViewArchivio={onViewArchivio}
              />
            </td>
          </tr>
        )}
      </>
    );
  },
);

/** Sul telefono ogni fuoco è una scheda: nome e mestiere, località, fiorini e casa, riferimento al campione. */
export const CatastoMobileCard = React.memo(
  forwardRef<HTMLDivElement, CatastoRowProps>(
    ({ row, expanded, onRowClick, loadingParenti, parentiData, onViewArchivio, onSegnala }, ref) => {
      const t = useT(catastoRowMessages);
      return (
        <div
          ref={ref}
          onClick={() => onRowClick(row.id)}
          className={`p-3 rounded-ui border border-border-base border-l-[3px] transition-colors cursor-pointer ${
            expanded ? "bg-item-selected-open border-l-primary" : "bg-bg-table border-l-border-base hover:bg-primary/5"
          }`}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg leading-tight ${expanded ? "text-accent-strong font-semibold" : "text-text-main font-semibold"}`}>{row.nome}</h3>
              <p className="text-sm italic text-text-accent">{row.mestiere || t("noOccupation")}</p>
            </div>
            <div className="flex-shrink-0 -mt-2 -mr-2">
              <ExpandButton row={row} expanded={expanded} onRowClick={onRowClick} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <Location row={row} />
            <Summary row={row} />
          </div>

          <div className="flex items-end justify-between gap-2 mt-2">
            <References row={row} onViewArchivio={onViewArchivio} />
            <CompareCheckbox row={row} withLabel />
          </div>

          {expanded && (
            <div
              id={detailsId(row.id)}
              className="mt-4 pt-4 border-t border-border-base cursor-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <ExpandedDetails
                row={row}
                loadingParenti={loadingParenti}
                parentiData={parentiData}
                onSegnala={onSegnala}
                onViewArchivio={onViewArchivio}
              />
            </div>
          )}
        </div>
      );
    },
  ),
);

export default React.memo(CatastoRow);
