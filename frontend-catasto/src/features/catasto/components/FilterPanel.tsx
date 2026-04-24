import React, { useState } from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";

import CustomSelect from "../../../components/common/CustomSelect";
import CustomNumberInput from "../../../components/common/CustomNumberInput";
import { useFilters } from "../../../context/FilterContext";

interface FilterPanelProps {
  loading: boolean;
  fetchData: (page: number) => void;
  filterOptions?: {
    bestiame: any[];
    rapporto: any[];
    immigrazione: any[];
    mestieri: any[];
  };
}

export default function FilterPanel({
  loading,
  fetchData,
  filterOptions = { bestiame: [], rapporto: [], immigrazione: [], mestieri: [] },
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
  } = filters;
  
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Classi riutilizzabili per pulizia codice
  const inputClasses =
    "block w-full pl-9 md:pl-10 pr-3 py-2 md:py-3 border border-border-base bg-bg-main text-text-main focus:outline-none focus:ring-2 focus:ring-bg-header font-serif text-base md:text-lg placeholder:text-text-accent placeholder:opacity-50 transition-colors";
  const smallInputClasses =
    "block w-full pl-8 pr-2 py-2 border border-border-base bg-bg-main text-text-main focus:outline-none focus:ring-1 focus:ring-bg-header text-sm placeholder:text-text-accent placeholder:opacity-50 transition-colors";
  const labelClasses =
    "block text-xs md:text-sm font-semibold text-item-selected mb-1 md:mb-2 uppercase tracking-wider";

  return (
    <div className="bg-bg-sidebar rounded-sm shadow-md border border-border-base mb-6 relative transition-colors duration-300">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent rounded-t-sm"></div>
      <div className="p-4 md:p-6 pt-6 md:pt-8">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-end mb-4">
          <div className="flex-1 w-full">
            <label className={labelClasses}>Cerca Persona</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-text-accent" />
              <input
                type="text"
                className={inputClasses}
                placeholder="Nome capofamiglia..."
                value={searchPersona}
                onChange={(e) => setSearchPersona(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 w-full">
            <label className={labelClasses}>Cerca Località</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-text-accent" />
              <input
                type="text"
                className={inputClasses}
                placeholder="Quartiere, Popolo..."
                value={searchLocalita}
                onChange={(e) => setSearchLocalita(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={() => fetchData(1)}
            className="w-full md:w-auto p-2 md:p-3 border bg-primary text-white hover:bg-primary/90 transition-all shadow-sm flex justify-center"
            title="Aggiorna Ricerca"
          >
            <RefreshCw
              className={`h-5 w-5 md:h-6 md:w-6 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        <div className="flex justify-start mb-2">
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2 text-primary font-bold text-xs md:text-sm uppercase tracking-wider hover:underline focus:outline-none transition-colors"
          >
            <Filter className="h-4 w-4" />
            {isFiltersOpen ? "Nascondi Filtri" : "Mostra Filtri Avanzati"}
            {isFiltersOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {isFiltersOpen && (
          <div className="bg-bg-main border border-border-base rounded p-3 md:p-4 mt-2 transition-all duration-300">
            {/* Griglia Mestieri e Status */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="col-span-1">
                <label className="flex items-center justify-between text-xs font-semibold text-text-main mb-1">
                  <span>Mestiere</span>
                  <Link to="/mestieri" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-normal text-[10px] ml-1 shrink-0">
                    più informazioni
                  </Link>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-2 top-2.5 h-4 w-4 text-text-accent" />
                  <input
                    type="text"
                    list="mestieri-list"
                    className={smallInputClasses}
                    placeholder="Es. Fabbro"
                    value={filterMestiere}
                    onChange={(e) => setFilterMestiere(e.target.value)}
                  />
                  <datalist id="mestieri-list">
                    {filterOptions.mestieri?.map((m: any) => (
                      <option key={m.id} value={m.label} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-text-main mb-1">
                  Rapporto Mestiere
                </label>
                <div className="relative">
                  <Hammer className="absolute left-2 top-2.5 h-4 w-4 text-text-accent z-[1]" />
                  <CustomSelect
                    value={filterRapporto}
                    onChange={(e: any) => setFilterRapporto(e.target.value)}
                    options={filterOptions.rapporto}
                    placeholder="Tutti"
                  />
                </div>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-text-main mb-1">
                  Bestiame
                </label>
                <div className="relative">
                  <PawPrint className="absolute left-2 top-2.5 h-4 w-4 text-text-accent z-[1]" />
                  <CustomSelect
                    value={filterBestiame}
                    onChange={(e: any) => setFilterBestiame(e.target.value)}
                    options={filterOptions.bestiame}
                    placeholder="Tutti"
                  />
                </div>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-text-main mb-1">
                  Immigrazione
                </label>
                <div className="relative">
                  <Flag className="absolute left-2 top-2.5 h-4 w-4 text-text-accent z-[1]" />
                  <CustomSelect
                    value={filterImmigrazione}
                    onChange={(e: any) => setFilterImmigrazione(e.target.value)}
                    options={filterOptions.immigrazione}
                    placeholder="Tutti"
                  />
                </div>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-text-main mb-1">
                  Volume
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-2 top-2.5 h-4 w-4 text-text-accent" />
                  <input
                    type="text"
                    className={smallInputClasses}
                    placeholder="Es. 15"
                    value={filterVolume}
                    onChange={(e) => setFilterVolume(e.target.value)}
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
  return (
    <div>
      <label className="block text-xs font-semibold text-text-main mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <CustomNumberInput
          value={min}
          onChange={(e: any) => setMin(e.target.value)}
          placeholder="Min"
          className="w-full"
        />
        <span className="text-text-accent">-</span>
        <CustomNumberInput
          value={max}
          onChange={(e: any) => setMax(e.target.value)}
          placeholder="Max"
          className="w-full"
        />
      </div>
    </div>
  );
}
