import { fieldLabelIn, operatorLabelIn, type Operator } from "@catasto/shared";
import { getLang, type Lang } from "./language";

/**
 * Etichette dei campi e degli operatori nella lingua attiva. Le traduzioni
 * stanno in `@catasto/shared` (servono anche al backend per gli export): il
 * registry resta in italiano.
 */
export function fieldLabel(key: string, lang: Lang = getLang()): string {
  return fieldLabelIn(key, lang);
}

export function operatorLabel(operator: Operator, lang: Lang = getLang()): string {
  return operatorLabelIn(operator, lang);
}

export { MISSING_FIELD_TRANSLATIONS } from "@catasto/shared";
