import { useState } from "react";
import { useLanguage, useT } from "../../../i18n";
import { useCompare } from "../../compare/compare-context";
import { bancoMessages } from "../banco.messages";
import { buildCollectionUrl, deleteCollection, renameCollection, type Raccolta } from "../collections";
import CollectionNameForm from "./CollectionNameForm";
import { useCollections } from "../useCollections";

interface CollectionsPanelProps {
  activeId: string | null;
  onOpen: (raccolta: Raccolta) => void;
  /** Raccolta in cui vanno i fuochi di «Trova e aggiungi», se è una raccolta. */
  targetId: string | null;
  onTarget: (raccolta: Raccolta) => void;
}

const link = "min-h-9 inline-flex items-center text-primary hover:underline underline-offset-4";

/** Raccolte salvate: si aprono nel Banco, si riempiono, si mettono nella selezione, si condividono, si rinominano, si eliminano. */
export default function CollectionsPanel({ activeId, onOpen, targetId, onTarget }: CollectionsPanelProps) {
  const t = useT(bancoMessages);
  const { locale } = useLanguage();
  const collections = useCollections();
  const { replace } = useCompare();
  const [status, setStatus] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);

  const copy = async (r: Raccolta) => {
    const url = buildCollectionUrl(r);
    try {
      await navigator.clipboard.writeText(url);
      setStatus(t("linkCopied"));
    } catch {
      window.prompt(t("copyPrompt"), url);
    }
  };

  return (
    <section aria-labelledby="raccolte-h" className="text-sm">
      <h2 id="raccolte-h" className="font-semibold text-accent-strong">
        {t("collections")}
      </h2>
      <p className="text-text-accent text-xs mb-1">{t("collectionsHint")}</p>
      {collections.length === 0 ? (
        <p className="text-text-accent italic">{t("noCollections")}</p>
      ) : (
        <ul>
          {collections.map((r) => (
            <li key={r.id} className={`flex flex-wrap items-baseline gap-x-3 border-b border-border-base/40 ${r.id === activeId ? "font-semibold" : ""}`}>
              {renaming === r.id ? (
                <div className="basis-full py-1">
                  <CollectionNameForm
                    initial={r.nome}
                    submitLabel={t("save")}
                    onSubmit={(nome) => {
                      const result = renameCollection(r.id, nome);
                      if (!result.ok) return result.reason;
                      setRenaming(null);
                      return null;
                    }}
                    onCancel={() => setRenaming(null)}
                  />
                </div>
              ) : (
                <span className="min-w-0 flex-1">
                  {r.nome} <span className="text-text-accent tabular-nums font-normal">({r.ids.length.toLocaleString(locale)})</span>
                </span>
              )}
              <button type="button" onClick={() => onOpen(r)} className={link}>
                {t("open")}
              </button>
              <button
                type="button"
                onClick={() => onTarget(r)}
                aria-pressed={r.id === targetId}
                title={t("addHereTitle")}
                className={`${link} ${r.id === targetId ? "font-semibold no-underline" : ""}`}
              >
                {t("addHere")}
              </button>
              <button type="button" onClick={() => replace(r.ids)} title={t("selectAllTitle")} className={link}>
                {t("selectAll")}
              </button>
              <button type="button" onClick={() => copy(r)} className={link}>
                {t("copyLink")}
              </button>
              <button type="button" onClick={() => setRenaming(r.id)} aria-label={t("renameAria", { nome: r.nome })} className={link}>
                {t("rename")}
              </button>
              <button
                type="button"
                onClick={() => deleteCollection(r.id)}
                aria-label={t("deleteCollectionAria", { nome: r.nome })}
                className="min-h-9 text-text-accent hover:text-primary"
              >
                {t("deleteCollection")}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p role="status" aria-live="polite" className="text-xs text-text-accent italic">
        {status}
      </p>
    </section>
  );
}
