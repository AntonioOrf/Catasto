import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

/**
 * Custom Select component that supports text wrapping for options.
 *
 * @param {Object} props
 * @param {string|number} props.value - Current selected value (ID).
 * @param {function} props.onChange - Callback when an option is selected.
 * @param {Array} props.options - Array of options { id, label }.
 * @param {string} props.placeholder - Text to display when no option is selected.
 * @param {React.ReactNode} props.icon - Optional icon to display on the left.
 * @param {string} props.className - Additional classes for the container.
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Seleziona...",
  icon = null,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (id) => {
    onChange({ target: { value: id } }); // Mimic event object for compatibility
    setIsOpen(false);
  };

  // Find selected label
  const selectedOption = options.find((opt) => opt.id.toString() === value?.toString());
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="block w-full text-left pl-8 pr-8 py-2 border-[1px] border-solid border-border-base bg-bg-main text-text-main focus:outline-none focus:ring-1 focus:ring-bg-header text-sm relative transition-colors"
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-bg-main border border-border-base shadow-lg max-h-[60vh] overflow-y-auto rounded-sm animate-in fade-in zoom-in-95 duration-100">
          <div
            className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-bg-header-accent hover:text-text-inverted text-sm ${
              value === "" ? "font-semibold bg-bg-sidebar" : ""
            }`}
            onClick={() => handleSelect("")}
          >
            {placeholder}
          </div>
          {options.map((option) => (
            <div
              key={option.id}
              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-bg-header-accent hover:text-text-inverted text-sm border-t border-border-base/30 ${
                value?.toString() === option.id.toString()
                  ? "font-semibold bg-bg-sidebar/50"
                  : ""
              }`}
              onClick={() => handleSelect(option.id)}
            >
              {/* Allow text wrapping */}
              <span className="block whitespace-normal break-words leading-tight">
                {option.label}
              </span>

              {value?.toString() === option.id.toString() && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-bg-header">
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
