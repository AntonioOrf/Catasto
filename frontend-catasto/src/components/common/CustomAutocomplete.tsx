import React, { useState, useRef, useEffect, useMemo } from "react";
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
}

export default function CustomAutocomplete({
  value,
  onChange,
  options = [],
  placeholder = "Cerca...",
  icon = null,
  className = "",
}: CustomAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lowerSearch = searchTerm.toLowerCase();
    return options.filter((opt) => 
      opt.label.toLowerCase().includes(lowerSearch)
    );
  }, [options, searchTerm]);

  const handleSelect = (id: string | number) => {
    onChange({ target: { value: id } });
    setIsOpen(false);
    setSearchTerm("");
  };

  const selectedOption = options.find((opt) => opt.id.toString() === value?.toString());
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ target: { value: "" } });
    setSearchTerm("");
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="block w-full text-left pl-8 pr-10 py-2 border border-border-base bg-bg-card text-text-main focus:outline-none focus:ring-1 focus:ring-primary text-sm relative transition-colors min-h-[38px]"
      >
        {icon && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-accent pointer-events-none">
            {icon}
          </span>
        )}
        <span className="block whitespace-normal leading-tight mr-2 py-1">{displayLabel}</span>
        
        <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value !== "" && (
            <X 
              size={14} 
              className="text-text-accent hover:text-primary cursor-pointer" 
              onClick={clearSelection}
            />
          )}
          {isOpen ? <ChevronUp size={16} className="text-text-accent" /> : <ChevronDown size={16} className="text-text-accent" />}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-bg-card border border-border-base shadow-xl max-h-[300px] overflow-hidden flex flex-col rounded-sm">
          <div className="p-2 border-b border-border-base bg-bg-sidebar">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-text-accent" size={14} />
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-8 pr-3 py-1.5 bg-bg-main border border-border-base text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Filtra lista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            <div
              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-primary hover:text-white text-sm ${value === "" ? "font-semibold bg-bg-sidebar" : ""}`}
              onClick={() => handleSelect("")}
            >
              Tutti
            </div>
            {filteredOptions.length > 0 ? (
              filteredOptions.slice(0, 100).map((option) => (
                <div
                  key={option.id}
                  className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-primary hover:text-white text-sm border-t border-border-base/10 ${value?.toString() === option.id.toString() ? "font-semibold bg-bg-sidebar/50" : ""}`}
                  onClick={() => handleSelect(option.id)}
                >
                  <span className="block whitespace-normal leading-tight">{option.label}</span>
                  {value?.toString() === option.id.toString() && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-primary">
                      <Check size={16} />
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-sm text-text-accent opacity-60">
                Nessun risultato trovato
              </div>
            )}
            {filteredOptions.length > 100 && (
              <div className="py-2 px-3 text-[10px] text-text-accent bg-bg-sidebar/30 border-t border-border-base/10 italic">
                Mostrati i primi 100 risultati...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
