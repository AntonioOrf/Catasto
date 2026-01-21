export default function FilterPanel({ /* ... props ... */ }) {
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Classi riutilizzabili...
    const inputClasses = "block w-full pl-9 md:pl-10 pr-3 py-2 md:py-3 border border-border-base bg-bg-main text-text-main focus:outline-none focus:ring-2 focus:ring-bg-header font-serif text-base md:text-lg placeholder:text-text-accent placeholder:opacity-50 transition-colors";
    const labelClasses = "block text-xs md:text-sm font-semibold text-item-selected mb-1 md:mb-2 uppercase tracking-wider";

    return (
        // Contenitore Esterno
        <div className="bg-bg-sidebar rounded-sm shadow-md border border-border-base mb-6 relative overflow-hidden transition-colors duration-300">

            <div className="absolute top-0 left-0 w-full h-1.5 bg-bg-header border-b border-bg-header-border"></div>

            <div className="p-4 md:p-6 pt-6 md:pt-8">

                <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-end mb-4">
                    <div className="flex-1 w-full">
                        <label className={labelClasses}>Cerca Persona</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-text-accent" />
                            <input type="text" className={inputClasses} placeholder="Nome capofamiglia..." value={searchPersona} onChange={(e) => setSearchPersona(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <label className={labelClasses}>Cerca Località</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-text-accent" />
                            <input type="text" className={inputClasses} placeholder="Quartiere, Popolo..." value={searchLocalita} onChange={(e) => setSearchLocalita(e.target.value)} />
                        </div>
                    </div>

                    <button onClick={() => fetchData(1)} className="w-full md:w-auto p-2 md:p-3 border border-bg-header bg-bg-header text-text-inverted hover:bg-bg-header-accent transition-all shadow-sm flex justify-center">
                        <RefreshCw className={`h-5 w-5 md:h-6 md:w-6 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="flex justify-start mb-2">
                    <button onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="flex items-center gap-2 text-item-selected font-bold text-xs md:text-sm uppercase tracking-wider hover:underline focus:outline-none transition-colors">
                        <Filter className="h-4 w-4" />
                        {isFiltersOpen ? "Nascondi Filtri" : "Mostra Filtri Avanzati"}
                        {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                </div>

                {isFiltersOpen && (
                    <div className="bg-bg-main border border-border-base rounded p-3 md:p-4 mt-2 transition-all duration-300 animate-in slide-in-from-top-2">
                        {/* ... griglia filtri ... */}
                    </div>
                )}
            </div>
        </div>
    );
}