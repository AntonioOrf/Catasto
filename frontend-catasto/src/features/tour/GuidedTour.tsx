import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useModal } from "../../hooks/useModal";
import { useT } from "../../i18n";
import { useTour } from "./tour-context";
import { tourMessages } from "./tour.messages";

const STEPS = [
  ["s1Title", "s1Body"],
  ["s2Title", "s2Body"],
  ["s3Title", "s3Body"],
  ["s4Title", "s4Body"],
  ["s5Title", "s5Body"],
] as const;

/**
 * Percorso guidato in cinque passi: una finestra modale (Esc, focus
 * intrappolato e restituito) che si può saltare in ogni momento. Chiuderla in
 * qualunque modo la segna come vista; il pulsante "Guida" la riapre.
 */
export default function GuidedTour() {
  const t = useT(tourMessages);
  const { open, finish } = useTour();
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModal(open, finish, dialogRef);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  if (!open) return null;
  const [titleKey, bodyKey] = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
        className="bg-bg-sidebar border border-border-base shadow-2xl rounded-t-lg sm:rounded-lg w-full max-w-md p-5 font-serif text-text-main focus:outline-none"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-text-accent">
              {t("title")} · {t("step", { n: step + 1, total: STEPS.length })}
            </p>
            <h2 id="tour-title" className="text-xl font-bold text-primary mt-1">
              {t(titleKey)}
            </h2>
          </div>
          <button
            type="button"
            onClick={finish}
            aria-label={t("skip")}
            className="-mt-1 -mr-2 inline-flex items-center justify-center min-h-11 min-w-11 rounded hover:bg-item-hover"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <p id="tour-body" className="mt-3 leading-relaxed" aria-live="polite">
          {t(bodyKey)}
        </p>
        {last && <p className="mt-2 text-sm text-text-accent">{t("reopenHint")}</p>}

        <ol className="flex gap-1.5 mt-4" aria-hidden="true">
          {STEPS.map((_, i) => (
            <li key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-border-base/40"}`} />
          ))}
        </ol>

        <div className="flex items-center justify-between gap-2 mt-5">
          <button type="button" onClick={finish} className="min-h-11 px-2 text-sm text-text-accent underline underline-offset-2">
            {t("skip")}
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="min-h-11 px-4 rounded border border-border-base bg-bg-main text-accent-strong text-sm font-bold hover:bg-item-hover"
              >
                {t("back")}
              </button>
            )}
            <button
              type="button"
              onClick={() => (last ? finish() : setStep(step + 1))}
              className="min-h-11 px-4 rounded bg-primary text-on-primary text-sm font-bold hover:bg-primary/90"
            >
              {last ? t("done") : t("next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
