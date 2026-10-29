import { useState } from "react";
import { COMPARE_MAX_FUOCHI, COMPARE_MIN_FUOCHI, emptyGroup } from "@catasto/shared";
import { downloadExport } from "../../../api/catastoService";
import { userMessage } from "../../../api/client";
import { useLanguage, useT } from "../../../i18n";
import { saveBlob } from "../../catasto/lib/download";
import { EMPTY_SIMPLE_FILTERS } from "../../catasto/lib/simple-filters";
import { useCompare } from "../compare-context";
import { compareMessages } from "../compare.messages";
import AddToCollection from "./AddToCollection";

/** Nomi scritti per intero nella barra; gli altri si contano. */
const NAMES_SHOWN = 3;

const linkClasses = "min-h-11 inline-flex items-center text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary disabled:opacity-50";

/**
 * Barra della selezione, fissa in basso su una riga sola: chi è scelto e le
 * azioni (raccolta, export, deseleziona, confronto). La scelta resta
 * un'azione secondaria: niente pulsanti grandi né posti vuoti, solo un filo
 * in alto. Compare con almeno un fuoco selezionato; lo spaziatore evita che
 * copra il fondo della pagina.
 */
export default function CompareBar() {
  const t = useT(compareMessages);
  const { lang } = useLanguage();
  const { ids, fuochi, removedCount, remove, clear, openView, canCompare } = useCompare();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const names = new Map(fuochi.map((f) => [Number(f.id), f.nome]));
  const shown = ids.slice(0, NAMES_SHOWN);

  const exportSelected = async () => {
    setBusy(true);
    setStatus(t("exporting"));
    try {
      const { blob, filename } = await downloadExport(
        { ...EMPTY_SIMPLE_FILTERS, sortBy: "nome", sortOrder: "ASC", advancedMode: false, ast: emptyGroup("AND"), ids: ids.join(",") },
        { format: "csv", parenti: false, sep: lang === "it" ? "semicolon" : "comma" },
      );
      saveBlob(blob, filename);
      setStatus(t("exported", { file: filename }));
    } catch (error) {
      setStatus(userMessage(error, t("exportFailed"), lang));
    } finally {
      setBusy(false);
    }
  };

  const removed = removedCount === 1 ? t("missingOne") : removedCount > 1 ? t("missing", { n: removedCount }) : "";

  return (
    <>
      {/* Sempre montata: annuncia esiti e fuochi tolti anche a barra chiusa. */}
      <p role="status" aria-live="polite" className="sr-only">
        {[removed, status].filter(Boolean).join(" ")}
      </p>
      {ids.length > 0 && (
        <>
          <div aria-hidden="true" className="h-28 md:h-16" />
          <section aria-label={t("region")} className="fixed inset-x-0 bottom-0 z-40 bg-bg-sidebar border-t border-border-base px-3 md:px-6 py-1.5 text-sm">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
              <p className="min-w-0 flex-1 basis-full md:basis-auto">
                <strong className="font-semibold text-accent-strong">
                  {ids.length === 1 ? t("selectedOne") : t("selected", { n: ids.length })}
                </strong>
                {": "}
                {shown.map((id, i) => {
                  const nome = names.get(id) ?? `#${id}`;
                  return (
                    <span key={id} className="whitespace-nowrap">
                      {i > 0 && ", "}
                      <span>{nome}</span>
                      <button
                        type="button"
                        onClick={() => remove(id)}
                        aria-label={t("remove", { nome })}
                        title={t("remove", { nome })}
                        className="ml-0.5 inline-flex items-center min-h-8 px-0.5 text-text-accent hover:text-primary"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                {ids.length > NAMES_SHOWN && <span className="text-text-accent"> {t("others", { n: ids.length - NAMES_SHOWN })}</span>}
                {(removed || status) && <span className="block text-xs text-text-accent">{[removed, status].filter(Boolean).join(" ")}</span>}
              </p>

              <AddToCollection ids={ids} onAdded={setStatus} />
              <button type="button" onClick={exportSelected} disabled={busy} title={t("exportSelectedTitle")} className={linkClasses}>
                {t("exportSelected")}
              </button>
              <button type="button" onClick={clear} className={linkClasses.replace("text-primary", "text-text-accent")}>
                {t("clear")}
              </button>
              <button
                type="button"
                onClick={openView}
                disabled={!canCompare}
                title={canCompare ? undefined : t("compareRange", { min: COMPARE_MIN_FUOCHI, max: COMPARE_MAX_FUOCHI })}
                aria-describedby={canCompare ? undefined : "compare-range-hint"}
                className="min-h-9 px-3 rounded-ui bg-primary text-on-primary font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("compare")}
              </button>
              {!canCompare && (
                <span id="compare-range-hint" className="sr-only">
                  {t("compareRange", { min: COMPARE_MIN_FUOCHI, max: COMPARE_MAX_FUOCHI })}
                </span>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
