import { Sparkles } from "lucide-react";
import type { FilterOptions } from "@catasto/shared";
import { useFilters } from "../../context/FilterContext";
import { useT } from "../../i18n";
import { buildExamples } from "./example-queries";
import { examplesMessages } from "./examples.messages";

/**
 * Ricerche pronte, visibili solo finché non c'è alcun filtro: un clic le
 * carica nella ricerca avanzata, dove si vedono scritte e si possono
 * modificare, come un link condiviso `#q=`.
 */
export default function ExampleQueries({ filterOptions }: { filterOptions: FilterOptions }) {
  const t = useT(examplesMessages);
  const { applyQuery, activeFilterCount, astConditionCount } = useFilters();
  if (activeFilterCount > 0 || astConditionCount > 0) return null;

  return (
    <section aria-labelledby="examples-title" className="mb-6 -mt-2">
      <h2 id="examples-title" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-strong mb-2">
        <Sparkles className="h-4 w-4" aria-hidden="true" /> {t("title")}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {buildExamples(filterOptions).map((example) => (
          <li key={example.id}>
            <button
              type="button"
              onClick={() => applyQuery(example.ast, example.sort)}
              className="inline-flex items-center min-h-11 px-4 rounded-full border border-border-base bg-bg-sidebar text-sm text-text-main hover:border-primary hover:text-primary transition-colors"
            >
              {t(example.id as keyof (typeof examplesMessages)["it"])}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
