import { useState } from "react";
import { Search, RefreshCw, type LucideIcon } from "lucide-react";
import type { FilterOptions } from "@catasto/shared";

import CustomAutocomplete from "../../../components/common/CustomAutocomplete";
import CustomNumberInput from "../../../components/common/CustomNumberInput";
import { useFilters } from "../../../context/FilterContext";
import type { SimpleFilterKey } from "../lib/simple-filters";
import AdvancedSearchPanel from "./AdvancedSearchPanel";
import { useT } from "../../../i18n";
import { filterPanelMessages, type FilterPanelMessageKey } from "./FilterPanel.messages";
import GlossaryTerm from "../../glossary/GlossaryTerm";

type MsgKey = FilterPanelMessageKey;

interface FilterPanelProps {
  /** Richiesta in corso, anche con risultati già a schermo: fa girare l'icona. */
  loading: boolean;
  /** Ripete la ricerca corrente (i filtri si applicano già da soli). */
  onRefresh: () => void;
  filterOptions: FilterOptions;
}

interface SelectFilter {
  key: SimpleFilterKey;
  label: MsgKey;
  options: keyof FilterOptions;
  placeholder?: MsgKey;
  /** Voce del glossario spiegata accanto all'etichetta. */
  term?: string;
}

interface RangeFilter {
  label: MsgKey;
  min: SimpleFilterKey;
  max: SimpleFilterKey;
  term: string;
}

// Una sola icona: la lente della ricerca per persona. Gli altri campi non ne hanno.
const TEXT_FILTERS: { key: SimpleFilterKey; label: MsgKey; placeholder: MsgKey; icon?: LucideIcon; narrow?: boolean; term?: string }[] = [
  { key: "searchPersona", label: "searchPersona", placeholder: "searchPersonaPh", icon: Search },
  { key: "searchLocalita", label: "searchLocalita", placeholder: "searchLocalitaPh" },
  { key: "filterVolume", label: "volume", placeholder: "volumePh", narrow: true, term: "campione" },
];

const ATTRIBUTE_FILTERS: SelectFilter[] = [
  { key: "filterMestiere", label: "mestiere", options: "mestieri", placeholder: "mestierePh" },
  { key: "filterRapporto", label: "rapporto", options: "rapporto" },
  { key: "filterBestiame", label: "bestiame", options: "bestiame" },
  { key: "filterImmigrazione", label: "immigrazione", options: "immigrazione" },
  { key: "filterParticolaritaParente", label: "particolaritaParente", options: "particolaritaParente" },
  { key: "filterCasa", label: "casa", options: "casa" },
];

/** In ordine gerarchico: cambiare un livello azzera i successivi (vedi GEO_CASCADE). */
const GEO_FILTERS: SelectFilter[] = [
  { key: "filterSerie", label: "serie", options: "serie", placeholder: "seriePh", term: "serie" },
  { key: "filterQuartiere", label: "quartiere", options: "quartieri", placeholder: "quartierePh", term: "quartiere" },
  { key: "filterPiviere", label: "piviere", options: "pivieri", placeholder: "piviereP", term: "piviere" },
  { key: "filterPopolo", label: "popolo", options: "popoli", placeholder: "popoloPh", term: "popolo" },
];

const RANGE_FILTERS: RangeFilter[] = [
  { label: "fortune", min: "filterFortuneMin", max: "filterFortuneMax", term: "fortune" },
  { label: "credito", min: "filterCreditoMin", max: "filterCreditoMax", term: "credito" },
  { label: "creditoM", min: "filterCreditoMMin", max: "filterCreditoMMax", term: "credito_m" },
  { label: "imponibile", min: "filterImponibileMin", max: "filterImponibileMax", term: "imponibile" },
  { label: "deduzioni", min: "filterDeduzioniMin", max: "filterDeduzioniMax", term: "deduzioni" },
];

const fieldId = (key: string) => `f-${key}`;

const inputClasses =
  "block w-full min-h-11 pr-3 py-2 md:py-3 border border-border-base bg-bg-main text-text-main focus:outline-none focus:ring-2 focus:ring-primary font-serif text-base md:text-lg placeholder:text-text-accent transition-colors";
const labelClasses = "block text-sm md:text-base font-semibold text-accent-strong mb-1";
const smallLabelClasses = "block text-sm font-semibold text-accent-strong mb-1";
const sectionTitleClasses = "text-accent-strong font-semibold text-base mb-3";
const linkButtonClasses = "inline-flex items-center gap-1 text-sm md:text-base underline-offset-4 hover:underline min-h-11";
/** Conteggio accanto ai link: testo tra parentesi, niente pillole. */
const countClasses = "tabular-nums";

export default function FilterPanel({ loading, onRefresh, filterOptions }: FilterPanelProps) {
  const {
    filters,
    setFilter,
    activeFilterCount,
    advancedFilterCount,
    astConditionCount,
    resetFilters,
    advancedMode,
    setAdvancedMode,
    ast,
    setAst,
  } = useFilters();

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const t = useT(filterPanelMessages);

  // Il suggerimento sta accanto all'etichetta, non dentro: un pulsante dentro
  // un <label> attiverebbe anche il campo.
  const labelWithTerm = (htmlFor: string, text: string, className: string, term?: string) =>
    term ? (
      <div className="flex items-center gap-1">
        <label htmlFor={htmlFor} className={className}>
          {text}
        </label>
        <GlossaryTerm id={term} className="mb-1" />
      </div>
    ) : (
      <label htmlFor={htmlFor} className={className}>
        {text}
      </label>
    );

  const renderSelect = ({ key, label, options, placeholder = "select", term }: SelectFilter, labelClassName: string) => (
    <div key={key}>
      {labelWithTerm(fieldId(key), t(label), labelClassName, term)}
      <CustomAutocomplete
        id={fieldId(key)}
        value={filters[key]}
        onChange={(value) => setFilter(key, value)}
        options={filterOptions[options]}
        placeholder={t(placeholder)}
      />
    </div>
  );

  return (
    <section
      aria-label={t("section")}
      className="bg-bg-sidebar rounded-ui border border-border-base mb-6 transition-colors duration-300"
    >
      <div className="p-4 md:p-6">
        {/* In modalità avanzata i filtri semplici non vengono applicati: la
            query è interamente descritta dall'AST. Mostrarli comunque
            significherebbe mostrare controlli che non fanno nulla. */}
        {!advancedMode && (
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-end mb-4">
            {TEXT_FILTERS.map(({ key, label, placeholder, icon: Icon, narrow, term }) => (
              <div key={key} className={`flex-1 w-full ${narrow ? "md:max-w-[150px]" : ""}`}>
                {labelWithTerm(fieldId(key), t(label), labelClasses, term)}
                <div className="relative">
                  {Icon && (
                    <Icon className="absolute left-3 top-3 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-text-accent" aria-hidden="true" />
                  )}
                  <input
                    id={fieldId(key)}
                    type="search"
                    className={`${inputClasses} ${Icon ? "pl-9 md:pl-10" : "pl-3"}`}
                    placeholder={t(placeholder)}
                    value={filters[key]}
                    maxLength={200}
                    onChange={(e) => setFilter(key, e.target.value)}
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={onRefresh}
              className="w-full md:w-auto px-4 border border-primary bg-primary text-on-primary hover:bg-primary/90 rounded-ui transition-colors flex justify-center gap-2 h-11 md:h-[54px] items-center font-semibold"
              title={t("refreshTitle")}
            >
              <RefreshCw
                aria-hidden="true"
                className={`h-5 w-5 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`}
              />
              {/* Icona e nome scritto: un'icona sola non dice cosa fa. */}
              <span>{t("refresh")}</span>
            </button>
          </div>
        )}

        <div className="flex flex-wrap justify-end items-center gap-3 md:gap-4 mb-2">
          <button
            type="button"
            onClick={resetFilters}
            disabled={activeFilterCount === 0 && astConditionCount === 0}
            className={`${linkButtonClasses} text-text-accent disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline`}
            title={t("resetTitle")}
          >
            {t("reset")}
            {activeFilterCount > 0 && <span className={countClasses}>({activeFilterCount})</span>}
          </button>

          <button
            type="button"
            onClick={() => setAdvancedMode(!advancedMode)}
            className={`${linkButtonClasses} text-text-accent`}
            aria-pressed={advancedMode}
            title={t("advancedTitle")}
          >
            {advancedMode ? t("simpleSearch") : t("advancedSearch")}
            {advancedMode && astConditionCount > 0 && <span className={countClasses}>({astConditionCount})</span>}
          </button>

          {!advancedMode && (
            <button
              type="button"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`${linkButtonClasses} text-primary`}
              aria-expanded={isFiltersOpen}
              aria-controls="altri-filtri"
            >
              {isFiltersOpen ? t("hideMoreFilters") : t("moreFilters")}
              {advancedFilterCount > 0 && <span className={countClasses}>({advancedFilterCount})</span>}
            </button>
          )}
        </div>

        {advancedMode && <AdvancedSearchPanel ast={ast} onChange={setAst} options={filterOptions} />}

        {isFiltersOpen && !advancedMode && (
          <div id="altri-filtri" className="bg-bg-main border border-border-base rounded-ui p-3 md:p-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
              {ATTRIBUTE_FILTERS.map((filter) => renderSelect(filter, smallLabelClasses))}
            </div>

            <fieldset className="border-t border-border-base pt-4 mb-6">
              <legend className={`${sectionTitleClasses} float-left w-full`}>
                {t("geoFilters")}
              </legend>
              <div className="clear-both grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {GEO_FILTERS.map((filter) => renderSelect(filter, smallLabelClasses))}
              </div>
            </fieldset>

            <fieldset className="border-t border-border-base pt-4">
              <legend className={`${sectionTitleClasses} float-left w-full`}>
                {t("economicData")}
              </legend>
              <div className="clear-both grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {RANGE_FILTERS.map(({ label, min, max, term }) => (
                  <div key={label}>
                    {labelWithTerm(fieldId(min), t(label), smallLabelClasses, term)}
                    <div className="flex items-center gap-2">
                      <CustomNumberInput
                        id={fieldId(min)}
                        ariaLabel={t("minAria", { label: t(label) })}
                        value={filters[min]}
                        onChange={(value) => setFilter(min, value)}
                        min={0}
                        placeholder={t("min")}
                        className="w-full"
                      />
                      <span className="text-text-accent" aria-hidden="true">–</span>
                      <CustomNumberInput
                        ariaLabel={t("maxAria", { label: t(label) })}
                        value={filters[max]}
                        onChange={(value) => setFilter(max, value)}
                        min={0}
                        placeholder={t("max")}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
        )}
      </div>
    </section>
  );
}
