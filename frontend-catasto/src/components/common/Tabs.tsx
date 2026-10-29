import { useRef, type KeyboardEvent } from "react";
import { tabIds } from "./tab-ids";

export interface TabDef<K extends string> {
  key: K;
  label: string;
}

interface TabsProps<K extends string> {
  idPrefix: string;
  label: string;
  tabs: readonly TabDef<K>[];
  selected: K;
  onSelect: (key: K) => void;
}


/**
 * Schede ARIA (pattern "tabs" con attivazione automatica): una sola scheda
 * nell'ordine di tabulazione, frecce, Home e Fine per spostarsi.
 */
export default function Tabs<K extends string>({ idPrefix, label, tabs, selected, onSelect }: TabsProps<K>) {
  const refs = useRef<Partial<Record<K, HTMLButtonElement | null>>>({});

  const onKeyDown = (e: KeyboardEvent) => {
    const index = tabs.findIndex((t) => t.key === selected);
    const next =
      e.key === "ArrowRight" ? (index + 1) % tabs.length
      : e.key === "ArrowLeft" ? (index - 1 + tabs.length) % tabs.length
      : e.key === "Home" ? 0
      : e.key === "End" ? tabs.length - 1
      : null;
    if (next === null) return;
    e.preventDefault();
    onSelect(tabs[next].key);
    refs.current[tabs[next].key]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex gap-1 border-b border-border-base mb-4">
      {tabs.map(({ key, label: tabLabel }) => {
        const active = key === selected;
        const ids = tabIds(idPrefix, key);
        return (
          <button
            key={key}
            ref={(el) => {
              refs.current[key] = el;
            }}
            type="button"
            role="tab"
            id={ids.tab}
            aria-selected={active}
            aria-controls={ids.panel}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(key)}
            className={`min-h-11 px-4 -mb-px border-b-2 text-sm font-bold uppercase tracking-wider transition-colors ${
              active ? "border-primary text-primary" : "border-transparent text-text-accent hover:text-primary"
            }`}
          >
            {tabLabel}
          </button>
        );
      })}
    </div>
  );
}
