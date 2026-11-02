import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LuogoMappa } from "@catasto/shared";
import { raggio } from "./lib/mappa";

/**
 * Fondo storico: Carta geometrica della Toscana di G. Inghirami (1830), WMS CASTORE
 * della Regione Toscana. Il servizio in cache è quello usato dal visore Geoscopio;
 * il vecchio `wmsraster/…?map=wmscastore` non risponde più.
 */
const WMS_CASTORE = "https://www502.regione.toscana.it/castore_cached/wms?map_mnt=castore";
const STRATO_INGHIRAMI = "r_toscan_cst_inghirami_riempimento_fogli_sviluppi@96dpi";
const TOSCANA: L.LatLngBoundsExpression = [
  [42.9, 10.2],
  [44.25, 12.2],
];

export type Sfondo = "osm" | "inghirami";

interface Props {
  luoghi: LuogoMappa[];
  /** Colore concreto (#rrggbb) di ogni luogo. */
  colore: (l: LuogoMappa) => string;
  sfondo: Sfondo;
  selezionato: number | null;
  onSeleziona: (id: number) => void;
  /** Colore del bordo del luogo selezionato. */
  coloreSelezione: string;
  etichetta: string;
  /** Se presente, centra la mappa su questo punto (ogni nuovo oggetto è una nuova richiesta). */
  centraSu?: { lat: number; lng: number; zoom?: number } | null;
}

/** Zoom con cui la mappa si centra su un luogo. */
export const ZOOM_LUOGO = 12;

/**
 * Mappa Leaflet: cerchi su canvas (migliaia di luoghi restano fluidi), fondo
 * OpenStreetMap o Inghirami. La mappa si crea una volta; luoghi, colori e
 * fondo si aggiornano senza ricrearla.
 */
export default function MappaLeaflet({ luoghi, colore, sfondo, selezionato, onSeleziona, coloreSelezione, etichetta, centraSu }: Props) {
  const contenitore = useRef<HTMLDivElement>(null);
  const mappa = useRef<L.Map | null>(null);
  const strati = useRef<{ osm: L.TileLayer; inghirami: L.TileLayer.WMS; cerchi: L.LayerGroup } | null>(null);
  const onSelezionaRef = useRef(onSeleziona);
  onSelezionaRef.current = onSeleziona;

  useEffect(() => {
    if (!contenitore.current) return;
    const m = L.map(contenitore.current, { preferCanvas: true, minZoom: 7, maxZoom: 15 }).fitBounds(TOSCANA);
    m.attributionControl.setPrefix(false);
    const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    });
    const inghirami = L.tileLayer.wms(WMS_CASTORE, {
      layers: STRATO_INGHIRAMI,
      format: "image/png",
      transparent: false,
      // Server lento: tile da 512 px dimezzano le richieste.
      tileSize: 512,
      zoomOffset: -1,
      opacity: 0.9,
      attribution: "Regione Toscana, Carta dell'Inghirami (1830)",
    });
    const cerchi = L.layerGroup().addTo(m);
    mappa.current = m;
    strati.current = { osm, inghirami, cerchi };
    return () => {
      m.remove();
      mappa.current = null;
      strati.current = null;
    };
  }, []);

  useEffect(() => {
    const m = mappa.current;
    const s = strati.current;
    if (!m || !s) return;
    // La carta attuale resta sempre sotto: dove una tile storica non arriva si vede quella.
    if (!m.hasLayer(s.osm)) s.osm.addTo(m).bringToBack();
    if (sfondo === "inghirami") s.inghirami.addTo(m);
    else m.removeLayer(s.inghirami);
  }, [sfondo]);

  useEffect(() => {
    if (centraSu) mappa.current?.setView([centraSu.lat, centraSu.lng], centraSu.zoom ?? ZOOM_LUOGO);
  }, [centraSu]);

  useEffect(() => {
    const s = strati.current;
    if (!s) return;
    s.cerchi.clearLayers();
    // Dal più grande al più piccolo: i luoghi piccoli restano cliccabili sopra i grandi.
    for (const l of [...luoghi].sort((a, b) => b.fuochi - a.fuochi)) {
      const c = colore(l);
      const scelto = l.id === selezionato;
      L.circleMarker([l.lat, l.lng], {
        radius: raggio(l.fuochi),
        color: scelto ? coloreSelezione : c,
        weight: scelto ? 3 : 1,
        fillColor: c,
        fillOpacity: scelto ? 0.75 : 0.45,
      })
        .on("click", () => onSelezionaRef.current(l.id))
        .bindTooltip(`${l.nome} · ${l.fuochi}`, { direction: "top" })
        .addTo(s.cerchi);
    }
  }, [luoghi, colore, selezionato, coloreSelezione]);

  return <div ref={contenitore} className="h-full w-full" role="region" aria-label={etichetta} />;
}
