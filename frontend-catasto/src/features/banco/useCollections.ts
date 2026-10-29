import { useEffect, useState } from "react";
import { COLLECTIONS_EVENT, loadCollections, type Raccolta } from "./collections";

/** Raccolte salvate, aggiornate a ogni modifica fatta altrove nella pagina. */
export function useCollections(): Raccolta[] {
  const [collections, setCollections] = useState<Raccolta[]>(loadCollections);
  useEffect(() => {
    // Il dettaglio dell'evento porta la lista: vale anche se il localStorage non scrive.
    const onChange = (e: Event) => setCollections((e as CustomEvent<Raccolta[]>).detail ?? loadCollections());
    window.addEventListener(COLLECTIONS_EVENT, onChange);
    return () => window.removeEventListener(COLLECTIONS_EVENT, onChange);
  }, []);
  return collections;
}
