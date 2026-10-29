import { describeQuery, type OptionsByKey, type QueryNode } from "@catasto/shared";
import { getLang, type Lang } from "../../../i18n/language";

export type { OptionsByKey };

/**
 * Traduce l'AST in linguaggio leggibile (nella lingua attiva). Serve
 * all'anteprima del builder: una query annidata con AND/OR è facile da
 * comporre per sbaglio, e vederla scritta è l'unico modo in cui un utente non
 * tecnico si accorge dell'errore. Le etichette delle opzioni arrivano già
 * tradotte dal backend. La stessa descrizione finisce nell'intestazione degli
 * export (vedi `describeQuery` in `@catasto/shared`).
 */
export function describeNode(node: QueryNode, options: OptionsByKey, depth = 0, lang: Lang = getLang()): string {
  return describeQuery(node, options, lang, depth);
}
