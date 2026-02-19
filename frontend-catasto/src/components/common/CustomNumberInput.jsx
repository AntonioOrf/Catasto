import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

/**
 * Custom Number Input with styled increment/decrement controls.
 * Matches the style of CustomSelect and other inputs.
 */
export default function CustomNumberInput({
  value,
  onChange,
  min,
  max,
  placeholder,
  className = "",
}) {
  const handleIncrement = () => {
    const currentValue = value === "" ? 0 : parseInt(value, 10);
    const step = 1;
    let newValue = currentValue + step;
    if (max !== undefined && newValue > max) newValue = max;
    onChange({ target: { value: newValue } });
  };

  const handleDecrement = () => {
    const currentValue = value === "" ? 0 : parseInt(value, 10);
    const step = 1;
    let newValue = currentValue - step;
    if (min !== undefined && newValue < min) newValue = min;
    onChange({ target: { value: newValue } });
  };

  return (
    <div className={`relative flex items-center border border-border-base bg-bg-main text-text-main rounded-sm focus-within:ring-1 focus-within:ring-bg-header ${className}`}>
      <input
        type="number"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        placeholder={placeholder}
        className="w-full pl-3 pr-8 py-2 bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-text-main placeholder:text-text-accent placeholder:opacity-50 appearance-none"
      />
      
      {/* Vertical Stacked Buttons for controls (like native but styled) */}
      <div className="absolute right-0 inset-y-0 flex flex-col border-l border-border-base">
        <button
          type="button"
          onClick={handleIncrement}
          className="flex-1 px-1 hover:bg-bg-header-accent hover:text-text-inverted text-text-accent transition-colors flex items-center justify-center border-b border-border-base"
        >
          <ChevronUp size={12} />
        </button>
        <button
          type="button"
          onClick={handleDecrement}
          className="flex-1 px-1 hover:bg-bg-header-accent hover:text-text-inverted text-text-accent transition-colors flex items-center justify-center"
        >
          <ChevronDown size={12} />
        </button>
      </div>
    </div>
  );
}
