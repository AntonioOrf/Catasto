import { useState } from "react";
import {
  Search,
  MapPin,
  RefreshCw,
  Filter,
  ChevronUp,
  ChevronDown,
  Briefcase,
  Hammer,
  PawPrint,
  Flag,
  Calculator,
  BookOpen,
  Globe,
  Map,
  Navigation,
  Users,
  Home,
  RotateCcw,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import type { FilterOptions } from "@catasto/shared";

import CustomAutocomplete from "../../../components/common/CustomAutocomplete";
import CustomNumberInput from "../../../components/common/CustomNumberInput";
import { useFilters } from "../../../context/FilterContext";
import type { SimpleFilterKey } from "../lib/simple-filters";
import AdvancedSearchPanel from "./AdvancedSearchPanel";

interface FilterPanelProps {
  /** Richiesta in corso, anche con risultati già a schermo: fa girare l'icona. */
  loading: boolean;
  /** Ripete la ricerca corrente (i filtri si applicano già da soli). */
  onRefresh: () => void;
  filterOptions: FilterOptions;
}

interface SelectFilter {
  key: SimpleFilterKey;
  label: string;
  options: keyof FilterOptions;
  icon: LucideIcon;
  placeholder?: string;
}

interface RangeFilter {
  label: string;
  min: SimpleFilterKey;
  max: SimpleFilterKey;
}

const TEXT_FILTERS: { key: SimpleFilterKey; label: string; placeholder: string; icon: LucideIcon; narrow?: boolean }[] = [
  { key: "searchPersona", label: "Cerca Persona", placeholder: "Nome capofamiglia...", icon: Search },
  { key: "searchLocalita", label: "Cerca Località", placeholder: "Quartiere, Popolo...", icon: MapPin },
  { key: "filterVolume", label: "Volume", placeholder: "Es. 15", icon: BookOpen, narrow: true },
];

const ATTRIBUTE_FILTERS: SelectFilter[] = [
  { key: "filterMestiere", label: "Mestiere", options: "mestieri", icon: Briefcase, placeholder: "Es. Fabbro" },
  { key: "filterRapporto", label: "Rapporto Mestiere", options: "rapporto", icon: Hammer },
  { key: "filterBestiame", label: "Bestiame", options: "bestiame", icon: PawPrint },
  { key: "filterImmigrazione", label: "Immigrazione", options: "immigrazione", icon: Flag },
  { key: "filterParticolaritaParente", label: "Particolarità Parente", options: "particolaritaParente", icon: Users },
  { key: "filterCasa", label: "Casa", options: "casa", icon: Home },
];

/** In ordine gerarchico: cambiare un livello azzera i successivi (vedi GEO_CASCADE). */
const GEO_FILTERS: SelectFilter[] = [
  { key: "filterSerie", label: "Serie", options: "serie", icon: Map, placeholder: "Seleziona Serie..." },
  { key: "filterQuartiere", label: "Quartiere", options: "quartieri", icon: Navigation, placeholder: "Seleziona Quartiere..." },
  { key: "filterPiviere", label: "Piviere (Gonfalone, Podesteria)", options: "pivieri", icon: Navigation, placeholder: "Seleziona Piviere..." },
  { key: "filterPopolo", label: "Popolo", options: "popoli", icon: Users, placeholder: "Cerca Popolo..." },
];

const RANGE_FILTERS: RangeFilter[] = [
  { label: "Fortune", min: "filterFortuneMin", max: "filterFortuneMax" },
  { label: "Credito", min: "filterCreditoMin", max: "filterCreditoMax" },
  { label: "Credito ai Monti", min: "filterCreditoMMin", max: "filterCreditoMMax" },
  { label: "Imponibile", min: "filterImponibileMin", max: "filterImponibileMax" },
  { label: "Deduzioni", min: "filterDeduzioniMin", max: "filterDeduzioniMax" },
];

const fieldId = (key: string) => `f-${key}`;

const inputClasses =
  "block w-full min-h-11 pl-9 md:pl-10 pr-3 py-2 md:py-3 border border-border-base bg-bg-main text-text-main focus:outline-none focus:ring-2 focus:ring-primary font-serif text-base md:text-lg placeholder:text-text-accent transition-colors";
const labelClasses =
  "block text-xs md:text-sm font-semibold text-accent-strong mb-1 md:mb-2 uppercase tracking-wider";
const smallLabelClasses = "block text-xs font-semibold text-text-main mb-1";
const sectionTitleClasses = "text-primary font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2";
const linkButtonClasses =
  "flex items-center gap-2 font-bold text-xs md:text-sm uppercase tracking-wider hover:underline transition-colors min-h-11";
const badgeClasses =
  "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[11px] leading-none";

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

  const renderSelect = ({ key, label, options, icon: Icon, placeholder = "Seleziona..." }: SelectFilter, labelClassName: string) => (
    <div key={key}>
      <label htmlFor={fieldId(key)} className={labelClassName}>
        {label}
      </label>
      <CustomAutocomplete
        id={fieldId(key)}
        value={filters[key]}
        onChange={(value) => setFilter(key, value)}
        options={filterOptions[options]}
        placeholder={placeholder}
        icon={<Icon size={14} />}
      />
    </div>
  );

  return (
    <section
      aria-label="Filtri di ricerca"
      className="bg-bg-sidebar rounded-sm shadow-md border border-border-base mb-6 relative transition-colors duration-300"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent rounded-t-sm" aria-hidden="true"></div>
      <div className="p-4 md:p-6 pt-6 md:pt-8">
        {/* In modalità avanzata i filtri semplici non vengono applicati: la
            query è interamente descritta dall'AST. Mostrarli comunque
            significherebbe mostrare controlli che non fanno nulla. */}
        {!advancedMode && (
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-end mb-4">
            {TEXT_FILTERS.map(({ key, label, placeholder, icon: Icon, narrow }) => (
              <div key={key} className={`flex-1 w-full ${narrow ? "md:max-w-[150px]" : ""}`}>
                <label htmlFor={fieldId(key)} className={labelClasses}>{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-3 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-text-accent" aria-hidden="true" />
                  <input
                    id={fieldId(key)}
                    type="search"
                    className={inputClasses}
                    placeholder={placeholder}
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
              className="w-full md:w-auto p-2 md:p-3 border border-primary bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-sm flex justify-center h-11 md:h-[54px] items-center"
              title="Aggiorna la ricerca"
            >
              <RefreshCw
                aria-hidden="true"
                className={`h-5 w-5 md:h-6 md:w-6 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`}
              />
              {/* Su mobile il pulsante occupa tutta la riga: un'icona sola non
                  dice cosa fa. Su desktop resta icona, con nome accessibile. */}
              <span className="ml-2 font-bold md:sr-only">Aggiorna</span>
            </button>
          </div>
        )}

        <div className="flex flex-wrap justify-end items-center gap-3 md:gap-4 mb-2">
          <button
            type="button"
            onClick={resetFilters}
            disabled={activeFilterCount === 0 && astConditionCount === 0}
            className={`${linkButtonClasses} text-text-accent disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline`}
            title="Azzera tutti i filtri e l'ordinamento"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Azzera filtri
            {activeFilterCount > 0 && (
              <span className={`${badgeClasses} bg-text-accent/15`}>{activeFilterCount}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setAdvancedMode(!advancedMode)}
            className={`${linkButtonClasses} text-text-accent`}
            aria-pressed={advancedMode}
            title="Costruisci query con AND/OR, gruppi e negazioni"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {advancedMode ? "Ricerca Semplice" : "Ricerca Avanzata"}
            {advancedMode && astConditionCount > 0 && (
              <span className={`${badgeClasses} bg-text-accent/15`}>{astConditionCount}</span>
            )}
          </button>

          {!advancedMode && (
            <button
              type="button"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`${linkButtonClasses} text-primary`}
              aria-expanded={isFiltersOpen}
              aria-controls="altri-filtri"
            >
              <Filter className="h-4 w-4" aria-hidden="true" />
              {isFiltersOpen ? "Nascondi altri filtri" : "Altri filtri"}
              {advancedFilterCount > 0 && (
                <span className={`${badgeClasses} bg-primary text-on-primary`}>{advancedFilterCount}</span>
              )}
              {isFiltersOpen ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        {advancedMode && <AdvancedSearchPanel ast={ast} onChange={setAst} options={filterOptions} />}

        {isFiltersOpen && !advancedMode && (
          <div id="altri-filtri" className="bg-bg-main border border-border-base rounded p-3 md:p-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
              {ATTRIBUTE_FILTERS.map((filter) => renderSelect(filter, smallLabelClasses))}
            </div>

            <fieldset className="border-t border-border-base pt-4 mb-6">
              <legend className={`${sectionTitleClasses} float-left w-full`}>
                <Globe className="h-4 w-4" aria-hidden="true" /> Filtri Geografici
              </legend>
              <div className="clear-both grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {GEO_FILTERS.map((filter) => renderSelect(filter, smallLabelClasses))}
              </div>
            </fieldset>

            <fieldset className="border-t border-border-base pt-4">
              <legend className={`${sectionTitleClasses} float-left w-full`}>
                <Calculator className="h-4 w-4" aria-hidden="true" /> Dati Economici (Range in Fiorini)
              </legend>
              <div className="clear-both grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {RANGE_FILTERS.map(({ label, min, max }) => (
                  <div key={label}>
                    <label htmlFor={fieldId(min)} className={smallLabelClasses}>
                      {label}
                    </label>
                    <div className="flex items-center gap-2">
                      <CustomNumberInput
                        id={fieldId(min)}
                        ariaLabel={`${label} minimo`}
                        value={filters[min]}
                        onChange={(value) => setFilter(min, value)}
                        min={0}
                        placeholder="Min"
                        className="w-full"
                      />
                      <span className="text-text-accent" aria-hidden="true">–</span>
                      <CustomNumberInput
                        ariaLabel={`${label} massimo`}
                        value={filters[max]}
                        onChange={(value) => setFilter(max, value)}
                        min={0}
                        placeholder="Max"
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
