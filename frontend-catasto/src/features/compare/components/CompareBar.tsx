import { COMPARE_MAX_FUOCHI, COMPARE_MIN_FUOCHI } from "@catasto/shared";
import { Columns3, X } from "lucide-react";
import { useT } from "../../../i18n";
import { useCompare } from "../compare-context";
import { compareMessages } from "../compare.messages";

/**
 * Barra fissa in basso con i fuochi scelti per il confronto: resta visibile
 * cambiando pagina o ricerca. Compare solo con almeno un fuoco selezionato;
 * lo spaziatore evita che copra il fondo della pagina.
 */
export default function CompareBar() {
  const t = useT(compareMessages);
  const { ids, fuochi, removedCount, remove, clear, openView } = useCompare();
  const names = new Map(fuochi.map((f) => [Number(f.id), f.nome]));
  const enough = ids.length >= COMPARE_MIN_FUOCHI;

  return (
    <>
      {/* Sempre montata: annuncia i fuochi tolti da un link anche a barra chiusa. */}
      <p role="status" aria-live="polite" className="sr-only">
        {removedCount === 1 ? t("missingOne") : removedCount > 1 ? t("missing", { n: removedCount }) : ""}
      </p>
      {ids.length > 0 && (
        <>
          <div aria-hidden="true" className="h-28 md:h-20" />
          <section
            aria-label={t("region")}
            className="fixed inset-x-0 bottom-0 z-40 bg-bg-sidebar border-t-2 border-primary shadow-[0_-4px_16px_rgba(0,0,0,0.15)] px-3 py-2 md:px-6 md:py-3"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-accent-strong">
                  {t("selected", { n: ids.length, max: COMPARE_MAX_FUOCHI })}
                </p>
                {removedCount > 0 && (
                  <p className="text-xs text-text-accent">
                    {removedCount === 1 ? t("missingOne") : t("missing", { n: removedCount })}
                  </p>
                )}
                <ul className="flex gap-2 overflow-x-auto py-1">
                  {ids.map((id) => {
                    const nome = names.get(id) ?? `#${id}`;
                    return (
                      <li key={id} className="shrink-0 inline-flex items-center gap-1 bg-bg-main border border-border-base rounded-full pl-3 pr-1 text-xs text-text-main">
                        <span className="max-w-40 truncate">{nome}</span>
                        <button
                          type="button"
                          onClick={() => remove(id)}
                          aria-label={t("remove", { nome })}
                          className="inline-flex items-center justify-center min-h-8 min-w-8 rounded-full hover:bg-item-hover"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {!enough && <p className="text-xs text-text-accent">{t("needMore", { min: COMPARE_MIN_FUOCHI })}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clear}
                  className="min-h-11 px-3 rounded border border-border-base bg-bg-main text-accent-strong text-sm font-bold hover:bg-item-hover"
                >
                  {t("clear")}
                </button>
                <button
                  type="button"
                  onClick={openView}
                  disabled={!enough}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded bg-primary text-on-primary text-sm font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Columns3 className="h-4 w-4" aria-hidden="true" /> {t("compare")}
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
