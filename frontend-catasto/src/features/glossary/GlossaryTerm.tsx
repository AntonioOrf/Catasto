import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type FocusEvent } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { getGlossaryEntry, glossaryAnchor } from "../../i18n/glossary";
import { useLanguage, useT } from "../../i18n";
import { glossaryMessages } from "./glossary.messages";

interface GlossaryTermProps {
  /** Id della voce in `GLOSSARY`. Una voce inesistente non mostra nulla. */
  id: string;
  className?: string;
}

const POPOVER_WIDTH = 288;
const MARGIN = 8;

/**
 * Pulsante "i" accanto a un'etichetta con la definizione del termine.
 *
 * - Mouse: si apre al passaggio, si chiude uscendo.
 * - Tastiera: si apre al focus; il link "Approfondisci" è raggiungibile con
 *   Tab perché il riquadro resta aperto finché il focus è dentro.
 * - Touch: il tocco apre e chiude (e fissa il riquadro anche col mouse).
 * - Esc chiude e riporta il focus al pulsante.
 * - Lettori di schermo: la definizione è sempre collegata al pulsante con
 *   aria-describedby, anche a riquadro chiuso.
 *
 * Il riquadro sta in un portal con posizione fissa: dentro la tabella (che
 * scorre in orizzontale) sarebbe tagliato.
 */
export default function GlossaryTerm({ id, className = "" }: GlossaryTermProps) {
  const entry = getGlossaryEntry(id);
  const { lang } = useLanguage();
  const t = useT(glossaryMessages);
  const descriptionId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  // Il focus restituito dopo Esc non deve riaprire il riquadro appena chiuso.
  const skipFocusOpen = useRef(false);
  const cancelClose = () => clearTimeout(closeTimer.current);
  const close = useCallback(() => {
    clearTimeout(closeTimer.current);
    setOpen(false);
    setPinned(false);
  }, []);
  // Col mouse: un attimo di tolleranza per passare dal pulsante al riquadro.
  const closeSoon = () => {
    if (pinned) return;
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const place = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(POPOVER_WIDTH, window.innerWidth - 2 * MARGIN);
    const left = Math.min(Math.max(MARGIN, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - MARGIN);
    setPosition({ top: rect.bottom + 6, left });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      close();
      skipFocusOpen.current = true;
      buttonRef.current?.focus();
      skipFocusOpen.current = false;
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!buttonRef.current?.contains(target) && !popoverRef.current?.contains(target)) close();
    };
    // Il riquadro segue il pulsante quando la pagina o la tabella scorrono.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, place, close]);

  if (!entry) return null;

  // Gli eventi del portal risalgono l'albero React: il focus sul link conta come "dentro".
  const onBlur = (e: FocusEvent) => {
    const next = e.relatedTarget as Node | null;
    if (next && (buttonRef.current?.contains(next) || popoverRef.current?.contains(next))) return;
    close();
  };

  const term = entry.term[lang];

  return (
    <span className={`inline-flex align-middle normal-case tracking-normal font-normal ${className}`} onBlur={onBlur}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={t("whatIs", { term })}
        aria-describedby={descriptionId}
        aria-expanded={open}
        onClick={(e) => {
          // Dentro una riga o un'etichetta: il tocco non deve espanderle.
          e.stopPropagation();
          e.preventDefault();
          if (pinned) close();
          else {
            setOpen(true);
            setPinned(true);
          }
        }}
        onFocus={() => {
          if (!skipFocusOpen.current) setOpen(true);
        }}
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        onMouseLeave={closeSoon}
        className="inline-flex items-center justify-center h-6 w-6 -my-1 rounded-full text-text-accent hover:text-primary hover:bg-primary/10 transition-colors"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {/* Sempre nel DOM e nascosta: è la descrizione del pulsante. */}
      <span id={descriptionId} hidden>
        {entry.short[lang]}
      </span>
      {open &&
        position &&
        createPortal(
          <div
            ref={popoverRef}
            onMouseEnter={cancelClose}
            onMouseLeave={closeSoon}
            onClick={(e) => e.stopPropagation()}
            style={{ top: position.top, left: position.left, width: Math.min(POPOVER_WIDTH, window.innerWidth - 2 * MARGIN) }}
            className="fixed z-[70] bg-bg-sidebar border border-border-base rounded shadow-lg p-3 text-left text-sm text-text-main font-serif normal-case tracking-normal"
          >
            <p className="font-bold text-primary mb-1">{term}</p>
            <p className="leading-snug">{entry.short[lang]}</p>
            <Link
              to={`/glossario#${glossaryAnchor(entry.id)}`}
              className="inline-flex items-center min-h-8 mt-1 text-xs font-semibold text-accent-strong underline underline-offset-2"
            >
              {t("more")}
            </Link>
          </div>,
          document.body,
        )}
    </span>
  );
}
