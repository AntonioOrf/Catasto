import { useEffect, useId, useRef, useState } from "react";
import { useT } from "../../../i18n";
import { finderMessages } from "../finder.messages";

interface CollectionNameFormProps {
  /** Nome di partenza (rinomina) o vuoto (nuova raccolta). */
  initial: string;
  submitLabel: string;
  /** Salva il nome; restituisce l'errore da mostrare, o null se è andato bene. */
  onSubmit: (nome: string) => "empty" | "taken" | null;
  onCancel: () => void;
}

/**
 * Campo del nome di una raccolta, al posto del titolo: si apre col testo
 * selezionato, Invio salva, Esc annulla. Nomi vuoti o già usati restano nel
 * campo con il motivo sotto.
 */
export default function CollectionNameForm({ initial, submitLabel, onSubmit, onCancel }: CollectionNameFormProps) {
  const t = useT(finderMessages);
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [nome, setNome] = useState(initial);
  const [error, setError] = useState<"empty" | "taken" | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(onSubmit(nome));
      }}
    >
      <label htmlFor={id} className="sr-only">
        {t("nameLabel")}
      </label>
      <input
        ref={inputRef}
        id={id}
        value={nome}
        maxLength={60}
        autoComplete="off"
        placeholder={t("newNamePh")}
        aria-invalid={error !== null}
        aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => {
          setNome(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key !== "Escape") return;
          e.stopPropagation();
          onCancel();
        }}
        className="flex-1 min-w-40 min-h-9 px-2 border border-border-base rounded-ui bg-bg-main text-text-main font-semibold"
      />
      <button type="submit" className="min-h-9 px-3 rounded-ui bg-primary text-on-primary font-semibold">
        {submitLabel}
      </button>
      <button type="button" onClick={onCancel} className="min-h-9 px-2 text-primary underline underline-offset-4">
        {t("cancel")}
      </button>
      {error && (
        <p id={`${id}-err`} role="alert" className="basis-full text-sm text-red-700 dark:text-red-300">
          {t(error === "empty" ? "nameEmpty" : "nameTaken")}
        </p>
      )}
    </form>
  );
}
