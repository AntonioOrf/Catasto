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
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

import CustomAutocomplete from "../../../components/common/CustomAutocomplete";
import CustomNumberInput from "../../../components/common/CustomNumberInput";
import { useFilters } from "../../../context/FilterContext";
import AdvancedSearchPanel from "./AdvancedSearchPanel";

interface FilterPanelProps {
  loading: boolean;
  fetchData: (page: number) => void;
  filterOptions?: {
    bestiame: any[];
    rapporto: any[];
    immigrazione: any[];
    mestieri: any[];
    serie: any[];
    quartieri: any[];
    pivieri: any[];
    popoli: any[];
    particolaritaParente: any[];
    casa: any[];
  };
}

export default function FilterPanel({
  loading,
  fetchData,
  filterOptions = { bestiame: [], rapporto: [], immigrazione: [], mestieri: [], serie: [], quartieri: [], pivieri: [], popoli: [], particolaritaParente: [], casa: [] },
}: FilterPanelProps) {
  const filters: any = useFilters();
  const {
    searchPersona,
    setSearchPersona,
    searchLocalita,
    setSearchLocalita,
    filterMestiere,
    setFilterMestiere,
    filterRapporto,
    setFilterRapporto,
    filterBestiame,
    setFilterBestiame,
    filterImmigrazione,
    setFilterImmigrazione,
    filterVolume,
    setFilterVolume,
    filterFortuneMin,
    setFilterFortuneMin,
    filterFortuneMax,
    setFilterFortuneMax,
    filterCreditoMin,
    setFilterCreditoMin,
    filterCreditoMax,
    setFilterCreditoMax,
    filterCreditoMMin,
    setFilterCreditoMMin,
    filterCreditoMMax,
    setFilterCreditoMMax,
    filterImponibileMin,
    setFilterImponibileMin,
    filterImponibileMax,
    setFilterImponibileMax,
    filterDeduzioniMin,
    setFilterDeduzioniMin,
    filterDeduzioniMax,
    setFilterDeduzioniMax,
    filterParticolaritaParente,
    setFilterParticolaritaParente,
    filterCasa,
    setFilterCasa,
    filterSerie,
    setFilterSerie,
    filterQuartiere,
    setFilterQuartiere,
    filterPiviere,
    setFilterPiviere,
    filterPopolo,
    setFilterPopolo,
    activeFilterCount,
    advancedFilterCount,
    astConditionCount,
    resetFilters,
    advancedMode,
    setAdvancedMode,
    ast,
    setAst,
  } = filters;

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Classi riutilizzabili per pulizia codice
  const inputClasses =
    "block w-full pl-9 md:pl-10 pr-3 py-2 md:py-3 border border-border-base bg-bg-main text-text-main focus:outline-none focus:ring-2 focus:ring-bg-header font-serif text-base md:text-lg placeholder:text-text-accent placeholder:opacity-50 transition-colors";
  const labelClasses =
    "block text-xs md:text-sm font-semibold text-accent-strong mb-1 md:mb-2 uppercase tracking-wider";

  return (
    <div className="bg-bg-sidebar rounded-sm shadow-md border border-border-base mb-6 relative transition-colors duration-300">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent rounded-t-sm"></div>
      <div className="p-4 md:p-6 pt-6 md:pt-8">
        {/* In modalità avanzata i filtri semplici non vengono applicati: la
            query è interamente descritta dall'AST. Mostrarli comunque
            significherebbe mostrare controlli che non fanno nulla. */}
        <div className={`flex flex-col md:flex-row gap-4 md:gap-6 items-end mb-4 ${advancedMode ? "hidden" : ""}`}>
          <div className="flex-1 w-full">
            <label htmlFor="f-persona" className={labelClasses}>Cerca Persona</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-text-accent" />
              <input
                id="f-persona"
                type="text"
                className={inputClasses}
                placeholder="Nome capofamiglia..."
                value={searchPersona}
                onChange={(e) => setSearchPersona(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 w-full">
            <label htmlFor="f-localita" className={labelClasses}>Cerca Località</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-text-accent" />
              <input
                id="f-localita"
                type="text"
                className={inputClasses}
                placeholder="Quartiere, Popolo..."
                value={searchLocalita}
                onChange={(e) => setSearchLocalita(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 w-full md:max-w-[150px]">
            <label htmlFor="f-volume" className={labelClasses}>Volume</label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-3 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-text-accent" />
              <input
                id="f-volume"
                type="text"
                className={inputClasses}
                placeholder="Es. 15"
                value={filterVolume}
                onChange={(e) => setFilterVolume(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={() => fetchData(1)}
            className="w-full md:w-auto p-2 md:p-3 border bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-sm flex justify-center h-[42px] md:h-[54px] items-center"
            title="Aggiorna Ricerca"
            aria-label="Aggiorna ricerca"
          >
            <RefreshCw
              className={`h-5 w-5 md:h-6 md:w-6 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        <div className="flex flex-wrap justify-end items-center gap-3 md:gap-4 mb-2">
          <button
            onClick={resetFilters}
            disabled={activeFilterCount === 0}
            className="flex items-center gap-2 text-text-accent font-bold text-xs md:text-sm uppercase tracking-wider hover:underline transition-colors min-h-11 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline"
            title="Azzera tutti i filtri e l'ordinamento"
          >
            <RotateCcw className="h-4 w-4" />
            Resetta Filtri
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-text-accent/15 text-[10px] leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setAdvancedMode(!advancedMode)}
            className="flex items-center gap-2 text-text-accent font-bold text-xs md:text-sm uppercase tracking-wider hover:underline transition-colors min-h-11"
            aria-pressed={advancedMode}
            title="Costruisci query con AND/OR, gruppi e negazioni"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {advancedMode ? "Ricerca Semplice" : "Ricerca Avanzata"}
            {advancedMode && astConditionCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-text-accent/15 text-[10px] leading-none">
                {astConditionCount}
              </span>
            )}
          </button>

          {!advancedMode && (
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="flex items-center gap-2 text-primary font-bold text-xs md:text-sm uppercase tracking-wider hover:underline transition-colors min-h-11"
              aria-expanded={isFiltersOpen}
            >
              <Filter className="h-4 w-4" />
              {isFiltersOpen ? "Nascondi Filtri" : "Mostra Filtri Avanzati"}
              {advancedFilterCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-primary text-on-primary text-[10px] leading-none">
                  {advancedFilterCount}
                </span>
              )}
              {isFiltersOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {advancedMode && (
          <AdvancedSearchPanel ast={ast} onChange={setAst} options={filterOptions as any} />
        )}

        {isFiltersOpen && !advancedMode && (
          <div className="bg-bg-main border border-border-base rounded p-3 md:p-4 mt-2 transition-all duration-300">
            {/* Griglia Mestieri e Status */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
              <div className="col-span-1">
                <label htmlFor="f-mestiere" className="flex items-center justify-between text-xs font-semibold text-text-main mb-1">
                  <span>Mestiere</span>
                </label>
                <div className="relative">
                  <CustomAutocomplete
                    id="f-mestiere"
                    value={filterMestiere}
                    onChange={(e: any) => setFilterMestiere(e.target.value)}
                    options={filterOptions.mestieri}
                    placeholder="Es. Fabbro"
                    icon={<Briefcase size={14} />}
                  />
                </div>
              </div>
              <div className="col-span-1">
                <label htmlFor="f-rapporto-mestiere" className="block text-xs font-semibold text-text-main mb-1">
                  Rapporto Mestiere
                </label>
                <div className="relative">
                  <CustomAutocomplete
                    id="f-rapporto-mestiere"
                    value={filterRapporto}
                    onChange={(e: any) => setFilterRapporto(e.target.value)}
                    options={filterOptions.rapporto}
                    placeholder="Seleziona..."
                    icon={<Hammer size={14} />}
                  />
                </div>
              </div>
              <div className="col-span-1">
                <label htmlFor="f-bestiame" className="block text-xs font-semibold text-text-main mb-1">
                  Bestiame
                </label>
                <div className="relative">
                  <CustomAutocomplete
                    id="f-bestiame"
                    value={filterBestiame}
                    onChange={(e: any) => setFilterBestiame(e.target.value)}
                    options={filterOptions.bestiame}
                    placeholder="Seleziona..."
                    icon={<PawPrint size={14} />}
                  />
                </div>
              </div>
              <div className="col-span-1">
                <label htmlFor="f-immigrazione" className="block text-xs font-semibold text-text-main mb-1">
                  Immigrazione
                </label>
                <div className="relative">
                  <CustomAutocomplete
                    id="f-immigrazione"
                    value={filterImmigrazione}
                    onChange={(e: any) => setFilterImmigrazione(e.target.value)}
                    options={filterOptions.immigrazione}
                    placeholder="Seleziona..."
                    icon={<Flag size={14} />}
                  />
                </div>
              </div>
              <div className="col-span-1">
                <label htmlFor="f-particolarita-parente" className="block text-xs font-semibold text-text-main mb-1">
                  Particolarità Parente
                </label>
                <div className="relative">
                  <CustomAutocomplete
                    id="f-particolarita-parente"
                    value={filterParticolaritaParente}
                    onChange={(e: any) => setFilterParticolaritaParente(e.target.value)}
                    options={filterOptions.particolaritaParente}
                    placeholder="Seleziona..."
                    icon={<Users size={14} />}
                  />
                </div>
              </div>
              <div className="col-span-1">
                <label htmlFor="f-casa" className="block text-xs font-semibold text-text-main mb-1">
                  Casa
                </label>
                <div className="relative">
                  <CustomAutocomplete
                    id="f-casa"
                    value={filterCasa}
                    onChange={(e: any) => setFilterCasa(e.target.value)}
                    options={filterOptions.casa}
                    placeholder="Seleziona..."
                    icon={<BookOpen size={14} />}
                  />
                </div>
              </div>
            </div>

            {/* Sezione Filtri Geografici */}
            <div className="border-t border-border-base pt-4 mb-6">
              <div className="text-primary font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4" /> Filtri Geografici
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label htmlFor="f-serie" className={labelClasses.replace("md:text-sm", "text-[10px]")}>Serie</label>
                  <CustomAutocomplete
                    id="f-serie"
                    value={filterSerie}
                    onChange={(e: any) => {
                      setFilterSerie(e.target.value);
                      setFilterQuartiere("");
                      setFilterPiviere("");
                      setFilterPopolo("");
                    }}
                    options={filterOptions.serie}
                    placeholder="Seleziona Serie..."
                    icon={<Map size={14} />}
                  />
                </div>
                <div className="col-span-1">
                  <label htmlFor="f-quartiere" className={labelClasses.replace("md:text-sm", "text-[10px]")}>Quartiere</label>
                  <CustomAutocomplete
                    id="f-quartiere"
                    value={filterQuartiere}
                    onChange={(e: any) => {
                      setFilterQuartiere(e.target.value);
                      setFilterPiviere("");
                      setFilterPopolo("");
                    }}
                    options={filterOptions.quartieri}
                    placeholder="Seleziona Quartiere..."
                    icon={<Navigation size={14} />}
                  />
                </div>
                <div className="col-span-1">
                  <label htmlFor="f-piviere" className={labelClasses.replace("md:text-sm", "text-[10px]")}>Piviere (Gonfalone, Podesetria)</label>
                  <CustomAutocomplete
                    id="f-piviere"
                    value={filterPiviere}
                    onChange={(e: any) => {
                      setFilterPiviere(e.target.value);
                      setFilterPopolo("");
                    }}
                    options={filterOptions.pivieri}
                    placeholder="Seleziona Piviere..."
                    icon={<Navigation size={14} />}
                  />
                </div>
                <div className="col-span-1">
                  <label htmlFor="f-popolo" className={labelClasses.replace("md:text-sm", "text-[10px]")}>Popolo</label>
                  <CustomAutocomplete
                    id="f-popolo"
                    value={filterPopolo}
                    onChange={(e: any) => setFilterPopolo(e.target.value)}
                    options={filterOptions.popoli}
                    placeholder="Cerca Popolo..."
                    icon={<Users size={14} />}
                  />
                </div>
              </div>
            </div>

            {/* Sezione Dati Economici */}
            <div className="border-t border-border-base pt-4">
              <div className="text-primary font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calculator className="h-4 w-4" /> Dati Economici (Range in Fiorini)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <RangeInput
                  label="Fortune"
                  min={filterFortuneMin}
                  max={filterFortuneMax}
                  setMin={setFilterFortuneMin}
                  setMax={setFilterFortuneMax}
                />
                <RangeInput
                  label="Credito"
                  min={filterCreditoMin}
                  max={filterCreditoMax}
                  setMin={setFilterCreditoMin}
                  setMax={setFilterCreditoMax}
                />
                <RangeInput
                  label="Credito ai Monti"
                  min={filterCreditoMMin}
                  max={filterCreditoMMax}
                  setMin={setFilterCreditoMMin}
                  setMax={setFilterCreditoMMax}
                />
                <RangeInput
                  label="Imponibile"
                  min={filterImponibileMin}
                  max={filterImponibileMax}
                  setMin={setFilterImponibileMin}
                  setMax={setFilterImponibileMax}
                />
                <RangeInput
                  label="Deduzioni"
                  min={filterDeduzioniMin}
                  max={filterDeduzioniMax}
                  setMin={setFilterDeduzioniMin}
                  setMax={setFilterDeduzioniMax}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RangeInput({ label, min, max, setMin, setMax }: any) {
  const id = `f-${String(label).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <label htmlFor={`${id}-min`} className="block text-xs font-semibold text-text-main mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <CustomNumberInput
          id={`${id}-min`}
          ariaLabel={`${label} minimo`}
          value={min}
          onChange={(e: any) => setMin(e.target.value)}
          placeholder="Min"
          className="w-full"
        />
        <span className="text-text-accent">-</span>
        <CustomNumberInput
          ariaLabel={`${label} massimo`}
          value={max}
          onChange={(e: any) => setMax(e.target.value)}
          placeholder="Max"
          className="w-full"
        />
      </div>
    </div>
  );
}
