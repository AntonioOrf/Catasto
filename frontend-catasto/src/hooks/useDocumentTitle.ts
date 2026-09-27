import { useEffect } from "react";

export const SITE_TITLE = "Catasto 1427";

/** Titolo della scheda per route: senza, tutte le pagine si chiamano uguale. */
export function useDocumentTitle(page?: string) {
  useEffect(() => {
    document.title = page ? `${page} · ${SITE_TITLE}` : SITE_TITLE;
  }, [page]);
}
