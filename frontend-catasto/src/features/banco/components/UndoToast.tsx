import { useEffect } from "react";
import { useT } from "../../../i18n";
import { finderMessages } from "../finder.messages";
import type { Notice } from "../useTargetActions";

const VISIBLE_MS = 8000;

/**
 * Esito dell'ultima aggiunta o rimozione, in basso al centro sopra la barra
 * della selezione, con «Annulla». La regione viva resta sempre montata, così
 * il lettore di schermo annuncia anche i messaggi successivi.
 */
export default function UndoToast({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
  const t = useT(finderMessages);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(onClose, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [notice, onClose]);

  return (
    <div role="status" aria-live="polite" className="fixed inset-x-0 bottom-14 z-50 flex justify-center px-4 pointer-events-none">
      {notice && (
        <p className="pointer-events-auto flex flex-wrap items-baseline gap-x-4 max-w-full bg-text-main text-bg-main rounded-ui px-4 py-2 text-sm">
          <span>{notice.text}</span>
          {notice.undo && (
            <button
              type="button"
              onClick={() => {
                notice.undo?.();
                onClose();
              }}
              className="min-h-8 underline underline-offset-4 font-semibold"
            >
              {t("undo")}
            </button>
          )}
        </p>
      )}
    </div>
  );
}
