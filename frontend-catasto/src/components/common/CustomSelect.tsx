import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

interface CustomSelectProps {
  value: string | number;
  onChange: (e: { target: { value: string | number } }) => void;
  options?: Array<{ id: string | number; label: string }>;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Seleziona...",
  icon = null,
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: string | number) => {
    onChange({ target: { value: id } });
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.id.toString() === value?.toString());
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="block w-full text-left pl-8 pr-8 py-2 border border-border-base bg-bg-card text-text-main focus:outline-none focus:ring-1 focus:ring-primary text-sm relative transition-colors"
      >
        {icon && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-accent pointer-events-none">
            {icon}
          </span>
        )}
        <span className="block truncate mr-2">{displayLabel}</span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-text-accent pointer-events-none">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-bg-card border border-border-base shadow-lg max-h-[60vh] overflow-y-auto rounded-sm">
          <div
            className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-primary hover:text-white text-sm ${value === "" ? "font-semibold bg-bg-sidebar" : ""}`}
            onClick={() => handleSelect("")}
          >
            {placeholder}
          </div>
          {options.map((option) => (
            <div
              key={option.id}
              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-primary hover:text-white text-sm border-t border-border-base/30 ${value?.toString() === option.id.toString() ? "font-semibold bg-bg-sidebar/50" : ""}`}
              onClick={() => handleSelect(option.id)}
            >
              <span className="block whitespace-normal break-words leading-tight">{option.label}</span>
              {value?.toString() === option.id.toString() && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-primary">
                  <Check size={16} />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
