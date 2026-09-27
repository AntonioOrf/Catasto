import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, ZoomIn, ZoomOut, Maximize, AlertCircle, ExternalLink, ChevronLeft, ChevronRight, Flag, BookOpen } from 'lucide-react';
import { fetchManifestPages } from '../../../api/catastoService';
import { userMessage } from '../../../api/client';
import { useModal } from '../../../hooks/useModal';
import Spinner from '../../../components/common/Spinner';
import {
  PAGES_TO_SHOW,
  archiveDetailUrl,
  findFoglioIndex,
  iiifImageUrl,
  resolveArchiveId,
} from '../lib/archivio';

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

const MIN_SCALE = 0.2;
const MAX_SCALE = 5;
/** Oltre questo zoom la versione ridotta sgrana: si passa alla piena risoluzione. */
const HIGH_RES_THRESHOLD = 1.2;
const PREVIEW_WIDTH = 1600;
const SWIPE_MIN_X = 80;
const SWIPE_MAX_Y = 50;

const clampScale = (value: number) => Math.min(Math.max(value, MIN_SCALE), MAX_SCALE);
const touchDistance = (a: Touch, b: Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

const ArchivioViewerModal: React.FC<ArchivioViewerModalProps> = ({ isOpen, onClose, codiceArchivio, foglio, volume, nome, onSegnalaSegnatura }) => {
  const archiveId = resolveArchiveId(codiceArchivio, volume, foglio);

  // Il manifest di un volume non cambia: in cache per tutta la sessione, così
  // riaprire lo stesso volume è immediato. React Query annulla anche la
  // richiesta precedente se l'utente apre subito un altro fuoco.
  const manifest = useQuery({
    queryKey: ['manifest', archiveId],
    queryFn: ({ signal }) => fetchManifestPages(archiveId, signal),
    enabled: isOpen && Boolean(archiveId),
    staleTime: Infinity,
    retry: false,
  });

  const allPages = manifest.data ?? [];
  const foglioIndex = findFoglioIndex(allPages, foglio);
  const startIndex = Math.max(foglioIndex, 0);
  const pages = allPages.slice(startIndex, startIndex + PAGES_TO_SHOW);
  // Carta non trovata nel manifest: si mostra la prima pagina, ma l'utente
  // deve saperlo, altrimenti la scambia per la carta del fuoco.
  const notice =
    manifest.isSuccess && allPages.length > 0 && foglioIndex === -1
      ? `La carta ${foglio} non è stata individuata nel volume digitalizzato: viene mostrata la prima pagina. Usa "Sito Originale" per sfogliare il volume.`
      : null;
  const error = manifest.isError
    ? userMessage(manifest.error, "Impossibile scaricare le informazioni del volume.")
    : manifest.isSuccess && pages.length === 0
      ? 'Il volume risulta vuoto o privo di pagine digitalizzate.'
      : null;
  const loading = manifest.isLoading;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const useHighRes = scale > HIGH_RES_THRESHOLD;

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const touchStart = useRef({ x: 0, y: 0 });
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);

  const imageUrl = pages[currentIndex]?.image;
  const activeImageUrl = imageUrl && (useHighRes ? imageUrl : iiifImageUrl(imageUrl, PREVIEW_WIDTH));

  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const goToPage = useCallback(
    (index: number) => {
      if (index < 0 || index >= pages.length || index === currentIndex) return;
      setImageLoading(true);
      setCurrentIndex(index);
      resetView();
    },
    [pages.length, currentIndex, resetView],
  );

  // Ogni apertura (o cambio di fuoco) riparte dalla carta del fuoco, senza zoom.
  useEffect(() => {
    if (!isOpen) return;
    setCurrentIndex(0);
    setImageLoading(true);
    resetView();
  }, [isOpen, archiveId, foglio, resetView]);

  // Stato letto dai listener touch nativi, registrati una sola volta.
  const stateRef = useRef({ position, scale, goToPage, currentIndex });
  useEffect(() => {
    stateRef.current = { position, scale, goToPage, currentIndex };
  });

  // Listener nativi e non React: servono { passive: false } per poter
  // bloccare lo scroll della pagina durante pan e pinch.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      const { position: pos, scale: currentScale } = stateRef.current;
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        setIsDragging(true);
        dragStart.current = { x: touch.clientX, y: touch.clientY, posX: pos.x, posY: pos.y };
        touchStart.current = { x: touch.clientX, y: touch.clientY };
        pinchStart.current = null;
      } else if (e.touches.length === 2) {
        setIsDragging(false);
        pinchStart.current = { distance: touchDistance(e.touches[0], e.touches[1]), scale: currentScale };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      if (e.touches.length === 1 && !pinchStart.current) {
        const touch = e.touches[0];
        setPosition({
          x: dragStart.current.posX + touch.clientX - dragStart.current.x,
          y: dragStart.current.posY + touch.clientY - dragStart.current.y,
        });
      } else if (e.touches.length === 2 && pinchStart.current) {
        const distance = touchDistance(e.touches[0], e.touches[1]);
        if (distance > 10) setScale(clampScale((pinchStart.current.scale * distance) / pinchStart.current.distance));
      }
    };

    // Swipe orizzontale per cambiare carta, solo senza zoom (con zoom è pan).
    const onTouchEnd = (e: TouchEvent) => {
      setIsDragging(false);
      pinchStart.current = null;
      const { scale: currentScale, goToPage: go, currentIndex: index } = stateRef.current;
      const touch = e.changedTouches[0];
      if (currentScale > 1.1 || !touch) return;
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;
      if (Math.abs(deltaX) > SWIPE_MIN_X && Math.abs(deltaY) < SWIPE_MAX_Y) {
        go(deltaX > 0 ? index - 1 : index + 1);
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [imageUrl]);

  const dialogRef = useRef<HTMLDivElement>(null);
  useModal(isOpen, onClose, dialogRef);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: dragStart.current.posX + e.clientX - dragStart.current.x,
      y: dragStart.current.posY + e.clientY - dragStart.current.y,
    });
  };

  const stopDragging = () => setIsDragging(false);
  const zoomBy = (delta: number) => setScale((s) => clampScale(s + delta));
  const handleWheel = (e: React.WheelEvent) => zoomBy(-e.deltaY * 0.002);

  // Frecce della tastiera: sfogliare le carte senza dover raggiungere i pulsanti.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === 'ArrowLeft') goToPage(currentIndex - 1);
    else if (e.key === 'ArrowRight') goToPage(currentIndex + 1);
    else if (e.key === '+' || e.key === '=') zoomBy(0.3);
    else if (e.key === '-') zoomBy(-0.3);
  };

  const detailUrl = archiveDetailUrl(archiveId);
  const showImage = Boolean(imageUrl) && !loading && !error;
  const toolbarButton = 'p-2.5 sm:p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-border-base rounded text-text-main transition-colors';
  const navArrow =
    'absolute top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full shadow-lg backdrop-blur-sm transition-colors z-20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-main/95 backdrop-blur-sm p-0 sm:p-4 touch-none">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="viewer-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="bg-bg-table border-0 sm:border border-border-base shadow-2xl sm:rounded-lg w-full max-w-6xl h-full sm:h-[90vh] flex flex-col overflow-hidden focus:outline-none"
      >
        <div className="flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-border-base bg-bg-sidebar">
          <div className="flex flex-col min-w-0">
            <h2 id="viewer-title" className="text-sm sm:text-base md:text-xl font-serif font-bold text-accent-strong flex items-center gap-1.5 sm:gap-2">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Archivio di Stato di Firenze - </span>
              Volume {volume || '?'}, Foglio {foglio || '?'}
            </h2>
            {nome && (
              <p className="text-xs sm:text-sm text-text-main font-semibold mt-0.5 sm:mt-1 truncate">
                Fuoco: {nome}
              </p>
            )}
            <p className="text-[11px] sm:text-xs text-text-accent font-mono mt-0.5 sm:mt-1">
              ID Archivio: {archiveId}
            </p>
          </div>
          <button
            type="button"
            title="Chiudi visore"
            aria-label="Chiudi visore"
            onClick={onClose}
            className="text-text-main hover:text-red-500 hover:bg-border-base/50 p-2.5 rounded transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Il fondo scuro fa risaltare la carta in entrambi i temi. */}
        <div className="flex-1 relative bg-neutral-900 overflow-hidden flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-4">
              <Spinner className="h-12 w-12" />
              <p className="font-mono text-sm text-white/80" role="status">Recupero informazioni manoscritto...</p>
            </div>
          )}

          {error && !loading && (
            <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center bg-bg-sidebar p-8 text-center z-10">
              <AlertCircle className="h-16 w-16 text-orange-500 mb-4" aria-hidden="true" />
              <h3 className="text-xl font-bold text-text-main mb-2">Impossibile visualizzare il foglio</h3>
              <p className="text-text-accent max-w-md">{error}</p>
              <a
                href={detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center gap-2 bg-primary text-on-primary px-4 min-h-11 rounded font-bold hover:bg-primary/90 transition-colors"
              >
                <span>Apri sul sito dell'Archivio</span>
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          )}

          {notice && showImage && (
            <p role="status" className="absolute top-0 inset-x-0 z-20 bg-bg-sidebar/95 border-b border-border-base text-text-main text-xs sm:text-sm px-4 py-2 text-center">
              {notice}
            </p>
          )}

          {showImage && (
            <div
              ref={containerRef}
              className="w-full h-full cursor-grab active:cursor-grabbing relative flex items-center justify-center overflow-hidden select-none touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDragging}
              onMouseLeave={stopDragging}
              onWheel={handleWheel}
            >
              {imageLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none gap-2">
                  <Spinner className="h-10 w-10" />
                  <p className="text-xs text-white/80 font-mono drop-shadow-md">Caricamento immagine in corso...</p>
                </div>
              )}

              <img
                src={activeImageUrl}
                alt={`Volume ${volume}, foglio ${foglio}${pages[currentIndex]?.label ? ` (${pages[currentIndex].label})` : ''}`}
               
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out, opacity 0.3s',
                  opacity: imageLoading ? 0.4 : 1,
                }}
                className="max-w-full max-h-full object-contain pointer-events-none select-none origin-center motion-reduce:!transition-none"
                draggable={false}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />

              {currentIndex > 0 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); goToPage(currentIndex - 1); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`${navArrow} left-2 sm:left-4`}
                  title="Pagina precedente"
                  aria-label="Pagina precedente"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-8 sm:w-8" aria-hidden="true" />
                </button>
              )}

              {currentIndex < pages.length - 1 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); goToPage(currentIndex + 1); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`${navArrow} right-2 sm:right-4`}
                  title="Pagina successiva"
                  aria-label="Pagina successiva"
                >
                  <ChevronRight className="h-5 w-5 sm:h-8 sm:w-8" aria-hidden="true" />
                </button>
              )}

              {/* Preload delle altre carte, così il cambio pagina è immediato. */}
              <div className="hidden" aria-hidden="true">
                {pages.map((p, i) =>
                  i !== currentIndex ? <img key={p.image} src={iiifImageUrl(p.image, PREVIEW_WIDTH)} alt="" /> : null,
                )}
              </div>
            </div>
          )}
        </div>

        {showImage && pages.length > 1 && (
          <nav aria-label="Carte del volume" className="bg-bg-main border-t border-border-base p-2 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-text-accent font-semibold ml-2 whitespace-nowrap">Pagine:</span>
            {pages.map((p, idx) => (
              <button
                type="button"
                key={p.image}
                onClick={() => goToPage(idx)}
                aria-current={idx === currentIndex ? 'page' : undefined}
                title={p.label || undefined}
                className={`px-3 min-h-9 text-xs rounded transition-colors whitespace-nowrap ${idx === currentIndex ? 'bg-primary text-on-primary font-bold shadow-md' : 'bg-bg-sidebar text-text-main border border-border-base hover:bg-item-hover'}`}
              >
                {idx === 0 ? 'Attuale' : `Succ. ${idx}`}
              </button>
            ))}
          </nav>
        )}

        {showImage && (
          <div className="bg-bg-sidebar border-t border-border-base p-2 sm:p-3 flex items-center justify-center gap-2 sm:gap-4">
            <button type="button" onClick={() => zoomBy(-0.3)} className={toolbarButton} title="Riduci zoom" aria-label="Riduci zoom">
              <ZoomOut className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="text-text-accent font-mono text-xs sm:text-sm min-w-[2.5rem] sm:min-w-[3rem] text-center tabular-nums" aria-live="polite">
              {Math.round(scale * 100)}%
            </span>
            <button type="button" onClick={() => zoomBy(0.3)} className={toolbarButton} title="Aumenta zoom" aria-label="Aumenta zoom">
              <ZoomIn className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="w-px h-5 sm:h-6 bg-border-base mx-1 sm:mx-2" aria-hidden="true"></div>
            <button type="button" onClick={resetView} className={`${toolbarButton} gap-1.5 sm:gap-2 text-xs sm:text-sm`} title="Reimposta zoom">
              <Maximize className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Adatta</span>
            </button>

            <div className="ml-auto flex items-center gap-2">
              {onSegnalaSegnatura && (
                <button
                  type="button"
                  onClick={onSegnalaSegnatura}
                  className="text-[11px] sm:text-xs text-text-main bg-bg-main hover:bg-item-hover px-2 min-h-9 rounded-sm flex items-center gap-1 border border-border-base transition-colors font-semibold"
                  title="Segnala la segnatura della portata di questo fuoco"
                >
                  <Flag className="h-3 w-3" aria-hidden="true" />
                  <span className="hidden sm:inline">Segnala segnatura</span>
                  <span className="sm:hidden">Segnala</span>
                </button>
              )}
              <a
                href={detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-on-primary bg-primary hover:bg-primary/90 px-2 min-h-9 rounded-sm flex items-center gap-1 transition-colors shadow-sm font-semibold"
              >
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
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

export default ArchivioViewerModal;
