import { useEffect, useId, useRef, useState } from "react";
import { useT } from "../../../i18n";
import { addToCollection } from "../../banco/collections";
import { useCollections } from "../../banco/useCollections";
import { compareMessages } from "../compare.messages";

const linkClasses = "min-h-11 inline-flex items-center text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary";

/**
 * «Aggiungi a una raccolta»: un piccolo pannello sopra la barra con le
 * raccolte esistenti e il nome di una nuova. Si chiude con Esc o fuori.
 */
export default function AddToCollection({ ids, onAdded }: { ids: number[]; onAdded: (message: string) => void }) {
  const t = useT(compareMessages);
  const collections = useCollections();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const add = (name: string) => {
    if (!name.trim()) return;
    addToCollection(name, ids);
    onAdded(t("addedTo", { n: ids.length, nome: name.trim() }));
    setNome("");
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      <button ref={buttonRef} type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={panelId} className={linkClasses}>
        {t("addToCollection")}
      </button>
      <div
        id={panelId}
        hidden={!open}
        role="group"
        aria-label={t("collectionsTitle")}
        className="absolute bottom-full mb-2 left-0 w-72 bg-bg-main border border-border-base rounded-ui p-3 space-y-2 text-sm"
      >
        {collections.length > 0 && (
          <ul className="space-y-0.5 max-h-48 overflow-y-auto">
            {collections.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => add(r.nome)} className="w-full min-h-9 text-left px-2 rounded-ui hover:bg-item-hover">
                  {r.nome} <span className="text-text-accent tabular-nums">({r.ids.length})</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add(nome);
          }}
        >
          <label className="sr-only" htmlFor={`${panelId}-nome`}>
            {t("newCollection")}
          </label>
          <input
            id={`${panelId}-nome`}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={60}
            placeholder={t("newCollectionPh")}
            className="flex-1 min-w-0 min-h-9 px-2 border border-border-base rounded-ui bg-bg-main text-text-main"
          />
          <button type="submit" disabled={!nome.trim()} className="min-h-9 px-3 rounded-ui border border-primary text-primary font-semibold disabled:opacity-40">
            {t("add")}
          </button>
        </form>
      </div>
    </div>
  );
}
