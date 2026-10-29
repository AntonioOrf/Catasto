import type { FilterOptions, QueryGroup } from "@catasto/shared";
import type { SortOrder } from "../catasto/lib/simple-filters";

/**
 * Ricerche d'esempio della home, per chi arriva senza sapere cosa cercare.
 * Le opzioni geografiche e di lookup hanno id che dipendono dal dump: si
 * cercano per etichetta fra quelle di GET /api/filters, e un esempio la cui
 * opzione non esiste non viene mostrato.
 */

export interface ExampleQuery {
  id: string;
  ast: QueryGroup;
  sort?: { sortBy: string; sortOrder: SortOrder };
}

const group = (...children: QueryGroup["children"]): QueryGroup => ({ kind: "group", op: "AND", children });

const optionId = (options: FilterOptions[keyof FilterOptions], match: RegExp) =>
  options.find((o) => match.test(o.label))?.id;

export function buildExamples(options: FilterOptions): ExampleQuery[] {
  const examples: ExampleQuery[] = [];

  const sanGiovanni = optionId(options.quartieri, /^san giovanni$/i);
  if (sanGiovanni !== undefined) {
    examples.push({
      id: "ricchiSanGiovanni",
      ast: group({ kind: "condition", field: "quartiere", operator: "eq", value: sanGiovanni }),
      sort: { sortBy: "fortune", sortOrder: "DESC" },
    });
  }

  // L'etichetta può essere già tradotta: si riconosce in entrambe le lingue.
  const contado = optionId(options.immigrazione, /contado|countryside/i);
  if (contado !== undefined) {
    examples.push({
      id: "immigratiContado",
      ast: group({ kind: "condition", field: "immigrazione", operator: "eq", value: contado }),
    });
  }

  examples.push({
    id: "imponibileAlto",
    ast: group({ kind: "condition", field: "imponibile", operator: "gte", value: 1000 }),
    sort: { sortBy: "imponibile", sortOrder: "DESC" },
  });
  examples.push({
    id: "parentiAnziani",
    ast: group({ kind: "condition", field: "eta_parente", operator: "gte", value: 80 }),
  });

  return examples;
}
