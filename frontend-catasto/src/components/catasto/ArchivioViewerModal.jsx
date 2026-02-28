import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, Maximize, AlertCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_URL } from '../../api/client';

const SPLIT_VOLUMES = {
  18: { part1: { max: 1187, id: '2722381' }, part2: { min: 1188, id: '2722382' } },
  29: { part1: { max: 354, id: '2722355' }, part2: { min: 355, id: '2722356' } },
  35: { part1: { max: 1088, id: '2722362' }, part2: { min: 1089, id: '2722363' } },
  41: { part1: { max: 388, id: '2722369' }, part2: { min: 389, id: '2722370' } },
  46: { part1: { max: 463, id: '2722375' }, part2: { min: 464, id: '2722376' } },
  78: { part1: { max: 304, id: '2722319' }, part2: { min: 305, id: '2722320' } },
  80: { part1: { max: 337, id: '2722322' }, part2: { min: 338, id: '2722323' } },
  125: { part1: { max: 508, id: '2722410' }, part2: { min: 509, id: '2722411' } },
  193: { part1: { max: 328, id: '2722408' }, part2: { min: 329, id: '2722409' } },
};

const ArchivioViewerModal = ({ isOpen, onClose, codiceArchivio, foglio, volume, nome }) => {
  const [pages, setPages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  
  // Per lo zoom manuale essenziale
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartInfo = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  useEffect(() => {
    if (isOpen && codiceArchivio) {
      setImageLoading(true);
      fetchManifest();
      // Reset zoom state
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setPages([]);
      setCurrentIndex(0);
      setError(null);
    }
  }, [isOpen, codiceArchivio, foglio]);

  const fetchManifest = async () => {
    setLoading(true);
    setError(null);
    try {
      let activeCodice = codiceArchivio;
      
      const volNum = String(volume).trim();
      if (SPLIT_VOLUMES[volNum] && foglio) {
         const foglioNum = parseInt(String(foglio).replace(/\D/g, ''), 10);
         if (!isNaN(foglioNum)) {
            const rules = SPLIT_VOLUMES[volNum];
            if (foglioNum <= rules.part1.max) {
               activeCodice = rules.part1.id;
            } else if (foglioNum >= rules.part2.min) {
               activeCodice = rules.part2.id;
            }
         }
      }

      const manifestUrl = `${API_URL}/api/catasto/manifest/${activeCodice}`;
      const response = await fetch(manifestUrl);
      
      if (!response.ok) {
        throw new Error('Impossibile scaricare le informazioni del volume dall\'Archivio di Stato.');
      }
      
      const data = await response.json();
      const canvases = data?.sequences?.[0]?.canvases;
      
      if (!canvases || canvases.length === 0) {
         throw new Error('Il volume risulta vuoto o privo di pagine digitalizzate.');
      }

      // 1. Cerchiamo la pagina esatta (foglio). Spesso c'è un match in label.
      // Esempio label: "Cat_15_0053_C_0042" dove "0042" potrebbe essere il foglio.
      // Spesso sono padding a 4 zeri.
      let targetCanvas = null;
      if (foglio) {
        const foglioStr = String(foglio).trim();
        const paddedFoglio = foglioStr.padStart(4, '0'); // es. "130" -> "0130"
        
        targetCanvas = canvases.find(c => {
          // Puliamo la stringa da eventuali estensioni finali e mettiamo in minuscolo
          let lbl = (c.label || '').toLowerCase().replace(/\.[a-z]{3,4}$/, '').trim();
          
          // Esempi: "cat_67_0169_registro_c_0130", "cat_15_0053_c_0042"
          // Verifichiamo se finisce con la versione del foglio (con o senza zeri o underscore)
          return lbl.endsWith('_' + paddedFoglio) ||
                 lbl.endsWith(paddedFoglio) ||
                 lbl.endsWith('_' + foglioStr) ||
                 lbl.endsWith(foglioStr);
        });
      }

      // Se non trova il foglio esatto, prova col primo o mostra un messaggio generico ma apre comunque il primo
      if (!targetCanvas) {
         // Fallback: visualizza la prima pagina
         targetCanvas = canvases[0];
         console.warn(`Foglio ${foglio} non trovato esattamente nel manifest, mostro la pagina 1.`);
      }

      // Estrai l'attuale + le prossime 3 pagine (totale 4)
      const startIndex = canvases.indexOf(targetCanvas);
      const pagesToLoad = canvases.slice(startIndex, startIndex + 4).map((c, i) => {
         return {
            id: c.images?.[0]?.resource?.['@id'],
            label: c.label || `Pag. ${i+1}`
         };
      }).filter(p => p.id);
      
      if (pagesToLoad.length > 0) {
        setPages(pagesToLoad);
        setCurrentIndex(0);
        setImageLoading(true);
      } else {
        throw new Error('Impossibile recuperare l\'URL dell\'immagine per questa pagina.');
      }

    } catch (err) {
      console.error("Errore fetch manifest IIIF:", err);
      setError(err.message || 'Errore sconosciuto durante il caricamento del manoscritto.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const imageUrl = pages[currentIndex]?.id;

  // Handler per Drag & Drop Zoom
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartInfo.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartInfo.current.x;
    const dy = e.clientY - dragStartInfo.current.y;
    setPosition({
      x: dragStartInfo.current.posX + dx,
      y: dragStartInfo.current.posY + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleZoomIn = () => setScale(s => Math.min(s + 0.3, 5));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.3, 0.2));
  const handleResetZoom = () => { setScale(1); setPosition({x:0, y:0}); };

  const handleWheel = (e) => {
    const zoomSensitivity = 0.002;
    setScale(s => {
      const newScale = s - e.deltaY * zoomSensitivity;
      return Math.min(Math.max(newScale, 0.2), 5); 
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-main/90 backdrop-blur-sm p-4">
      <div className="bg-bg-table border border-border-base shadow-2xl rounded-lg w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header Modale */}
        <div className="flex items-center justify-between p-4 border-b border-border-base bg-bg-sidebar">
          <div className="flex flex-col">
            <h2 className="text-xl font-serif font-bold text-item-selected flex items-center gap-2">
              <BookOpenIcon strokeWidth={2} className="h-5 w-5" />
              Archivio di Stato - Volume {volume || '?'}, Foglio {foglio || '?'}
            </h2>
            {nome && (
              <p className="text-sm text-text-main font-semibold mt-1">
                Intestatario: {nome}
              </p>
            )}
            <p className="text-[10px] md:text-xs text-text-accent font-mono mt-1 opacity-80">
              ID Archivio: {codiceArchivio}
            </p>
          </div>
          <button  
            title="Chiudi Visore"
            onClick={onClose} 
            className="text-text-main hover:text-red-500 hover:bg-border-base/50 p-2 rounded transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative bg-[#1e1e1e] overflow-hidden flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-main z-10 bg-[#1e1e1e]/80">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-item-selected mb-4"></div>
               <p className="font-mono text-sm animate-pulse text-white/80">Recupero informazioni manoscritto...</p>
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-sidebar p-8 text-center z-10">
               <AlertCircle className="h-16 w-16 text-orange-500 mb-4" />
               <h3 className="text-xl font-bold text-text-main mb-2">Impossibile visualizzare il foglio</h3>
               <p className="text-text-accent max-w-md">{error}</p>
               
               <a 
                 href={`https://archiviodigitale-icar.cultura.gov.it/it/185/ricerca/detail/${codiceArchivio}`}
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="mt-6 flex items-center gap-2 bg-item-selected text-bg-main px-4 py-2 rounded font-bold hover:brightness-110 transition-all"
               >
                 <span>Apri sul sito dell'Archivio</span>
                 <ExternalLink className="h-4 w-4" />
               </a>
            </div>
          )}

           {imageUrl && !loading && !error && (
            <div 
               className="w-full h-full cursor-grab active:cursor-grabbing relative flex items-center justify-center overflow-hidden select-none"
               onMouseDown={handleMouseDown}
               onMouseMove={handleMouseMove}
               onMouseUp={handleMouseUp}
               onMouseLeave={handleMouseUp}
               onWheel={handleWheel}
            >
              {/* Image Loading Indicator */}
              {imageLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e1e1e]/50 z-10 pointer-events-none">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-item-selected mb-2"></div>
                  <p className="text-xs text-text-accent font-mono animate-pulse drop-shadow-md">Caricamento immagine in corso...</p>
                </div>
              )}

              <img 
                src={imageUrl} 
                alt={`Volume ${volume}, Foglio ${foglio}`}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out, opacity 0.3s',
                  transformOrigin: 'center center',
                  opacity: imageLoading ? 0.4 : 1
                }}
                className="max-w-full max-h-full object-contain pointer-events-none select-none"
                draggable={false}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />

              {/* Freccette di navigazione laterali */}
              {pages.length > 1 && currentIndex > 0 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageLoading(true);
                    setCurrentIndex(currentIndex - 1);
                    handleResetZoom();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-bg-sidebar/80 hover:bg-item-selected text-text-main hover:text-bg-main p-3 rounded-full shadow-lg backdrop-blur-sm transition-colors z-20 pointer-events-auto"
                  title="Pagina Precedente"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
              )}

              {pages.length > 1 && currentIndex < pages.length - 1 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageLoading(true);
                    setCurrentIndex(currentIndex + 1);
                    handleResetZoom();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-bg-sidebar/80 hover:bg-item-selected text-text-main hover:text-bg-main p-3 rounded-full shadow-lg backdrop-blur-sm transition-colors z-20 pointer-events-auto"
                  title="Pagina Successiva"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              )}

              {/* Preload delle pagine successive di nascosto per velocizzare la transizione */}
              <div className="hidden">
                 {pages.map((p, i) => (
                   i !== currentIndex && <img key={`preload-${i}`} src={p.id} alt={`preload-${i}`} />
                 ))}
              </div>
            </div>
          )}
        </div>

        {/* Paginazione Pagine Successive */}
        {!loading && !error && pages.length > 1 && (
          <div className="bg-bg-main border-t border-border-base p-2 flex items-center gap-2 overflow-x-auto">
             <span className="text-xs text-text-accent font-semibold ml-2 whitespace-nowrap">Pagine:</span>
             {pages.map((p, idx) => (
                <button 
                  key={idx}
                  onClick={() => { 
                     if (idx !== currentIndex) {
                        setImageLoading(true);
                        setCurrentIndex(idx); 
                        handleResetZoom();
                     }
                  }}
                  className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap ${idx === currentIndex ? 'bg-item-selected text-bg-main font-bold shadow-md' : 'bg-bg-sidebar text-text-main border border-border-base hover:bg-border-base'}`}
                >
                  {idx === 0 ? 'Attuale' : `Succ. ${idx}`}
                </button>
             ))}
          </div>
        )}

        {/* Toolbar Footer (Zoom Controls) */}
        {!loading && !error && imageUrl && (
          <div className="bg-bg-sidebar border-t border-border-base p-3 flex items-center justify-center gap-4">
             <button onClick={handleZoomOut} className="p-2 hover:bg-border-base rounded text-text-main transition-colors" title="Zoom Out">
               <ZoomOut className="h-5 w-5" />
             </button>
             <span className="text-text-accent font-mono text-sm min-w-[3rem] text-center">
               {Math.round(scale * 100)}%
             </span>
             <button onClick={handleZoomIn} className="p-2 hover:bg-border-base rounded text-text-main transition-colors" title="Zoom In">
               <ZoomIn className="h-5 w-5" />
             </button>
             <div className="w-px h-6 bg-border-base mx-2"></div>
             <button onClick={handleResetZoom} className="p-2 hover:bg-border-base rounded text-text-main transition-colors flex items-center gap-2 text-sm" title="Reimposta Zoom">
               <Maximize className="h-4 w-4" />
               <span className="hidden sm:inline">Adatta</span>
             </button>

             <div className="ml-auto">
                <a 
                  href={`https://archiviodigitale-icar.cultura.gov.it/it/185/ricerca/detail/${codiceArchivio}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-item-selected hover:underline flex items-center gap-1 opacity-80"
                >
                  <ExternalLink className="h-3 w-3" />
                  Sito Originale
                </a>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Semplice SVG Icona libro
const BookOpenIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
)

export default ArchivioViewerModal;
