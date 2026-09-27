/**
 * Valore di TRUST_PROXY nel formato atteso da Express. Una stringa viene letta
 * come indirizzo o nome di subnet: "true" lancerebbe `invalid IP address` e
 * bloccherebbe l'avvio, quindi booleani e numeri vanno convertiti.
 */
export const parseTrustProxy = (value: string | undefined): boolean | number | string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return /^\d+$/.test(trimmed) ? Number(trimmed) : trimmed;
};
