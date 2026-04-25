import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface CustomNumberInputProps {
  value: string | number;
  onChange: (e: { target: { value: string | number } }) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
}

export default function CustomNumberInput({
  value,
  onChange,
  min,
  max,
  placeholder,
  className = "",
}: CustomNumberInputProps) {
  const handleIncrement = () => {
    const currentValue = value === "" ? 0 : parseInt(value as string, 10);
    const step = 1;
    let newValue = currentValue + step;
    if (max !== undefined && newValue > max) newValue = max;
    onChange({ target: { value: newValue } });
  };

  const handleDecrement = () => {
    const currentValue = value === "" ? 0 : parseInt(value as string, 10);
    const step = 1;
    let newValue = currentValue - step;
    if (min !== undefined && newValue < min) newValue = min;
    onChange({ target: { value: newValue } });
  };

  return (
    <div className={`relative flex items-center border border-border-base bg-bg-card text-text-main rounded-sm focus-within:ring-1 focus-within:ring-primary ${className}`}>
      <input
        type="number"
        value={value}
        onChange={onChange as any}
        min={min}
        max={max}
        placeholder={placeholder}
        className="w-full pl-3 pr-8 py-2 bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-text-main placeholder:text-text-accent placeholder:opacity-50 appearance-none"
      />
      <div className="absolute right-0 inset-y-0 flex flex-col border-l border-border-base">
        <button
          type="button"
          onClick={handleIncrement}
          className="flex-1 px-1 hover:bg-primary hover:text-white text-text-accent transition-colors flex items-center justify-center border-b border-border-base"
        >
          <ChevronUp size={12} />
        </button>
        <button
          type="button"
          onClick={handleDecrement}
          className="flex-1 px-1 hover:bg-primary hover:text-white text-text-accent transition-colors flex items-center justify-center"
        >
          <ChevronDown size={12} />
        </button>
      </div>
    </div>
  );
}
