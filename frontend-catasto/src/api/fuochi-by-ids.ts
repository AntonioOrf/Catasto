import { FUOCHI_BY_IDS_MAX, type Fuoco } from "@catasto/shared";
import { fetchFuochiByIds } from "./catastoService";

/** L'endpoint accetta FUOCHI_BY_IDS_MAX id per richiesta: una selezione grande va a blocchi. */
export async function fetchFuochiByIdsChunked(ids: readonly number[], signal?: AbortSignal): Promise<Fuoco[]> {
  const chunks: number[][] = [];
  for (let i = 0; i < ids.length; i += FUOCHI_BY_IDS_MAX) chunks.push(ids.slice(i, i + FUOCHI_BY_IDS_MAX));
  return (await Promise.all(chunks.map((chunk) => fetchFuochiByIds(chunk, signal)))).flat();
}
