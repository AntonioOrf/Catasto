import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, Send, X } from "lucide-react";
import {
  FIELD_REGISTRY,
  SEGNALAZIONE_LIMITS,
  TIPI_SEGNALAZIONE,
  TIPO_SEGNALAZIONE_LABELS,
  type TipoSegnalazione,
} from "@catasto/shared";
import { useCreateSegnalazione } from "../api/create-segnalazione";

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

  const mutation = useCreateSegnalazione();

  useEffect(() => {
    if (!isOpen) return;
    setTipo(defaultTipo);
    setCampo(defaultCampo ?? REPORTABLE[0].key);
    setValoreProposto("");
    setNote("");
    setWebsite("");
    mutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset sull'apertura, non a ogni render della mutation
  }, [isOpen, defaultTipo, defaultCampo]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
      valore_proposto: valoreProposto || null,
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
      <div className="bg-bg-sidebar border-0 sm:border border-border-base shadow-2xl sm:rounded-lg w-full max-w-lg max-h-full sm:max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between p-4 border-b border-border-base">
          <div>
            <h2 className="text-base md:text-lg font-serif font-bold text-item-selected flex items-center gap-2">
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
            onClick={onClose}
            className="text-text-main hover:text-red-500 p-1 rounded transition-colors"
            title="Chiudi"
          >
            <X className="h-5 w-5" />
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
            <div>
              <label className={labelClasses}>Tipo di segnalazione</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoSegnalazione)}
                className={inputClasses}
              >
                {TIPI_SEGNALAZIONE.map((t) => (
                  <option key={t} value={t}>
                    {TIPO_SEGNALAZIONE_LABELS[t]}
                  </option>
                ))}
              </select>
              {tipo === "segnatura" && (
                <p className="text-[11px] text-text-accent mt-1 italic">
                  La segnatura della portata non è presente nella base dati dell'Archivio: viene
                  ricostruita dalle segnalazioni e pubblicata dopo la verifica.
                </p>
              )}
            </div>

            {tipo === "dato_errato" && (
              <>
                <div>
                  <label className={labelClasses}>Campo errato</label>
                  <select
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
                  <label className={labelClasses}>Valore attualmente pubblicato</label>
                  <p className="text-sm text-text-main bg-bg-main border border-dashed border-border-base rounded px-3 py-2">
                    {valoreAttuale || <span className="italic text-text-accent">vuoto</span>}
                  </p>
                </div>
              </>
            )}

            <div>
              <label className={labelClasses}>
                {tipo === "segnatura" ? "Segnatura corretta" : "Valore corretto (facoltativo)"}
              </label>
              <input
                type="text"
                value={valoreProposto}
                onChange={(e) => setValoreProposto(e.target.value)}
                maxLength={SEGNALAZIONE_LIMITS.valore}
                required={tipo === "segnatura"}
                placeholder={tipo === "segnatura" ? "Es. ASFi, Catasto 81, c. 245r" : "Valore corretto..."}
                className={inputClasses}
              />
            </div>

            <div>
              <label className={labelClasses}>Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={SEGNALAZIONE_LIMITS.note}
                rows={3}
                placeholder="Fonte, riferimento archivistico, dettagli..."
                className={inputClasses}
              />
            </div>

            <div>
              <label className={labelClasses}>Email (facoltativa, per chiarimenti)</label>
              <input
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
                <Send className="h-4 w-4" />
                {mutation.isPending ? "Invio..." : "Invia segnalazione"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
