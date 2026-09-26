import { ChevronUp, ChevronDown } from "lucide-react";

interface CustomNumberInputProps {
  value: string;
  /** Riceve il valore come stringa; "" = campo vuoto. */
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  id?: string;
  ariaLabel?: string;
}

const clamp = (value: number, min?: number, max?: number) =>
  Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value));

export default function CustomNumberInput({
  value,
  onChange,
  min,
  max,
  placeholder,
  className = "",
  id,
  ariaLabel,
}: CustomNumberInputProps) {
  const step = (delta: number) => {
    const current = Number(value);
    const base = value === "" || !Number.isFinite(current) ? (min ?? 0) - delta : current;
    onChange(String(clamp(base + delta, min, max)));
  };

  const stepButtonClasses =
    "flex-1 px-1 hover:bg-primary hover:text-on-primary text-text-accent transition-colors flex items-center justify-center";

  return (
    <div className={`relative flex items-center border border-border-base bg-bg-card text-text-main rounded-sm focus-within:ring-1 focus-within:ring-primary ${className}`}>
      <input
        id={id}
        aria-label={ariaLabel}
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        placeholder={placeholder}
        className="w-full min-h-11 pl-3 pr-8 py-2 bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-text-main placeholder:text-text-accent appearance-none"
      />
      {/* Fuori dal Tab: da tastiera le frecce su/giù del campo fanno già lo stesso. */}
      <div className="absolute right-0 inset-y-0 flex flex-col border-l border-border-base">
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Aumenta"
          tabIndex={-1}
          className={`${stepButtonClasses} border-b border-border-base`}
        >
          <ChevronUp size={12} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Diminuisci"
          tabIndex={-1}
          className={stepButtonClasses}
        >
          <ChevronDown size={12} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
