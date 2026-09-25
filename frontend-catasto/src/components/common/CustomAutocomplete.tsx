import React, { useState, useRef, useEffect, useMemo, useId } from "react";
import { ChevronDown, ChevronUp, Check, Search, X } from "lucide-react";

interface Option {
  id: string | number;
  label: string;
}

interface CustomAutocompleteProps {
  value: string | number;
  onChange: (e: { target: { value: string | number } }) => void;
  options?: Option[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  /** Collega il trigger a una <label htmlFor>. */
  id?: string;
}

/** Oltre questa soglia la lista chiede di filtrare: migliaia di nodi rendono lento ogni tasto. */
const MAX_VISIBLE = 100;
const ALL_OPTION: Option = { id: "", label: "Tutti" };

/**
 * Select con filtro, secondo il pattern ARIA "combobox + listbox": il focus
 * resta nel campo di filtro e l'opzione attiva è annunciata tramite
 * aria-activedescendant, così frecce, Invio ed Esc funzionano come in una
 * select nativa anche con migliaia di mestieri o località.
 */
export default function CustomAutocomplete({
  value,
  onChange,
  options = [],
  placeholder = "Cerca...",
  icon = null,
  className = "",
  id,
}: CustomAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const optionId = (index: number) => `${listId}-opt-${index}`;

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lowerSearch = searchTerm.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(lowerSearch));
  }, [options, searchTerm]);

  // "Tutti" resta la prima voce solo senza filtro: con un filtro attivo
  // l'utente cerca un valore preciso e Invio deve selezionare il primo match.
  const visibleOptions = useMemo(
    () => [...(searchTerm ? [] : [ALL_OPTION]), ...filteredOptions.slice(0, MAX_VISIBLE)],
    [filteredOptions, searchTerm],
  );

  const selectedOption = options.find((opt) => opt.id.toString() === value?.toString());
  const displayLabel = selectedOption ? selectedOption.label : placeholder;
  const hasValue = value !== "" && value !== undefined && value !== null;

  const close = (restoreFocus: boolean) => {
    setIsOpen(false);
    setSearchTerm("");
    if (restoreFocus) triggerRef.current?.focus();
  };

  const open = () => {
    const selectedIndex = visibleOptions.findIndex((o) => o.id.toString() === String(value ?? ""));
    setActiveIndex(Math.max(selectedIndex, 0));
    setIsOpen(true);
  };

  const handleSelect = (optionValue: string | number) => {
    onChange({ target: { value: optionValue } });
    close(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => setActiveIndex(0), [searchTerm]);

  useEffect(() => {
    if (!isOpen) return;
    document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optionId deriva da listId, stabile
  }, [activeIndex, isOpen]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const last = visibleOptions.length - 1;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, last));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(last);
        break;
      case "Enter":
        e.preventDefault();
        if (visibleOptions[activeIndex]) handleSelect(visibleOptions[activeIndex].id);
        break;
      case "Escape":
        e.preventDefault();
        // Non deve chiudere anche una modale che contiene il campo.
        e.stopPropagation();
        close(true);
        break;
      case "Tab":
        close(false);
        break;
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      open();
    } else if ((e.key === "Delete" || e.key === "Backspace") && hasValue) {
      e.preventDefault();
      onChange({ target: { value: "" } });
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? close(false) : open())}
        onKeyDown={handleTriggerKeyDown}
        className={`block w-full text-left pl-8 py-2 border border-border-base bg-bg-card text-text-main focus:outline-none focus:ring-1 focus:ring-primary text-sm relative transition-colors min-h-11 ${hasValue ? "pr-16" : "pr-9"}`}
      >
        {icon && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-accent pointer-events-none" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className={`block whitespace-normal leading-tight py-1 ${hasValue ? "" : "text-text-accent"}`}>
          {displayLabel}
        </span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-text-accent" aria-hidden="true">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Fratello del trigger, non figlio: un pulsante dentro un pulsante non
          è raggiungibile da tastiera né annunciato correttamente. */}
      {hasValue && (
        <button
          type="button"
          onClick={() => onChange({ target: { value: "" } })}
          aria-label={`Azzera ${selectedOption?.label ?? "selezione"}`}
          title="Azzera"
          className="absolute right-7 top-1/2 -translate-y-1/2 p-2 text-text-accent hover:text-primary rounded"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-bg-card border border-border-base shadow-xl max-h-[300px] overflow-hidden flex flex-col rounded-sm">
          <div className="p-2 border-b border-border-base bg-bg-sidebar">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-text-accent" size={14} aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={visibleOptions[activeIndex] ? optionId(activeIndex) : undefined}
                aria-label="Filtra le opzioni"
                className="w-full pl-8 pr-3 py-1.5 bg-bg-main border border-border-base text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Filtra lista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleInputKeyDown}
              />
            </div>
          </div>
          <ul ref={listRef} id={listId} role="listbox" className="overflow-y-auto flex-1">
            {visibleOptions.map((option, index) => {
              const selected = option.id.toString() === String(value ?? "");
              return (
                <li
                  key={`${option.id}`}
                  id={optionId(index)}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(option.id)}
                  onMouseMove={() => setActiveIndex(index)}
                  className={`cursor-pointer select-none relative py-2 pl-3 pr-9 text-sm border-t border-border-base/10 ${
                    index === activeIndex ? "bg-primary text-on-primary" : ""
                  } ${selected ? "font-semibold" : ""}`}
                >
                  <span className="block whitespace-normal leading-tight">{option.label}</span>
                  {selected && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2" aria-hidden="true">
                      <Check size={16} />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {filteredOptions.length === 0 && (
            <p className="py-4 text-center text-sm text-text-accent" role="status">
              Nessuna voce contiene "{searchTerm}"
            </p>
          )}
          {filteredOptions.length > MAX_VISIBLE && (
            <p className="py-2 px-3 text-[11px] text-text-accent bg-bg-sidebar/30 border-t border-border-base/10 italic">
              Mostrate {MAX_VISIBLE} voci su {filteredOptions.length}: scrivi per restringere.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
