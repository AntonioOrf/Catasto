import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Send, X } from "lucide-react";
import { SEGNALAZIONE_LIMITS, type LuogoMappa } from "@catasto/shared";
import { useCreateSegnalazione } from "../api/create-segnalazione";
import { useModal } from "../../../hooks/useModal";
import { userMessage } from "../../../api/client";
import { useLanguage, useT } from "../../../i18n";
import { segnalazioneLuogoModalMessages as messages } from "./SegnalazioneLuogoModal.messages";

interface SegnalazioneLuogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Luogo della mappa da cui parte la segnalazione. */
  luogo: LuogoMappa | null;
  /** Certezza della posizione già tradotta, come nella pagina. */
  certezzaLabel: string;
}

const LAT = [42, 45] as const;
const LNG = [9, 13] as const;
const MAX_LUOGO = 300;
const NUMERO = /^-?\d+(\.\d+)?$/;

type Coordinate = { lat: number; lng: number };
type EsitoCoordinate = { stato: "vuote" } | { stato: "ok"; coordinate: Coordinate } | { stato: "errore" };

/** Legge "43.7701, 11.1052" (virgola, punto e virgola o spazi) e controlla l'intervallo della Toscana. */
function leggiCoordinate(testo: string): EsitoCoordinate {
  const pulito = testo.trim();
  if (!pulito) return { stato: "vuote" };
  const parti = pulito.split(/\s*[;,]\s*|\s+/).filter(Boolean);
  if (parti.length !== 2 || !parti.every((p) => NUMERO.test(p))) return { stato: "errore" };
  const [lat, lng] = parti.map(Number);
  if (lat < LAT[0] || lat > LAT[1] || lng < LNG[0] || lng > LNG[1]) return { stato: "errore" };
  return { stato: "ok", coordinate: { lat, lng } };
}

/** Numero con al massimo 6 decimali, senza zeri in coda. */
const sei = (n: number): string => String(Number(n.toFixed(6)));

/** Testo del luogo seguito da " — lat, lng"; solo le coordinate se il testo è vuoto. */
function componiValoreProposto(dove: string, coordinate: Coordinate | null): string {
  const testo = dove.trim();
  const coord = coordinate ? `${sei(coordinate.lat)}, ${sei(coordinate.lng)}` : "";
  if (testo && coord) return `${testo} — ${coord}`;
  return testo || coord;
}

export default function SegnalazioneLuogoModal({ isOpen, onClose, luogo, certezzaLabel }: SegnalazioneLuogoModalProps) {
  const [dove, setDove] = useState("");
  const [coordinate, setCoordinate] = useState("");
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [tentato, setTentato] = useState(false);

  const mutation = useCreateSegnalazione();
  const { lang } = useLanguage();
  const t = useT(messages);

  useEffect(() => {
    if (!isOpen) return;
    setDove("");
    setCoordinate("");
    setNote("");
    setWebsite("");
    setTentato(false);
    mutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset sull'apertura, non a ogni render della mutation
  }, [isOpen, luogo?.id]);

  const dialogRef = useRef<HTMLDivElement>(null);
  useModal(isOpen, onClose, dialogRef);

  if (!isOpen || !luogo) return null;

  const esito = leggiCoordinate(coordinate);
  const coordErrore = esito.stato === "errore";
  const senzaContenuto = !dove.trim() && esito.stato !== "ok" && !note.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTentato(true);
    if (coordErrore || senzaContenuto) return;
    mutation.mutate({
      id_fuoco: null,
      id_registrazione: luogo.id,
      tipo: "localizzazione",
      valore_proposto: componiValoreProposto(dove, esito.stato === "ok" ? esito.coordinate : null) || null,
      note: note.trim() || null,
      email: email || null,
      website,
    });
  };

  const labelClasses = "block text-[11px] small-caps text-text-accent mb-1";
  const inputClasses =
    "w-full bg-bg-main border border-border-base text-text-main text-sm rounded-ui px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-bg-main/95 backdrop-blur-sm p-0 sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="segnalazione-luogo-title"
        tabIndex={-1}
        className="bg-bg-sidebar border-0 sm:border border-border-base sm:rounded-ui w-full max-w-lg max-h-full sm:max-h-[90vh] flex flex-col overflow-hidden focus:outline-none"
      >
        <div className="flex items-start justify-between p-4 border-b border-border-base">
          <h2 id="segnalazione-luogo-title" className="text-base md:text-lg font-serif font-bold text-accent-strong flex items-center gap-2">
            <AlertCircle className="h-5 w-5" /> {t("title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-main hover:text-red-500 p-2.5 -m-2 rounded-ui transition-colors"
            title={t("close")}
            aria-label={t("close")}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {mutation.isSuccess ? (
          <div className="p-6 flex flex-col items-center text-center gap-3">
            <Check className="h-12 w-12 text-green-600" />
            <h3 className="font-bold text-text-main">{t("sentTitle")}</h3>
            <p className="text-sm text-text-accent">{t("sentBody")}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 min-h-11 bg-primary text-on-primary px-4 rounded-ui text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              {t("close")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto" noValidate>
            <section aria-label={t("summary")} className="text-sm bg-bg-main border border-dashed border-border-base rounded-ui px-3 py-2">
              <p className="font-semibold text-text-main">{luogo.nome}</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 mt-1">
                {luogo.piviere && (
                  <>
                    <dt className="text-text-accent">{t("piviere")}</dt>
                    <dd>{luogo.piviere}</dd>
                  </>
                )}
                {luogo.serie && (
                  <>
                    <dt className="text-text-accent">{t("serie")}</dt>
                    <dd>{luogo.serie}</dd>
                  </>
                )}
                <dt className="text-text-accent">{t("position")}</dt>
                <dd className="tabular-nums">{`${luogo.lat.toFixed(4)}, ${luogo.lng.toFixed(4)}`}</dd>
                <dt className="text-text-accent">{t("certainty")}</dt>
                <dd>{certezzaLabel}</dd>
              </dl>
            </section>

            <div>
              <label htmlFor="segn-luogo-dove" className={labelClasses}>{t("where")}</label>
              <input
                id="segn-luogo-dove"
                type="text"
                value={dove}
                onChange={(e) => setDove(e.target.value)}
                maxLength={MAX_LUOGO}
                placeholder={t("wherePlaceholder")}
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="segn-luogo-coord" className={labelClasses}>{t("coords")}</label>
              <input
                id="segn-luogo-coord"
                type="text"
                inputMode="decimal"
                value={coordinate}
                onChange={(e) => setCoordinate(e.target.value)}
                aria-invalid={coordErrore}
                aria-describedby="segn-luogo-coord-hint"
                placeholder="43.7701, 11.1052"
                className={inputClasses}
              />
              <p id="segn-luogo-coord-hint" className={`text-[11px] mt-1 ${coordErrore ? "text-red-600 dark:text-red-400" : "text-text-accent"}`}>
                {coordErrore ? t("coordsInvalid") : t("coordsHint")}
              </p>
            </div>

            <div>
              <label htmlFor="segn-luogo-note" className={labelClasses}>{t("notes")}</label>
              <textarea
                id="segn-luogo-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={SEGNALAZIONE_LIMITS.note}
                rows={3}
                placeholder={t("notesPlaceholder")}
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="segn-luogo-email" className={labelClasses}>{t("email")}</label>
              <input
                id="segn-luogo-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={SEGNALAZIONE_LIMITS.email}
                className={inputClasses}
              />
            </div>

            {/* Honeypot: fuori dal flusso di tab e invisibile allo screen reader. */}
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute opacity-0 h-0 w-0 pointer-events-none"
            />

            {tentato && senzaContenuto && !coordErrore && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">{t("needContent")}</p>
            )}
            {mutation.isError && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">{userMessage(mutation.error, t("sendError"), lang)}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-base">
              <button type="button" onClick={onClose} className="min-h-11 px-2 text-sm text-text-accent hover:underline">
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex items-center gap-2 min-h-11 bg-primary text-on-primary px-4 rounded-ui text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                {mutation.isPending ? t("sending") : t("send")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
