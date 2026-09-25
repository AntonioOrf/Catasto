import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Maximize, AlertCircle, ExternalLink, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { API_URL } from '../../../api/client';
import { useModal } from '../../../hooks/useModal';

const SPLIT_VOLUMES: Record<string, { part1: { max: number; id: string }; part2: { min: number; id: string } }> = {
  '18': { part1: { max: 1187, id: '2722381' }, part2: { min: 1188, id: '2722382' } },
  '29': { part1: { max: 354, id: '2722355' }, part2: { min: 355, id: '2722356' } },
  '35': { part1: { max: 1088, id: '2722362' }, part2: { min: 1089, id: '2722363' } },
  '41': { part1: { max: 388, id: '2722369' }, part2: { min: 389, id: '2722370' } },
  '46': { part1: { max: 463, id: '2722375' }, part2: { min: 464, id: '2722376' } },
  '78': { part1: { max: 304, id: '2722319' }, part2: { min: 305, id: '2722320' } },
  '80': { part1: { max: 337, id: '2722322' }, part2: { min: 338, id: '2722323' } },
  '125': { part1: { max: 508, id: '2722410' }, part2: { min: 509, id: '2722411' } },
  '193': { part1: { max: 328, id: '2722408' }, part2: { min: 329, id: '2722409' } },
};

interface Page {
  id: string;
  label: string;
}

interface ArchivioViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  codiceArchivio: string;
  foglio: string | number;
  volume: string | number;
  nome: string;
  /** Apre la segnalazione della segnatura con volume/foglio correnti già noti. */
  onSegnalaSegnatura?: () => void;
}

const getIiifImageUrl = (url: string, width?: number) => {
  if (!url) return '';
  if (width && url.includes('/full/full/0/default.jpg')) {
    return url.replace('/full/full/0/default.jpg', `/full/${width},/0/default.jpg`);
  }
  return url;
};

const ArchivioViewerModal: React.FC<ArchivioViewerModalProps> = ({ isOpen, onClose, codiceArchivio, foglio, volume, nome, onSegnalaSegnatura }) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedCodice, setResolvedCodice] = useState<string>(codiceArchivio);
  const [useHighRes, setUseHighRes] = useState(false);
  
  // Per lo zoom manuale essenziale
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartInfo = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const touchStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageUrl = pages[currentIndex]?.id;
  const activeImageUrl = useHighRes ? imageUrl : getIiifImageUrl(imageUrl, 1600);
  
  const stateRef = useRef({ position, scale, isDragging, pages, currentIndex });
  
  useEffect(() => {
    stateRef.current = { position, scale, isDragging, pages, currentIndex };
  }, [position, scale, isDragging, pages, currentIndex]);

  useEffect(() => {
    if (scale > 1.2) {
      setUseHighRes(true);
    }
  }, [scale]);

  useEffect(() => {
    setUseHighRes(false);
  }, [currentIndex, resolvedCodice]);


  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStartRaw = (e: TouchEvent) => {
      const currentState = stateRef.current;
      if (e.touches.length === 1) {
        setIsDragging(true);
        isDraggingRef.current = true;
        const touch = e.touches[0];
        dragStartInfo.current = {
          x: touch.clientX,
          y: touch.clientY,
          posX: currentState.position.x,
          posY: currentState.position.y
        };
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        initialPinchDistanceRef.current = null;
      } else if (e.touches.length === 2) {
        setIsDragging(false);
        isDraggingRef.current = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
        initialScaleRef.current = currentState.scale;
      }
    };

    const handleTouchMoveRaw = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDraggingRef.current) {
        if (e.cancelable) {
          e.preventDefault();
        }
        const touch = e.touches[0];
        const dx = touch.clientX - dragStartInfo.current.x;
        const dy = touch.clientY - dragStartInfo.current.y;
        setPosition({
          x: dragStartInfo.current.posX + dx,
          y: dragStartInfo.current.posY + dy
        });
      } else if (e.touches.length === 2 && initialPinchDistanceRef.current !== null) {
        if (e.cancelable) {
          e.preventDefault();
        }
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 10) {
          const factor = distance / initialPinchDistanceRef.current;
          const newScale = Math.min(Math.max(initialScaleRef.current * factor, 0.2), 5);
          setScale(newScale);
        }
      }
    };

    const handleTouchEndRaw = (e: TouchEvent) => {
      const currentState = stateRef.current;
      setIsDragging(false);
      isDraggingRef.current = false;
      initialPinchDistanceRef.current = null;

      if (currentState.scale <= 1.1 && e.changedTouches && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;

        if (Math.abs(deltaX) > 80 && Math.abs(deltaY) < 50) {
          if (deltaX > 0) {
            if (currentState.pages.length > 1 && currentState.currentIndex > 0) {
              setImageLoading(true);
              setCurrentIndex(prev => prev - 1);
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }
          } else {
            if (currentState.pages.length > 1 && currentState.currentIndex < currentState.pages.length - 1) {
              setImageLoading(true);
              setCurrentIndex(prev => prev + 1);
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }
          }
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStartRaw, { passive: false });
    container.addEventListener('touchmove', handleTouchMoveRaw, { passive: false });
    container.addEventListener('touchend', handleTouchEndRaw, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStartRaw);
      container.removeEventListener('touchmove', handleTouchMoveRaw);
      container.removeEventListener('touchend', handleTouchEndRaw);
    };
  }, [isOpen, imageUrl, loading]);

  const fetchManifest = useCallback(async () => {
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
      setResolvedCodice(activeCodice);

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
      let targetCanvas = null;
      if (foglio) {
        const foglioStr = String(foglio).trim();
        const paddedFoglio = foglioStr.padStart(4, '0'); // es. "130" -> "0130"

        const matches = canvases.filter((c: any) => {
          const lbl = (c.label || '').toLowerCase().replace(/\.[a-z]{3,4}$/, '').trim();
          return lbl.endsWith('_' + paddedFoglio) ||
                 lbl.endsWith(paddedFoglio) ||
                 lbl.endsWith('_' + foglioStr) ||
                 lbl.endsWith(foglioStr);
        });

        if (matches.length > 0) {
          targetCanvas = matches.find((c: any) => (c.label || '').toLowerCase().includes('registro')) ||
                         matches.find((c: any) => !(c.label || '').toLowerCase().includes('repertorio') && !(c.label || '').toLowerCase().includes('indice')) ||
                         matches[0];
        }
      }

      if (!targetCanvas) {
         targetCanvas = canvases[0];
         console.warn(`Foglio ${foglio} non trovato esattamente nel manifest, mostro la pagina 1.`);
      }

      const startIndex = canvases.indexOf(targetCanvas);
      const pagesToLoad = canvases.slice(startIndex, startIndex + 4).map((c: any, i: number) => {
         return {
            id: c.images?.[0]?.resource?.['@id'],
            label: c.label || `Pag. ${i+1}`
         };
      }).filter((p: any) => p.id);

      if (pagesToLoad.length > 0) {
        setPages(pagesToLoad);
        setCurrentIndex(0);
        setImageLoading(true);
      } else {
        throw new Error('Impossibile recuperare l\'URL dell\'immagine per questa pagina.');
      }

    } catch (err: any) {
      console.error("Errore fetch manifest IIIF:", err);
      setError(err.message || 'Errore sconosciuto durante il caricamento del manoscritto.');
    } finally {
      setLoading(false);
    }
  }, [codiceArchivio, volume, foglio]);

  useEffect(() => {
    if (isOpen && codiceArchivio) {
      setImageLoading(true);
      setResolvedCodice(codiceArchivio);
      fetchManifest();
      // Reset zoom state
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setPages([]);
      setCurrentIndex(0);
      setError(null);
    }
  }, [isOpen, codiceArchivio, foglio, fetchManifest]);

  const dialogRef = useRef<HTMLDivElement>(null);
  useModal(isOpen, onClose, dialogRef);

  if (!isOpen) return null;



  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartInfo.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
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
  const handleResetZoom = () => { 
    setScale(1); 
    setPosition({x:0, y:0}); 
    setUseHighRes(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomSensitivity = 0.002;
    setScale(s => {
      const newScale = s - e.deltaY * zoomSensitivity;
      return Math.min(Math.max(newScale, 0.2), 5); 
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-main/95 backdrop-blur-sm p-0 sm:p-4 touch-none">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="viewer-title"
        tabIndex={-1}
        className="bg-bg-table border-0 sm:border border-border-base shadow-2xl sm:rounded-lg w-full max-w-6xl h-full sm:h-[90vh] flex flex-col overflow-hidden focus:outline-none"
      >
        
        {/* Header Modale */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border-base bg-bg-sidebar">
          <div className="flex flex-col">
            <h2 id="viewer-title" className="text-sm sm:text-base md:text-xl font-serif font-bold text-accent-strong flex items-center gap-1.5 sm:gap-2">
              <BookOpenIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="hidden sm:inline">Archivio di Stato di Firenze - </span>
              Volume {volume || '?'}, Foglio {foglio || '?'}
            </h2>
            {nome && (
              <p className="text-xs sm:text-sm text-text-main font-semibold mt-0.5 sm:mt-1">
                Fuoco: {nome}
              </p>
            )}
            <p className="text-[9px] sm:text-xs text-text-accent font-mono mt-0.5 sm:mt-1 opacity-80">
              ID Archivio: {resolvedCodice}
            </p>
          </div>
          <button  
            title="Chiudi Visore"
            aria-label="Chiudi visore"
            onClick={onClose} 
            className="text-text-main hover:text-red-500 hover:bg-border-base/50 p-2 rounded transition-colors"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative bg-[#1e1e1e] overflow-hidden flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-main z-10 bg-[#1e1e1e]/80">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
               <p className="font-mono text-sm animate-pulse text-white/80">Recupero informazioni manoscritto...</p>
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-sidebar p-8 text-center z-10">
               <AlertCircle className="h-16 w-16 text-orange-500 mb-4" />
               <h3 className="text-xl font-bold text-text-main mb-2">Impossibile visualizzare il foglio</h3>
               <p className="text-text-accent max-w-md">{error}</p>
               
               <a 
                 href={`https://archiviodigitale-icar.cultura.gov.it/it/185/ricerca/detail/${resolvedCodice}#viewer`}
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="mt-6 flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded font-bold hover:brightness-110 transition-all"
               >
                 <span>Apri sul sito dell'Archivio</span>
                 <ExternalLink className="h-4 w-4" />
               </a>
            </div>
          )}

           {imageUrl && !loading && !error && (
            <div 
               ref={containerRef}
               className="w-full h-full cursor-grab active:cursor-grabbing relative flex items-center justify-center overflow-hidden select-none touch-none"
               onMouseDown={handleMouseDown}
               onMouseMove={handleMouseMove}
               onMouseUp={handleMouseUp}
               onMouseLeave={handleMouseUp}
               onWheel={handleWheel}
            >
              {/* Image Loading Indicator */}
              {imageLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e1e1e]/50 z-10 pointer-events-none">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-2"></div>
                  <p className="text-xs text-text-accent font-mono animate-pulse drop-shadow-md">Caricamento immagine in corso...</p>
                </div>
              )}

              <img 
                src={activeImageUrl} 
                alt={`Volume ${volume}, Foglio ${foglio}`}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out, opacity 0.3s',
                  transformOrigin: 'center center',
                  opacity: imageLoading ? 0.4 : 1
                }}
                className="max-w-full max-h-full object-contain pointer-events-none select-none motion-reduce:!transition-none"
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
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-item-selected text-white p-2 sm:p-3 rounded-full shadow-lg backdrop-blur-sm transition-colors z-20 pointer-events-auto"
                  title="Pagina Precedente"
                  aria-label="Pagina precedente"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-8 sm:w-8" />
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
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-item-selected text-white p-2 sm:p-3 rounded-full shadow-lg backdrop-blur-sm transition-colors z-20 pointer-events-auto"
                  title="Pagina Successiva"
                  aria-label="Pagina successiva"
                >
                  <ChevronRight className="h-5 w-5 sm:h-8 sm:w-8" />
                </button>
              )}

              {/* Preload delle pagine successive di nascosto per velocizzare la transizione */}
              <div className="hidden">
                 {pages.map((p, i) => (
                   i !== currentIndex && <img key={`preload-${i}`} src={getIiifImageUrl(p.id, 1600)} alt="" />
                 ))}
              </div>
            </div>
          )}
        </div>

        {/* Paginazione Pagine Successive */}
        {!loading && !error && pages.length > 1 && (
          <div className="bg-bg-main border-t border-border-base p-2 flex items-center gap-2 overflow-x-auto">
             <span className="text-xs text-text-accent font-semibold ml-2 whitespace-nowrap">Pagine:</span>
             {pages.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => { 
                     if (idx !== currentIndex) {
                        setImageLoading(true);
                        setCurrentIndex(idx); 
                        handleResetZoom();
                     }
                  }}
                  aria-current={idx === currentIndex ? 'page' : undefined}
                  className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap ${idx === currentIndex ? 'bg-primary text-on-primary font-bold shadow-md' : 'bg-bg-sidebar text-text-main border border-border-base hover:bg-border-base'}`}
                >
                  {idx === 0 ? 'Attuale' : `Succ. ${idx}`}
                </button>
             ))}
          </div>
        )}

        {/* Toolbar Footer (Zoom Controls) */}
        {!loading && !error && imageUrl && (
          <div className="bg-bg-sidebar border-t border-border-base p-2 sm:p-3 flex items-center justify-center gap-2 sm:gap-4">
             <button onClick={handleZoomOut} className="p-2.5 sm:p-2 hover:bg-border-base rounded text-text-main transition-colors" title="Zoom Out" aria-label="Riduci zoom">
               <ZoomOut className="h-5 w-5" />
             </button>
             <span className="text-text-accent font-mono text-xs sm:text-sm min-w-[2.5rem] sm:min-w-[3rem] text-center">
               {Math.round(scale * 100)}%
             </span>
             <button onClick={handleZoomIn} className="p-2.5 sm:p-2 hover:bg-border-base rounded text-text-main transition-colors" title="Zoom In" aria-label="Aumenta zoom">
               <ZoomIn className="h-5 w-5" />
             </button>
             <div className="w-px h-5 sm:h-6 bg-border-base mx-1 sm:mx-2"></div>
             <button onClick={handleResetZoom} className="p-2.5 sm:p-2 hover:bg-border-base rounded text-text-main transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm" title="Reimposta Zoom">
               <Maximize className="h-4 w-4" />
               <span className="hidden sm:inline">Adatta</span>
             </button>

             <div className="ml-auto flex items-center gap-2">
                 {onSegnalaSegnatura && (
                   <button
                     onClick={onSegnalaSegnatura}
                     className="text-[10px] sm:text-xs text-text-main bg-bg-main hover:bg-border-base px-2 py-1.5 rounded-sm flex items-center gap-1 border border-border-base active:scale-95 transition-all font-semibold"
                     title="Segnala la segnatura della portata di questo fuoco"
                   >
                     <Flag className="h-3 w-3" />
                     <span className="hidden sm:inline">Segnala segnatura</span>
                     <span className="sm:hidden">Segnala</span>
                   </button>
                 )}
                 <a
                   href={`https://archiviodigitale-icar.cultura.gov.it/it/185/ricerca/detail/${resolvedCodice}#viewer`}
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="text-[10px] sm:text-xs text-on-primary bg-primary hover:bg-primary/95 px-2 py-1.5 rounded-sm flex items-center gap-1 active:scale-95 transition-all shadow-sm font-semibold"
                 >
                   <ExternalLink className="h-3 w-3" />
                   <span className="hidden sm:inline">Sito Originale</span>
                   <span className="sm:hidden">Originale</span>
                 </a>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

const BookOpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
)

export default ArchivioViewerModal;
