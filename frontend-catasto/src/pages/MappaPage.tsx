import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { LuogoMappa } from "@catasto/shared";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { useLanguage, useT } from "../i18n";
import { useMappaLuoghi } from "../hooks/useMappaLuoghi";
import MappaLeaflet, { type Sfondo } from "../features/mappa/MappaLeaflet";
import {
  CERTEZZE_MAPPA,
  COLORE_CERTEZZA,
  INDICATORI,
  classe,
  filtriDaQuery,
  mescola,
  pesoClasse,
  soglieQuantili,
  type CertezzaMappa,
  type Indicatore,
} from "../features/mappa/lib/mappa";
import { mappaPageMessages } from "./MappaPage.messages";

/** Colori del tema letti dalle variabili CSS; si rileggono quando cambia il tema (classe `dark`). */
function useColoriTema() {
  const leggi = () => {
    const css = getComputedStyle(document.documentElement);
    const v = (nome: string) => css.getPropertyValue(nome).trim() || "#888888";
    return {
      sicura: v(COLORE_CERTEZZA.sicura),
      approssimata: v(COLORE_CERTEZZA.approssimata),
      solo_piviere: v(COLORE_CERTEZZA.solo_piviere),
      scala: v("--chart-1"),
      fondo: v("--color-bg-main"),
      testo: v("--color-text-main"),
    };
  };
  const [colori, setColori] = useState(leggi);
  useEffect(() => {
    const osservatore = new MutationObserver(() => setColori(leggi()));
    osservatore.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => osservatore.disconnect();
  }, []);
  return colori;
}

export default function MappaPage() {
  const t = useT(mappaPageMessages);
  const { lang } = useLanguage();
  const location = useLocation();
  const filtri = useMemo(() => filtriDaQuery(location.search), [location.search]);
  const { dati, loading, error, unavailable, retry } = useMappaLuoghi(filtri, t("loading"));
  const colori = useColoriTema();

  const [indicatore, setIndicatore] = useState<Indicatore>("certezza");
  const [certezze, setCertezze] = useState<Set<CertezzaMappa>>(() => new Set(CERTEZZE_MAPPA));
  const [sfondo, setSfondo] = useState<Sfondo>("osm");
  const [soglia, setSoglia] = useState(1);
  const [selezionato, setSelezionato] = useState<number | null>(null);

  const fmt = useCallback(
    (n: number, cifre = 0) => n.toLocaleString(lang === "en" ? "en-GB" : "it-IT", { maximumFractionDigits: cifre }),
    [lang],
  );
  const fmtIndicatore = useCallback(
    (ind: Exclude<Indicatore, "certezza">, v: number | null) => {
      if (v === null) return t("none");
      if (ind === "quota_mestiere" || ind === "quota_migrazione") return `${fmt(v * 100)}%`;
      return fmt(v, ind === "ampiezza_media" ? 1 : 0);
    },
    [fmt, t],
  );

  const tutti = useMemo(() => dati?.luoghi ?? [], [dati]);
  const visibili = useMemo(
    () => tutti.filter((l) => certezze.has(l.certezza) && l.fuochi >= soglia),
    [tutti, certezze, soglia],
  );

  const soglie = useMemo(
    () =>
      indicatore === "certezza"
        ? []
        : soglieQuantili(visibili.map((l) => l[indicatore]).filter((v): v is number => v !== null)),
    [visibili, indicatore],
  );

  const colore = useCallback(
    (l: LuogoMappa) => {
      if (indicatore === "certezza") return colori[l.certezza];
      const v = l[indicatore];
      if (v === null) return mescola(colori.testo, colori.fondo, 30);
      return mescola(colori.scala, colori.fondo, pesoClasse(classe(v, soglie), soglie.length + 1));
    },
    [indicatore, colori, soglie],
  );

  const perCertezza = useMemo(() => {
    const conti = Object.fromEntries(CERTEZZE_MAPPA.map((c) => [c, { luoghi: 0, fuochi: 0 }])) as Record<
      CertezzaMappa,
      { luoghi: number; fuochi: number }
    >;
    for (const l of tutti) {
      conti[l.certezza].luoghi++;
      conti[l.certezza].fuochi += l.fuochi;
    }
    return conti;
  }, [tutti]);

  const scelto = tutti.find((l) => l.id === selezionato) ?? null;
  const nFiltri = Object.keys(filtri).length;
  const inMappa = dati ? dati.fuochi - dati.non_localizzati.fuochi : 0;
  const maxFuochi = Math.max(1, ...tutti.map((l) => l.fuochi));

  const toggleCertezza = (c: CertezzaMappa) =>
    setCertezze((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-text-main font-serif">
      <Header showHomeLink={true} />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[22rem_1fr] min-h-0">
        <aside className="order-2 lg:order-1 bg-bg-sidebar border-t lg:border-t-0 lg:border-r border-border-base p-5 flex flex-col gap-5 lg:overflow-y-auto lg:max-h-[calc(100vh-4rem)]">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-primary">{t("title")}</h2>
            <p className="text-text-accent">{t("lead")}</p>
            <p className="text-sm border border-border-base rounded-ui px-3 py-2">{t("prototype")}</p>
          </div>

          {nFiltri > 0 && (
            <div className="text-sm flex flex-col gap-1">
              <p>{t("filtersActive", { n: nFiltri })}</p>
              <Link to="/mappa" className="text-primary underline self-start">
                {t("filtersClear")}
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="mappa-indicatore" className="text-sm font-semibold">
              {t("colorBy")}
            </label>
            <select
              id="mappa-indicatore"
              value={indicatore}
              onChange={(e) => setIndicatore(e.target.value as Indicatore)}
              className="bg-bg-card border border-border-base rounded-ui px-2 py-1"
            >
              {INDICATORI.map((i) => (
                <option key={i} value={i}>
                  {t(`ind_${i}`)}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-semibold mb-1">{t("certainty")}</legend>
            {CERTEZZE_MAPPA.map((c) => (
              <label key={c} htmlFor={`mappa-cert-${c}`} className="grid grid-cols-[auto_auto_1fr] gap-2 items-start cursor-pointer">
                <input
                  id={`mappa-cert-${c}`}
                  type="checkbox"
                  checked={certezze.has(c)}
                  onChange={() => toggleCertezza(c)}
                  className="mt-1"
                />
                <span
                  aria-hidden="true"
                  className="inline-block w-3 h-3 mt-1.5 border-2"
                  style={{ borderColor: colori[c], background: mescola(colori[c], colori.fondo, 45), borderRadius: "50%" }}
                />
                <span className="flex flex-col">
                  <span className="font-semibold">{t(`cert_${c}`)}</span>
                  <span className="text-xs text-text-accent">{t(`cert_${c}_desc`)}</span>
                  <span className="text-xs tabular-nums text-text-accent">
                    {t("countPlaces", { luoghi: fmt(perCertezza[c].luoghi), fuochi: fmt(perCertezza[c].fuochi) })}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          {indicatore !== "certezza" && soglie.length > 0 && (
            <div className="flex flex-col gap-1" aria-label={t(`ind_${indicatore}`)}>
              <div className="flex h-3">
                {Array.from({ length: soglie.length + 1 }, (_, i) => (
                  <span key={i} className="flex-1" style={{ background: mescola(colori.scala, colori.fondo, pesoClasse(i, soglie.length + 1)) }} />
                ))}
              </div>
              <div className="flex justify-between text-xs tabular-nums text-text-accent">
                <span>
                  {t("legendLow")} (&lt; {fmtIndicatore(indicatore, soglie[0])})
                </span>
                <span>
                  {t("legendHigh")} (≥ {fmtIndicatore(indicatore, soglie[soglie.length - 1])})
                </span>
              </div>
            </div>
          )}

          <fieldset className="flex flex-col gap-1">
            <legend className="text-sm font-semibold mb-1">{t("background")}</legend>
            {(["osm", "inghirami"] as const).map((s) => (
              <label key={s} htmlFor={`mappa-sfondo-${s}`} className="flex gap-2 items-center cursor-pointer">
                <input id={`mappa-sfondo-${s}`} type="radio" name="mappa-sfondo" checked={sfondo === s} onChange={() => setSfondo(s)} />
                {t(`bg_${s}`)}
              </label>
            ))}
          </fieldset>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-baseline">
              <label htmlFor="mappa-soglia" className="text-sm font-semibold">
                {t("threshold")}
              </label>
              <span className="tabular-nums text-sm">{fmt(soglia)}</span>
            </div>
            <input
              id="mappa-soglia"
              type="range"
              min={1}
              max={Math.min(200, maxFuochi)}
              value={soglia}
              onChange={(e) => setSoglia(Number(e.target.value))}
            />
          </div>

          {dati && (
            <div className="text-sm flex flex-col gap-1 border-t border-border-base pt-3">
              <p className="font-semibold">{t("inMap", { pct: fmt(dati.fuochi ? (inMappa / dati.fuochi) * 100 : 0) })}</p>
              <p className="text-text-accent">
                {t("notLocated", { fuochi: fmt(dati.non_localizzati.fuochi), luoghi: fmt(dati.non_localizzati.luoghi) })}
              </p>
            </div>
          )}

          <section className="flex flex-col gap-2 border-t border-border-base pt-3" aria-live="polite">
            <h3 className="font-semibold">{t("selected")}</h3>
            {scelto ? (
              <div className="flex flex-col gap-1 text-sm">
                <p className="text-lg font-semibold leading-tight">{scelto.nome}</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
                  {scelto.nome_moderno && (
                    <>
                      <dt className="text-text-accent">{t("modern")}</dt>
                      <dd>{scelto.nome_moderno}</dd>
                    </>
                  )}
                  {scelto.piviere && (
                    <>
                      <dt className="text-text-accent">{t("piviere")}</dt>
                      <dd>{scelto.piviere}</dd>
                    </>
                  )}
                  {scelto.serie && (
                    <>
                      <dt className="text-text-accent">{t("serie")}</dt>
                      <dd>{scelto.serie}</dd>
                    </>
                  )}
                  <dt className="text-text-accent">{t("certainty")}</dt>
                  <dd>{t(`cert_${scelto.certezza}`)}</dd>
                  <dt className="text-text-accent">{t("fuochi")}</dt>
                  <dd className="tabular-nums">{fmt(scelto.fuochi)}</dd>
                  {(["imponibile_medio", "quota_mestiere", "quota_migrazione", "ampiezza_media"] as const).map((ind) => (
                    <span key={ind} className="contents">
                      <dt className="text-text-accent">{t(`ind_${ind}`)}</dt>
                      <dd className="tabular-nums">{fmtIndicatore(ind, scelto[ind])}</dd>
                    </span>
                  ))}
                </dl>
              </div>
            ) : (
              <p className="text-sm text-text-accent">{t("selectHint")}</p>
            )}
          </section>

          {visibili.length > 0 && (
            <nav className="flex flex-col gap-1 border-t border-border-base pt-3" aria-label={t("top")}>
              <h3 className="font-semibold">{t("top")}</h3>
              <ul className="flex flex-col text-sm">
                {visibili
                  .slice()
                  .sort((a, b) => b.fuochi - a.fuochi)
                  .slice(0, 8)
                  .map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => setSelezionato(l.id)}
                        aria-pressed={l.id === selezionato}
                        className="w-full flex justify-between gap-2 px-2 py-1 text-left hover:bg-item-hover rounded-ui"
                      >
                        <span className="min-w-0 truncate">{l.nome}</span>
                        <span className="tabular-nums text-text-accent">{fmt(l.fuochi)}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            </nav>
          )}

          <p className="text-xs text-text-accent">{t("method")}</p>
        </aside>

        <div className="order-1 lg:order-2 relative h-[60vh] lg:h-auto min-h-[24rem] min-w-0">
          {(loading || error || unavailable || (dati && !dati.disponibile)) && (
            <div className="absolute inset-x-0 top-0 z-[500] m-3 p-3 bg-bg-card border border-border-base rounded-ui text-sm flex gap-3 items-center" role="status">
              <span>{unavailable ? t("unavailable") : error ? error : dati && !dati.disponibile ? t("noTable") : t("loading")}</span>
              {error && !unavailable && (
                <button type="button" onClick={retry} className="text-primary underline">
                  {t("retry")}
                </button>
              )}
            </div>
          )}
          <div className="absolute inset-0">
            <MappaLeaflet
              luoghi={visibili}
              colore={colore}
              sfondo={sfondo}
              selezionato={selezionato}
              onSeleziona={setSelezionato}
              coloreSelezione={colori.testo}
              etichetta={t("mapLabel")}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
