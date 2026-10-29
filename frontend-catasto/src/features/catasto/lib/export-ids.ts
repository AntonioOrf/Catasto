import { emptyGroup } from "@catasto/shared";
import { downloadExport } from "../../../api/catastoService";
import type { Lang } from "../../../i18n";
import { saveBlob } from "./download";
import { EMPTY_SIMPLE_FILTERS } from "./simple-filters";

/**
 * CSV dei fuochi scelti a mano (selezione, raccolta) con il filtro `ids`;
 * separatore secondo la lingua, come l'export della tabella. Restituisce il
 * nome del file scaricato.
 */
export async function exportFuochiIds(ids: readonly number[], lang: Lang): Promise<string> {
  const { blob, filename } = await downloadExport(
    { ...EMPTY_SIMPLE_FILTERS, sortBy: "nome", sortOrder: "ASC", advancedMode: false, ast: emptyGroup("AND"), ids: ids.join(",") },
    { format: "csv", parenti: false, sep: lang === "it" ? "semicolon" : "comma" },
  );
  saveBlob(blob, filename);
  return filename;
}
