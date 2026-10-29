/** Id di scheda e pannello, per `aria-controls`, `role="tabpanel"` e `aria-labelledby`. */
export const tabIds = (idPrefix: string, key: string) => ({ tab: `${idPrefix}-tab-${key}`, panel: `${idPrefix}-panel-${key}` });
