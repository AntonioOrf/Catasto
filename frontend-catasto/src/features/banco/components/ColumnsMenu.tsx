import { useEffect, useId, useRef, useState } from "react";
import { useT } from "../../../i18n";
import { bancoMessages } from "../banco.messages";
import { LOCKED_COLUMN, getColumn, moveColumn, toggleColumn, type ColumnsState } from "../columns";

interface ColumnsMenuProps {
  state: ColumnsState;
  onChange: (next: ColumnsState) => void;
  onReset: () => void;
  label: (key: string) => string;
}

/**
 * «Colonne»: un pannello con una casella per colonna. Si trascina una voce
 * per cambiare l'ordine; le frecce accanto fanno lo stesso da tastiera.
 */
export default function ColumnsMenu({ state, onChange, onReset, label }: ColumnsMenuProps) {
  const t = useT(bancoMessages);
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const arrow = "inline-flex items-center justify-center min-h-8 min-w-8 text-text-accent hover:text-primary disabled:opacity-30";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="min-h-11 inline-flex items-center text-accent-strong underline underline-offset-4 decoration-accent-strong/40 hover:decoration-accent-strong"
      >
        {t("columns")}
      </button>
      <div
        id={panelId}
        hidden={!open}
        role="group"
        aria-labelledby={`${panelId}-title`}
        className="absolute right-0 top-full mt-1 z-30 w-80 max-h-[70vh] overflow-y-auto bg-bg-main border border-border-base rounded-ui p-3 text-sm"
      >
        <div className="flex items-baseline justify-between gap-2">
          <h3 id={`${panelId}-title`} className="font-semibold text-accent-strong">
            {t("columnsTitle")}
          </h3>
          <button type="button" onClick={onReset} className="text-primary hover:underline underline-offset-4 min-h-8">
            {t("resetColumns")}
          </button>
        </div>
        <p className="text-xs text-text-accent mb-2">{t("columnsHint")}</p>
        <ol>
          {state.order.map((key, index) => {
            const col = label(key);
            const locked = key === LOCKED_COLUMN;
            return (
              <li
                key={key}
                draggable
                onDragStart={(e) => {
                  setDragging(key);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  if (!dragging) return;
                  e.preventDefault();
                  if (dragging !== key) onChange(moveColumn(state, dragging, index));
                }}
                onDragEnd={() => setDragging(null)}
                className={`flex items-center gap-1 border-b border-border-base/40 cursor-grab ${dragging === key ? "bg-primary/10" : ""}`}
              >
                <span aria-hidden="true" className="text-text-accent px-1 select-none">
                  ⋮⋮
                </span>
                <label className={`flex-1 flex items-center gap-2 min-h-9 ${locked ? "text-text-accent" : "cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    checked={!state.hidden.includes(key)}
                    disabled={locked || !getColumn(key)}
                    onChange={() => onChange(toggleColumn(state, key))}
                    className="h-4 w-4"
                  />
                  {col}
                </label>
                <button type="button" onClick={() => onChange(moveColumn(state, key, index - 1))} disabled={index === 0} aria-label={t("moveUp", { col })} className={arrow}>
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onChange(moveColumn(state, key, index + 1))}
                  disabled={index === state.order.length - 1}
                  aria-label={t("moveDown", { col })}
                  className={arrow}
                >
                  ↓
                </button>
              </li>
            );
          })}
        </ol>
        <button type="button" onClick={() => setOpen(false)} className="mt-2 min-h-9 text-text-accent hover:underline underline-offset-4">
          {t("close")}
        </button>
      </div>
    </div>
  );
}
