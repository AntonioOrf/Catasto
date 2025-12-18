import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MapPin, Briefcase, Coins, Home, Users, BookOpen, 
  ChevronRight, ChevronDown, ChevronUp, ChevronLeft, RefreshCw, Layers, Scroll, 
  ArrowLeft, ArrowRight, Info, PawPrint, Flag, Hammer, Filter, 
  ArrowUp, ArrowDown, ArrowUpDown, FileText, Bookmark, List, Calculator, Menu, X
} from 'lucide-react';

// --- CONFIGURAZIONE URL API ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function App() {
  // --- STATI UI ---
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  // Default: Chiusa su mobile (< 768px), Aperta su desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);

  // --- REFS PER SCROLL ---
  const tableRowsRef = useRef({}); 
  const mainContentRef = useRef(null); 

  // --- STATI DI RICERCA ---
  const [searchPersona, setSearchPersona] = useState('');
  const [searchLocalita, setSearchLocalita] = useState('');
  
  // Filtri Dropdown
  const [filterMestiere, setFilterMestiere] = useState('');
  const [filterBestiame, setFilterBestiame] = useState('');
  const [filterImmigrazione, setFilterImmigrazione] = useState(''); 
  const [filterRapporto, setFilterRapporto] = useState('');         
  
  // Filtri Range Economici
  const [filterFortuneMin, setFilterFortuneMin] = useState('');
  const [filterFortuneMax, setFilterFortuneMax] = useState('');
  const [filterCreditoMin, setFilterCreditoMin] = useState('');     
  const [filterCreditoMax, setFilterCreditoMax] = useState('');     
  const [filterCreditoMMin, setFilterCreditoMMin] = useState('');   
  const [filterCreditoMMax, setFilterCreditoMMax] = useState('');   
  const [filterImponibileMin, setFilterImponibileMin] = useState(''); 
  const [filterImponibileMax, setFilterImponibileMax] = useState('');
  const [filterDeduzioniMin, setFilterDeduzioniMin] = useState(''); 
  const [filterDeduzioniMax, setFilterDeduzioniMax] = useState('');

  // Ordinamento
  const [sortBy, setSortBy] = useState('nome'); 
  const [sortOrder, setSortOrder] = useState('ASC'); 

  // --- DATI ---
  const [page, setPage] = useState(1);
  const ROWS_PER_PAGE = 50; 
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  const [data, setData] = useState([]);
  const [sidebarData, setSidebarData] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [error, setError] = useState(null);

  const [expandedId, setExpandedId] = useState(null);
  const [parentiData, setParentiData] = useState([]);
  const [loadingParenti, setLoadingParenti] = useState(false);

  const [targetScrolledId, setTargetScrolledId] = useState(null);

  // Opzioni Menu
  const bestiameOptions = [{ id: 0, label: "Non specificato" },{ id: 1, label: "Proprietario di bovini" },{ id: 2, label: "Affittuario di bovini" },{ id: 3, label: "Proprietario e affittuario" },{ id: 4, label: "Solo bestiame minuto" },{ id: 5, label: "Animali da tiro/soma" }];
  const immigrazioneOptions = [{ id: 0, label: "Non specificato" },{ id: 1, label: "Cittadino" },{ id: 2, label: "Forestiero" },{ id: 3, label: "Abitante del Contado" }];
  const rapportoOptions = [{ id: 0, label: "Non specificato" },{ id: 1, label: "Maestro" },{ id: 2, label: "Lavorante / Garzone" },{ id: 3, label: "Apprendista" },{ id: 4, label: "Socio" }];

  // Helper Params
  const buildParams = () => {
    const params = new URLSearchParams();
    if (searchPersona) params.append('q_persona', searchPersona);
    if (searchLocalita) params.append('q_localita', searchLocalita);
    if (filterMestiere) params.append('mestiere', filterMestiere);
    if (filterBestiame) params.append('bestiame', filterBestiame);
    if (filterImmigrazione) params.append('immigrazione', filterImmigrazione);
    if (filterRapporto) params.append('rapporto', filterRapporto);
    
    if (filterFortuneMin) params.append('fortune_min', filterFortuneMin);
    if (filterFortuneMax) params.append('fortune_max', filterFortuneMax);
    if (filterCreditoMin) params.append('credito_min', filterCreditoMin);
    if (filterCreditoMax) params.append('credito_max', filterCreditoMax);
    if (filterCreditoMMin) params.append('creditoM_min', filterCreditoMMin);
    if (filterCreditoMMax) params.append('creditoM_max', filterCreditoMMax);
    if (filterImponibileMin) params.append('imponibile_min', filterImponibileMin);
    if (filterImponibileMax) params.append('imponibile_max', filterImponibileMax);
    if (filterDeduzioniMin) params.append('deduzioni_min', filterDeduzioniMin);
    if (filterDeduzioniMax) params.append('deduzioni_max', filterDeduzioniMax);

    params.append('sort_by', sortBy);
    params.append('order', sortOrder);
    return params;
  };

  // --- FETCH DATI TABELLA ---
  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    setExpandedId(null); 
    tableRowsRef.current = {};

    try {
      const params = buildParams();
      params.append('page', pageNum);
      params.append('limit', ROWS_PER_PAGE);

      const response = await fetch(`${API_URL}/api/catasto?${params.toString()}`);
      if (!response.ok) throw new Error('Errore server');
      const result = await response.json();
      
      setData(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalRecords(result.pagination.total);
      setPage(pageNum);
    } catch (err) {
      console.error(err);
      setError("Impossibile connettersi al Server.");
    } finally {
      setLoading(false);
    }
  };

  // --- FETCH SIDEBAR ---
  const fetchSidebarData = async () => {
    setSidebarLoading(true);
    try {
      const params = buildParams();
      const response = await fetch(`${API_URL}/api/catasto/sidebar?${params.toString()}`);
      if (!response.ok) throw new Error('Errore sidebar');
      const result = await response.json();
      setSidebarData(result);
    } catch (err) { console.error(err); } 
    finally { setSidebarLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1);
      fetchSidebarData();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [
    searchPersona, searchLocalita, filterMestiere, filterBestiame, filterImmigrazione, filterRapporto, 
    filterFortuneMin, filterFortuneMax, filterCreditoMin, filterCreditoMax,
    filterCreditoMMin, filterCreditoMMax, filterImponibileMin, filterImponibileMax,
    filterDeduzioniMin, filterDeduzioniMax,
    sortBy, sortOrder
  ]);

  // Scroll automatico dopo cambio pagina
  useEffect(() => {
    if (targetScrolledId && !loading && data.length > 0) {
      const rowElement = tableRowsRef.current[targetScrolledId];
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        handleRowClick(targetScrolledId);
      }
      setTargetScrolledId(null);
    }
    // eslint-disable-next-line
  }, [data, loading, targetScrolledId]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchData(newPage);
      if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
    }
  };

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(columnKey);
      setSortOrder('ASC');
    }
  };

  const renderSortIcon = (columnKey) => {
    if (sortBy !== columnKey) return <ArrowUpDown className="h-4 w-4 text-gray-300 ml-1" />;
    return sortOrder === 'ASC' ? <ArrowUp className="h-4 w-4 text-[#8b4513] ml-1" /> : <ArrowDown className="h-4 w-4 text-[#8b4513] ml-1" />;
  };

  const handleRowClick = async (idFuoco) => {
    if (expandedId === idFuoco) {
      setExpandedId(null);
      setParentiData([]);
      return;
    }
    setExpandedId(idFuoco);
    setLoadingParenti(true);
    setParentiData([]); 

    try {
      const response = await fetch(`${API_URL}/api/parenti/${idFuoco}`);
      if (!response.ok) throw new Error('Errore parenti');
      const result = await response.json();
      setParentiData(result);
    } catch (err) { console.error(err); } 
    finally { setLoadingParenti(false); }
  };

  const handleSidebarClick = (idFuoco) => {
    // Chiudi la sidebar su mobile quando si clicca un elemento
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    const index = sidebarData.findIndex(item => item.id === idFuoco);
    if (index !== -1) {
      const targetPage = Math.floor(index / ROWS_PER_PAGE) + 1;
      if (targetPage === page) {
        const rowElement = tableRowsRef.current[idFuoco];
        if (rowElement) rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        handleRowClick(idFuoco);
      } else {
        setTargetScrolledId(idFuoco);
        handlePageChange(targetPage);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8f5f2] text-slate-800 font-serif overflow-hidden">
      
      {/* HEADER RESPONSIVE */}
      <header className="bg-[#8b4513] text-[#f8f5f2] shadow-md border-b-4 border-[#5d2e0c] flex-shrink-0 z-20 h-16 md:h-20 transition-all">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Tasto Menu Mobile */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 bg-[#6e360f] rounded hover:bg-[#5d2e0c] transition-colors mr-1 md:mr-2 focus:outline-none focus:ring-2 focus:ring-[#e6c288]"
              title={isSidebarOpen ? "Chiudi Indice" : "Apri Indice"}
            >
              {isSidebarOpen ? <X className="h-5 w-5 md:h-6 md:w-6 text-[#e6c288]" /> : <Menu className="h-5 w-5 md:h-6 md:w-6 text-[#e6c288]" />}
            </button>
            
            <Scroll className="h-6 w-6 md:h-8 md:w-8 text-[#e6c288]" />
            <div>
              <h1 className="text-lg md:text-2xl font-bold tracking-wide font-serif leading-tight">Catasto Fiorentino del 1427/30</h1>
              <p className="text-[10px] md:text-xs text-[#e6c288] uppercase tracking-wider hidden sm:block">Sistema di Consultazione</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] md:text-xs bg-[#5d2e0c] px-2 py-1 md:px-3 rounded text-[#e6c288] whitespace-nowrap">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="hidden sm:inline">Server</span> Live
          </div>
        </div>
      </header>

      {/* LAYOUT PRINCIPALE */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* BACKDROP PER MOBILE (Chiude sidebar cliccando fuori) */}
        {isSidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/30 z-30 md:hidden backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR RESPONSIVE (Overlay su mobile, Static su desktop) */}
        <aside 
          className={`
            bg-[#fffbf5] border-r border-[#d3c4b1] flex flex-col 
            transition-all duration-300 ease-in-out 
            absolute top-0 left-0 bottom-0 z-40 shadow-2xl md:shadow-none md:static
            ${isSidebarOpen ? 'w-[80%] sm:w-72 translate-x-0' : 'w-0 -translate-x-full opacity-0 md:w-0'}
          `}
        >
          <div className="p-4 bg-[#eae0d5] border-b border-[#d3c4b1] flex items-center justify-between whitespace-nowrap overflow-hidden">
            <h3 className="font-bold text-[#5d2e0c] uppercase text-xs tracking-wider flex items-center gap-2">
              <List className="h-4 w-4 flex-shrink-0" /> Indice ({totalRecords})
            </h3>
            <button onClick={() => setIsSidebarOpen(false)} className="text-[#8b4513] hover:text-[#5d2e0c] p-1">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sidebarLoading ? (
              <div className="p-4 text-center text-sm text-gray-500 italic">Caricamento indice...</div>
            ) : sidebarData.length > 0 ? (
              sidebarData.map((row) => (
                <button 
                  key={`idx-${row.id}`} 
                  onClick={() => handleSidebarClick(row.id)} 
                  className={`
                    w-full text-left p-2 rounded text-sm transition-colors border border-transparent
                    ${expandedId === row.id || targetScrolledId === row.id 
                      ? 'bg-[#8b4513] text-white border-[#5d2e0c] shadow-sm' 
                      : 'hover:bg-[#e6dbcf] text-[#2c1810] border-b-gray-100'}
                  `}
                >
                  <div className="font-bold truncate font-serif">{row.nome}</div>
                  <div className={`text-xs truncate ${expandedId === row.id || targetScrolledId === row.id ? 'text-[#e6c288]' : 'text-gray-500'}`}>
                    {row.mestiere || "Nessun mestiere"}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-gray-400">Nessun risultato.</div>
            )}
          </div>
        </aside>

        {/* CONTENUTO PRINCIPALE */}
        <div ref={mainContentRef} className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8 relative w-full">
          
          {/* PANNELLO FILTRI */}
          <div className="bg-white rounded-sm shadow-lg border border-[#d3c4b1] mb-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8b4513] to-[#cd853f]"></div>
             <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-end mb-4">
                  <div className="flex-1 w-full">
                    <label className="block text-xs md:text-sm font-semibold text-[#5d2e0c] mb-1 md:mb-2 uppercase tracking-wider">Cerca Persona</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="text" className="block w-full pl-9 md:pl-10 pr-3 py-2 md:py-3 border border-[#d3c4b1] bg-[#faf9f8] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8b4513] font-serif text-base md:text-lg" placeholder="Nome capofamiglia..." value={searchPersona} onChange={(e) => setSearchPersona(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs md:text-sm font-semibold text-[#5d2e0c] mb-1 md:mb-2 uppercase tracking-wider">Cerca Località</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="text" className="block w-full pl-9 md:pl-10 pr-3 py-2 md:py-3 border border-[#d3c4b1] bg-[#faf9f8] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8b4513] font-serif text-base md:text-lg" placeholder="Quartiere, Popolo..." value={searchLocalita} onChange={(e) => setSearchLocalita(e.target.value)} />
                    </div>
                  </div>
                  <button onClick={() => fetchData(1)} className="w-full md:w-auto p-2 md:p-3 border border-[#8b4513] bg-[#8b4513] text-white hover:bg-[#6e360f] transition-all shadow-sm flex justify-center" title="Aggiorna Ricerca"><RefreshCw className={`h-5 w-5 md:h-6 md:w-6 ${loading ? 'animate-spin' : ''}`} /></button>
                </div>

                <div className="flex justify-start mb-2">
                  <button onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="flex items-center gap-2 text-[#8b4513] font-bold text-xs md:text-sm uppercase tracking-wider hover:underline focus:outline-none">
                    <Filter className="h-4 w-4" />{isFiltersOpen ? "Nascondi Filtri" : "Mostra Filtri Avanzati"}
                    {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {isFiltersOpen && (
                  <div className="bg-[#fcf9f5] border border-[#e5e0d8] rounded p-3 md:p-4 mt-2 transition-all duration-300 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="col-span-1"><label className="block text-xs font-semibold text-gray-600 mb-1">Mestiere</label><div className="relative"><Briefcase className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" /><input type="text" className="block w-full pl-8 pr-2 py-2 border border-[#d3c4b1] bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-sm" placeholder="Es. Fabbro" value={filterMestiere} onChange={(e) => setFilterMestiere(e.target.value)} /></div></div>
                      <div className="col-span-1"><label className="block text-xs font-semibold text-gray-600 mb-1">Rapporto Mestiere</label><div className="relative"><Hammer className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" /><select value={filterRapporto} onChange={(e) => setFilterRapporto(e.target.value)} className="block w-full pl-8 pr-2 py-2 border border-[#d3c4b1] bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-sm appearance-none"><option value="">Tutti</option>{rapportoOptions.map(opt => (<option key={opt.id} value={opt.id}>{opt.label}</option>))}</select></div></div>
                      <div className="col-span-1"><label className="block text-xs font-semibold text-gray-600 mb-1">Bestiame</label><div className="relative"><PawPrint className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" /><select value={filterBestiame} onChange={(e) => setFilterBestiame(e.target.value)} className="block w-full pl-8 pr-2 py-2 border border-[#d3c4b1] bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-sm appearance-none"><option value="">Tutti</option>{bestiameOptions.map(opt => (<option key={opt.id} value={opt.id}>{opt.label}</option>))}</select></div></div>
                      <div className="col-span-1"><label className="block text-xs font-semibold text-gray-600 mb-1">Immigrazione</label><div className="relative"><Flag className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" /><select value={filterImmigrazione} onChange={(e) => setFilterImmigrazione(e.target.value)} className="block w-full pl-8 pr-2 py-2 border border-[#d3c4b1] bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513] text-sm appearance-none"><option value="">Tutti</option>{immigrazioneOptions.map(opt => (<option key={opt.id} value={opt.id}>{opt.label}</option>))}</select></div></div>
                    </div>
                    <div className="border-t border-[#e5e0d8] pt-4">
                      <div className="text-[#8b4513] font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2"><Calculator className="h-4 w-4"/> Dati Economici (Range in Fiorini)</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Fortune</label><div className="flex items-center gap-2"><input type="number" placeholder="Min" className="w-full px-2 py-2 border border-[#d3c4b1] bg-white text-sm" value={filterFortuneMin} onChange={(e) => setFilterFortuneMin(e.target.value)} /><span className="text-gray-400">-</span><input type="number" placeholder="Max" className="w-full px-2 py-2 border border-[#d3c4b1] bg-white text-sm" value={filterFortuneMax} onChange={(e) => setFilterFortuneMax(e.target.value)} /></div></div>
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Credito</label><div className="flex items-center gap-2"><input type="number" placeholder="Min" className="w-full px-2 py-2 border border-[#d3c4b1] bg-white text-sm" value={filterCreditoMin} onChange={(e) => setFilterCreditoMin(e.target.value)} /><span className="text-gray-400">-</span><input type="number" placeholder="Max" className="w-full px-2 py-2 border border-[#d3c4b1] bg-white text-sm" value={filterCreditoMax} onChange={(e) => setFilterCreditoMax(e.target.value)} /></div></div>
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Credito ai Monti</label><div className="flex items-center gap-2"><input type="number" placeholder="Min" className="w-full px-2 py-2 border border-[#d3c4b1] bg-white text-sm" value={filterCreditoMMin} onChange={(e) => setFilterCreditoMMin(e.target.value)} /><span className="text-gray-400">-</span><input type="number" placeholder="Max" className="w-full px-2 py-2 border border-[#d3c4b1] bg-white text-sm" value={filterCreditoMMax} onChange={(e) => setFilterCreditoMMax(e.target.value)} /></div></div>
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Imponibile</label><div className="flex items-center gap-2"><input type="number" placeholder="Min" className="w-full px-2 py-2 border border-[#d3c4b1] bg-white text-sm" value={filterImponibileMin} onChange={(e) => setFilterImponibileMin(e.target.value)} /><span className="text-gray-400">-</span><input type="number" placeholder="Max" className="w-full px-2 py-2 border border-[#d3c4b1] bg-white text-sm" value={filterImponibileMax} onChange={(e) => setFilterImponibileMax(e.target.value)} /></div></div>
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Deduzioni</label><div className="flex items-center gap-2"><input type="number" placeholder="Min" className="w-full px-2 py-2 border border-[#d3c4b1] bg-white text-sm" value={filterDeduzioniMin} onChange={(e) => setFilterDeduzioniMin(e.target.value)} /><span className="text-gray-400">-</span><input type="number" placeholder="Max" className="w-full px-2 py-2 border border-[#d3c4b1] bg-white text-sm" value={filterDeduzioniMax} onChange={(e) => setFilterDeduzioniMax(e.target.value)} /></div></div>
                      </div>
                    </div>
                  </div>
                )}
             </div>
          </div>

          {/* TABELLA RESPONSIVE */}
          <div className="space-y-4 pb-12">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-[#d3c4b1] pb-2 gap-2">
              <h2 className="text-lg md:text-xl font-bold text-[#5d2e0c] flex items-center gap-2 font-serif">
                <BookOpen className="h-5 w-5 md:h-6 md:w-6" /> Registri Fuochi
              </h2>
              <span className="bg-[#e6c288] text-[#5d2e0c] px-2 py-1 md:px-3 text-xs md:text-sm font-bold rounded-full">
                {totalRecords} Risultati
              </span>
            </div>

            {error ? (
              <div className="bg-red-50 border-l-4 border-red-800 p-4 text-red-900 font-serif">
                <p className="font-bold">Errore Server</p><p>{error}</p>
              </div>
            ) : (
              <div className="bg-white shadow-lg border border-[#d3c4b1]">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#e5e0d8]">
                    <thead className="bg-[#f0ece6]">
                      <tr>
                        {/* Intestazioni compatte per mobile (px-3 py-3) */}
                        <th onClick={() => handleSort('nome')} className="px-3 py-3 md:px-6 md:py-4 text-left text-xs font-bold text-[#5d2e0c] uppercase tracking-wider font-sans cursor-pointer hover:bg-[#e6dbcf] group">
                          <div className="flex items-center gap-1">Capofamiglia{renderSortIcon('nome')}</div>
                        </th>
                        <th onClick={() => handleSort('localita')} className="px-3 py-3 md:px-6 md:py-4 text-left text-xs font-bold text-[#5d2e0c] uppercase tracking-wider font-sans cursor-pointer hover:bg-[#e6dbcf] group">
                          <div className="flex items-center gap-1">Località{renderSortIcon('localita')}</div>
                        </th>
                        <th onClick={() => handleSort('fortune')} className="px-3 py-3 md:px-6 md:py-4 text-left text-xs font-bold text-[#5d2e0c] uppercase tracking-wider font-sans cursor-pointer hover:bg-[#e6dbcf] group">
                          <div className="flex items-center gap-1">Dati Sintetici{renderSortIcon('fortune')}</div>
                        </th>
                        <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-bold text-[#5d2e0c] uppercase tracking-wider font-sans">
                          Riferimenti
                        </th>
                        <th className="px-3 py-3 md:px-6 md:py-4 w-8 md:w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#e5e0d8]">
                      {loading ? (
                        [...Array(5)].map((_, i) => (<tr key={i} className="animate-pulse"><td className="px-6 py-4" colSpan="5"><div className="h-8 bg-gray-200 rounded"></div></td></tr>))
                      ) : data.length > 0 ? (
                        data.map((row) => (
                          <React.Fragment key={row.id}>
                            <tr 
                              ref={el => tableRowsRef.current[row.id] = el}
                              onClick={() => handleRowClick(row.id)} 
                              className={`cursor-pointer transition-colors border-b border-gray-100 ${expandedId === row.id ? 'bg-[#fffbf5] border-l-4 border-l-[#8b4513]' : 'hover:bg-[#faf7f2]'}`}
                            >
                              <td className="px-3 py-3 md:px-6 md:py-4">
                                <div className="flex flex-col justify-center">
                                  <div className="text-base md:text-lg font-medium text-[#2c1810] font-serif leading-tight">{row.nome}</div>
                                  <div className="text-xs text-gray-500 flex items-center gap-1 font-sans mt-1">
                                    <Briefcase className="h-3 w-3" /> {row.mestiere || "Nessun mestiere"}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 md:px-6 md:py-4">
                                <div className="flex flex-col gap-1 text-xs md:text-sm">
                                  <div className="font-bold text-[#5d2e0c] flex items-center gap-1">
                                    <Layers className="h-3 w-3" /> {row.serie || "Serie N/D"}
                                  </div>
                                  <div className="text-gray-700 ml-2 border-l-2 border-gray-300 pl-2">{row.quartiere}</div>
                                  <div className="text-gray-600 ml-2 border-l-2 border-gray-300 pl-2 italic text-[10px] md:text-xs">
                                    {row.piviere} &raquo; {row.popolo}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 md:px-6 md:py-4">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1 text-[#8b4513] font-bold font-serif text-sm md:text-base">
                                    <Coins className="h-3 w-3 md:h-4 md:w-4" />
                                    {row.fortune ? row.fortune.toLocaleString() : 0} 
                                    <span className="hidden md:inline"> fiorini</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-600 font-sans">
                                    <Home className="h-3 w-3" /> {row.casa || "N/D"}
                                  </div>
                                  {/* Riferimenti visibili su mobile qui sotto */}
                                  <div className="md:hidden flex items-center gap-2 text-[10px] text-[#5d2e0c] font-mono bg-[#f4f1ec] px-1 rounded w-fit border border-[#e5e0d8] mt-1">
                                    <span>Vol. {row.volume}</span><span>c. {row.foglio}</span>
                                  </div>
                                </div>
                              </td>
                              
                              {/* Cella Riferimenti (Desktop only) */}
                              <td className="hidden md:table-cell px-6 py-4">
                                <div className="flex flex-col gap-1 text-sm text-[#5d2e0c] font-mono bg-[#f4f1ec] p-2 rounded w-fit border border-[#e5e0d8]">
                                  <div className="flex items-center gap-2"><Bookmark className="h-3 w-3 text-[#8b4513]" /><span className="font-bold">Vol.</span> {row.volume || '?'}</div>
                                  <div className="flex items-center gap-2"><FileText className="h-3 w-3 text-[#8b4513]" /><span className="font-bold">c.</span> {row.foglio || '?'}</div>
                                </div>
                              </td>

                              <td className="px-2 py-3 md:px-6 md:py-4 text-right">
                                {expandedId === row.id ? <ChevronDown className="h-5 w-5 text-[#8b4513]" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
                              </td>
                            </tr>

                            {/* DETTAGLI ESPANSI */}
                            {expandedId === row.id && (
                              <tr className="bg-[#fffbf5]">
                                <td colSpan="5" className="px-4 py-4 md:px-6 md:py-6 border-b-2 border-[#e6c288]">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                    <div>
                                      <h3 className="text-xs md:text-sm font-bold text-[#5d2e0c] uppercase tracking-wider mb-2 md:mb-3 flex items-center gap-2 border-b border-[#e6c288] pb-1"><Info className="h-4 w-4" /> Dettagli Economici</h3>
                                      <div className="bg-white p-3 md:p-4 rounded border border-[#d3c4b1] shadow-sm space-y-3 md:space-y-4 text-xs md:text-sm">
                                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                                          <div><span className="text-[10px] md:text-xs text-gray-500 uppercase block">Credito</span><span className="font-bold text-[#2c1810]">{row.credito || 0} fiorini</span></div>
                                          <div><span className="text-[10px] md:text-xs text-gray-500 uppercase block">Credito ai Monti</span><span className="font-bold text-[#2c1810]">{row.credito_m || 0} fiorini</span></div>
                                          <div><span className="text-[10px] md:text-xs text-gray-500 uppercase block">Fortune</span><span className="font-bold text-[#2c1810]">{row.fortune || 0} fiorini</span></div>
                                          <div><span className="text-[10px] md:text-xs text-gray-500 uppercase block">Deduzioni</span><span className="font-bold text-[#2c1810]">{row.deduzioni || 0} fiorini</span></div>
                                          <div><span className="text-[10px] md:text-xs text-gray-500 uppercase block">Imponibile Totale</span><span className="font-bold text-[#8b4513] text-base md:text-lg">{row.imponibile || 0} fiorini</span></div>
                                        </div>
                                        <div className="pt-2 border-t border-dashed border-gray-300 space-y-2">
                                          <div className="flex items-start gap-2"><PawPrint className="h-4 w-4 text-[#8b4513] mt-0.5 flex-shrink-0" /><div><span className="text-[10px] md:text-xs text-gray-500 uppercase block">Bestiame</span>{row.bestiame || "Nessun dato"}</div></div>
                                          <div className="flex items-start gap-2"><Flag className="h-4 w-4 text-[#8b4513] mt-0.5 flex-shrink-0" /><div><span className="text-[10px] md:text-xs text-gray-500 uppercase block">Immigrazione</span>{row.immigrazione || "Nessun dato"}</div></div>
                                          <div className="flex items-start gap-2"><Hammer className="h-4 w-4 text-[#8b4513] mt-0.5 flex-shrink-0" /><div><span className="text-[10px] md:text-xs text-gray-500 uppercase block">Rapporto Mestiere</span>{row.rapporto_mestiere || "Nessun dato"}</div></div>
                                        </div>
                                        <div className="pt-2 border-t border-dashed border-gray-300"><span className="text-[10px] md:text-xs text-gray-500 uppercase block mb-1">Particolarità Fuoco</span><p className="italic text-gray-700 bg-gray-50 p-2 rounded">{row.particolarita_fuoco || "Nessuna particolarità registrata."}</p></div>
                                      </div>
                                    </div>
                                    <div>
                                      <h3 className="text-xs md:text-sm font-bold text-[#5d2e0c] uppercase tracking-wider mb-2 md:mb-3 flex items-center gap-2 border-b border-[#e6c288] pb-1"><Users className="h-4 w-4" /> Composizione Familiare</h3>
                                      {loadingParenti ? (
                                        <div className="text-sm text-gray-500 italic">Caricamento...</div>
                                      ) : parentiData.length > 0 ? (
                                        <div className="overflow-hidden border border-[#d3c4b1] rounded-md bg-white">
                                          <table className="min-w-full divide-y divide-[#d3c4b1]">
                                            <thead className="bg-[#eae0d5]">
                                              <tr>
                                                <th className="px-2 py-2 text-left text-[10px] md:text-xs font-medium text-[#5d2e0c] uppercase">Parente</th>
                                                <th className="px-2 py-2 text-left text-[10px] md:text-xs font-medium text-[#5d2e0c] uppercase">Età</th>
                                                <th className="px-2 py-2 text-left text-[10px] md:text-xs font-medium text-[#5d2e0c] uppercase">Stato</th>
                                              </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-[#e5e0d8]">
                                              {parentiData.map((parente, idx) => (
                                                <tr key={idx} className="text-xs md:text-sm text-gray-700">
                                                  <td className="px-2 py-2 font-medium">
                                                    {parente.parentela_desc || "Membro"}
                                                    {parente.sesso && <span className="text-[10px] text-gray-400 ml-1">({parente.sesso})</span>}
                                                  </td>
                                                  <td className="px-2 py-2">{parente.eta ? parente.eta : '-'}</td>
                                                  <td className="px-2 py-2">
                                                    <div className="flex flex-col">
                                                      <span>{parente.stato_civile}</span>
                                                      <span className="text-[10px] italic text-gray-500">{parente.particolarita}</span>
                                                    </div>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <div className="text-xs md:text-sm text-gray-500 italic p-3 border border-dashed border-gray-300 rounded bg-gray-50">Nessun parente registrato.</div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">Nessun dato trovato.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* PAGINAZIONE */}
                {data.length > 0 && (
                  <div className="bg-[#f0ece6] px-4 py-3 md:px-6 md:py-4 border-t border-[#d3c4b1] flex items-center justify-between">
                    <button onClick={() => handlePageChange(page - 1)} disabled={page === 1 || loading} className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded text-xs md:text-sm font-bold transition-colors ${page === 1 ? 'text-gray-400 cursor-not-allowed bg-transparent' : 'text-[#8b4513] hover:bg-[#e6c288] bg-white border border-[#d3c4b1]'}`}><ArrowLeft className="h-3 w-3 md:h-4 md:w-4" /> <span className="hidden sm:inline">Precedente</span></button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm font-serif text-[#5d2e0c]">Pagina</span>
                      <select value={page} onChange={(e) => handlePageChange(Number(e.target.value))} className="border border-[#d3c4b1] rounded px-1 md:px-2 py-1 bg-white text-[#8b4513] font-bold text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-[#8b4513]">{Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (<option key={pageNum} value={pageNum}>{pageNum}</option>))}</select>
                      <span className="text-xs md:text-sm font-serif text-[#5d2e0c]">di <b>{totalPages}</b></span>
                    </div>
                    <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages || loading} className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded text-xs md:text-sm font-bold transition-colors ${page === totalPages ? 'text-gray-400 cursor-not-allowed bg-transparent' : 'text-[#8b4513] hover:bg-[#e6c288] bg-white border border-[#d3c4b1]'}`}><span className="hidden sm:inline">Successivo</span> <ArrowRight className="h-3 w-3 md:h-4 md:w-4" /></button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}