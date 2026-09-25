import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, Send, X } from "lucide-react";
import {
  FIELD_REGISTRY,
  SEGNALAZIONE_LIMITS,
  SEGNATURA_PREFISSO,
  TIPI_SEGNALAZIONE,
  TIPO_SEGNALAZIONE_LABELS,
  type TipoSegnalazione,
} from "@catasto/shared";
import { useCreateSegnalazione } from "../api/create-segnalazione";
import { useModal } from "../../../hooks/useModal";

interface SegnalazioneModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Riga del catasto da cui parte la segnalazione. */
  row: any;
  /** Tipo preselezionato: dal visore si segnala una segnatura, dalla tabella un dato. */
  defaultTipo?: TipoSegnalazione;
  defaultCampo?: string;
}

const REPORTABLE = FIELD_REGISTRY.filter((f) => f.reportable && !f.editorial);

/**
 * Segnatura completa da inviare: il prefisso del fondo è implicito, a meno che
 * l'utente dichiari un altro fondo o lo abbia già scritto per esteso.
 */
const composeSegnatura = (value: string, altroFondo: boolean): string => {
  const trimmed = value.trim();
  if (!trimmed || altroFondo || /^asfi\b/i.test(trimmed)) return trimmed;
  return `${SEGNATURA_PREFISSO} ${trimmed}`;
};

/** Il valore attualmente mostrato all'utente per il campo scelto. */
const currentValue = (row: any, campo: string): string => {
  const raw = row?.[campo];
  return raw === null || raw === undefined || raw === "" ? "" : String(raw);
};

export default function SegnalazioneModal({
  isOpen,
  onClose,
  row,
  defaultTipo = "dato_errato",
  defaultCampo,
}: SegnalazioneModalProps) {
  const [tipo, setTipo] = useState<TipoSegnalazione>(defaultTipo);
  const [campo, setCampo] = useState(defaultCampo ?? REPORTABLE[0].key);
  const [valoreProposto, setValoreProposto] = useState("");
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [altroFondo, setAltroFondo] = useState(false);

  const mutation = useCreateSegnalazione();

  useEffect(() => {
    if (!isOpen) return;
    setTipo(defaultTipo);
    setCampo(defaultCampo ?? REPORTABLE[0].key);
    setValoreProposto("");
    setNote("");
    setWebsite("");
    setAltroFondo(false);
    mutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset sull'apertura, non a ogni render della mutation
  }, [isOpen, defaultTipo, defaultCampo]);

  const dialogRef = useRef<HTMLDivElement>(null);
  useModal(isOpen, onClose, dialogRef);

  const valoreAttuale = useMemo(
    () => (tipo === "dato_errato" ? currentValue(row, campo) : ""),
    [row, campo, tipo],
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      id_fuoco: row?.id ?? null,
      tipo,
      campo: tipo === "dato_errato" ? campo : null,
      // Snapshot: la segnalazione deve restare leggibile anche se il dato
      // cambia prima che la redazione la esamini.
      valore_attuale: valoreAttuale || null,
      valore_proposto:
        (tipo === "segnatura" ? composeSegnatura(valoreProposto, altroFondo) : valoreProposto) ||
        null,
      note: note || null,
      email: email || null,
      website,
    });
  };

  const labelClasses = "block text-[10px] uppercase tracking-wider text-text-accent mb-1";
  const inputClasses =
    "w-full bg-bg-main border border-border-base text-text-main text-sm rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-bg-main/95 backdrop-blur-sm p-0 sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="segnalazione-title"
        tabIndex={-1}
        className="bg-bg-sidebar border-0 sm:border border-border-base shadow-2xl sm:rounded-lg w-full max-w-lg max-h-full sm:max-h-[90vh] flex flex-col overflow-hidden focus:outline-none"
      >
        <div className="flex items-start justify-between p-4 border-b border-border-base">
          <div>
            <h2 id="segnalazione-title" className="text-base md:text-lg font-serif font-bold text-item-selected dark:text-text-symbols flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Segnala un problema
            </h2>
            {row?.nome && (
              <p className="text-xs text-text-accent mt-1">
                Fuoco: <span className="font-semibold text-text-main">{row.nome}</span>
                {row.volume && ` · Vol. ${row.volume} c. ${row.foglio}`}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-main hover:text-red-500 p-1 rounded transition-colors"
            title="Chiudi"
            aria-label="Chiudi"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {mutation.isSuccess ? (
          <div className="p-6 flex flex-col items-center text-center gap-3">
            <Check className="h-12 w-12 text-green-600" />
            <h3 className="font-bold text-text-main">Segnalazione inviata</h3>
            <p className="text-sm text-text-accent">
              Sarà verificata dalla redazione prima di essere pubblicata. Grazie del contributo.
            </p>
            <button
              onClick={onClose}
              className="mt-2 bg-primary text-white px-4 py-2 rounded text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              Chiudi
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
            <fieldset>
              <legend className={labelClasses}>Tipo di segnalazione</legend>
              {/* Pulsanti rapidi invece di un menu (issue #13): i tipi sono tre e
                  vederli tutti costa un clic in meno. Radio native nascoste: la
                  navigazione con le frecce viene gratis. */}
              <div className="grid grid-cols-3 gap-2">
                {TIPI_SEGNALAZIONE.map((t) => (
                  <label key={t} className="cursor-pointer">
                    <input
                      type="radio"
                      name="segn-tipo"
                      value={t}
                      checked={tipo === t}
                      onChange={() => setTipo(t)}
                      className="sr-only peer"
                    />
                    <span className="flex h-full items-center justify-center text-center rounded border border-border-base bg-bg-main px-2 py-2 text-xs font-semibold text-text-main transition-colors hover:bg-item-hover peer-checked:bg-primary peer-checked:border-primary peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary/60">
                      {TIPO_SEGNALAZIONE_LABELS[t]}
                    </span>
                  </label>
                ))}
              </div>
              {tipo === "segnatura" && (
                <p className="text-[11px] text-text-accent mt-1 italic">
                  La segnatura della portata non è presente nella base dati dell'Archivio: viene
                  ricostruita dalle segnalazioni e pubblicata dopo la verifica.
                </p>
              )}
            </fieldset>

            {tipo === "dato_errato" && (
              <>
                <div>
                  <label htmlFor="segn-campo" className={labelClasses}>Campo errato</label>
                  <select
                    id="segn-campo"
                    value={campo}
                    onChange={(e) => setCampo(e.target.value)}
                    className={inputClasses}
                  >
                    {REPORTABLE.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className={labelClasses}>Valore attualmente pubblicato</span>
                  <p className="text-sm text-text-main bg-bg-main border border-dashed border-border-base rounded px-3 py-2">
                    {valoreAttuale || <span className="italic text-text-accent">vuoto</span>}
                  </p>
                </div>
              </>
            )}

            <div>
              <label htmlFor="segn-valore" className={labelClasses}>
                {tipo === "segnatura" ? "Segnatura corretta" : "Valore corretto (facoltativo)"}
              </label>
              <div className="flex items-stretch">
                {tipo === "segnatura" && !altroFondo && (
                  <span className="flex items-center whitespace-nowrap rounded-l border border-r-0 border-border-base bg-bg-sidebar px-3 text-sm text-text-accent">
                    {SEGNATURA_PREFISSO}
                  </span>
                )}
                <input
                  id="segn-valore"
                  type="text"
                  value={valoreProposto}
                  onChange={(e) => setValoreProposto(e.target.value)}
                  maxLength={SEGNALAZIONE_LIMITS.valore - SEGNATURA_PREFISSO.length - 1}
                  required={tipo === "segnatura"}
                  placeholder={
                    tipo !== "segnatura"
                      ? "Valore corretto..."
                      : altroFondo
                        ? "Segnatura completa, es. ASFi, Estimo 12, c. 3r"
                        : "Volume e carta, es. 81, c. 245r"
                  }
                  className={`${inputClasses} ${tipo === "segnatura" && !altroFondo ? "rounded-l-none" : ""}`}
                />
              </div>
              {tipo === "segnatura" && (
                <label className="mt-1.5 flex items-center gap-1.5 text-[11px] text-text-accent cursor-pointer">
                  <input
                    type="checkbox"
                    checked={altroFondo}
                    onChange={(e) => setAltroFondo(e.target.checked)}
                    className="accent-primary"
                  />
                  La portata è in un fondo diverso da {SEGNATURA_PREFISSO}
                </label>
              )}
            </div>

            <div>
              <label htmlFor="segn-note" className={labelClasses}>Note</label>
              <textarea
                id="segn-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={SEGNALAZIONE_LIMITS.note}
                rows={3}
                placeholder="Fonte, riferimento archivistico, dettagli..."
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="segn-email" className={labelClasses}>Email (facoltativa, per chiarimenti)</label>
              <input
                id="segn-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={SEGNALAZIONE_LIMITS.email}
                className={inputClasses}
              />
            </div>

            {/* Honeypot: fuori dal flusso di tab e invisibile allo screen reader.
                Compilato solo da bot che riempiono ogni input del form. */}
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

            {mutation.isError && (
              <p className="text-sm text-red-500">{(mutation.error as Error).message}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-base">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-text-accent hover:underline"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                {mutation.isPending ? "Invio..." : "Invia segnalazione"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
