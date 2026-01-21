import React, { useState } from 'react'; // 👈 QUESTA È LA RIGA CHE MANCAVA
import { Search, MapPin, RefreshCw, Filter, ChevronUp, ChevronDown, Briefcase, Hammer, PawPrint, Flag, Calculator } from 'lucide-react';
// Assicurati che il percorso di questo import sia corretto per la tua struttura cartelle
import { rapportoOptions, bestiameOptions, immigrazioneOptions } from '../../utils/constants';

export default function FilterPanel({
    searchPersona, setSearchPersona,
    searchLocalita, setSearchLocalita,
    loading, fetchData,

    // Filter State & Setters
    filterMestiere, setFilterMestiere,
    filterRapporto, setFilterRapporto,
    filterBestiame, setFilterBestiame,
    filterImmigrazione, setFilterImmigrazione,

    filterFortuneMin, setFilterFortuneMin,
    filterFortuneMax, setFilterFortuneMax,
    filterCreditoMin, setFilterCreditoMin,
    filterCreditoMax, setFilterCreditoMax,
    filterCreditoMMin, setFilterCreditoMMin,
    filterCreditoMMax, setFilterCreditoMMax,
    filterImponibileMin, setFilterImponibileMin,
    filterImponibileMax, setFilterImponibileMax,
    filterDeduzioniMin, setFilterDeduzioniMin,
    filterDeduzioniMax, setFilterDeduzioniMax
}) {
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Classi riutilizzabili per pulizia codice
    const inputClasses = "block w-full pl-9 md:pl-10 pr-3 py-2 md:py-3 border border-border-base bg-bg-main text-text-main focus:outline-none focus:ring-2 focus:ring-bg-header font-serif text-base md:text-lg placeholder:text-text-accent placeholder:opacity-50 transition-colors";
    const smallInputClasses = "block w-full pl-8 pr-2 py-2 border border-border-base bg-bg-main text-text-main focus:outline-none focus:ring-1 focus:ring-bg-header text-sm placeholder:text-text-accent placeholder:opacity-50 transition-colors";
    const labelClasses = "block text-xs md:text-sm font-semibold text-item-selected mb-1 md:mb-2 uppercase tracking-wider";

    return (
        // CONTENITORE PRINCIPALE
        <div className="bg-bg-sidebar rounded-sm shadow-md border border-border-base mb-6 relative overflow-hidden transition-colors duration-300">

            {/* === BARRA DECORATIVA SUPERIORE (Linea Orizzontale) === */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-bg-header border-b border-bg-header-border"></div>

            <div className="p-4 md:p-6 pt-6 md:pt-8">

                {/* --- RIGA DI RICERCA --- */}
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-end mb-4">

                    {/* Cerca Persona */}
                    <div className="flex-1 w-full">
                        <label className={labelClasses}>Cerca Persona</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-text-accent" />
                            <input
                                type="text"
                                className={inputClasses}
                                placeholder="