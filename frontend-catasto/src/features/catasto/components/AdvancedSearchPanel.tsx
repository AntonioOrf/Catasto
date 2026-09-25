import { useCallback, useEffect, useState } from "react";
import { Bookmark, Check, Link2, Trash2 } from "lucide-react";
import type { QueryGroup, SavedQuery } from "@catasto/shared";
import QueryBuilder from "./QueryBuilder";
import { describeNode, type OptionsByKey } from "../lib/query-describe";
import { pruneAst } from "../lib/query-ast-utils";
import { buildShareUrl, MAX_SHARE_URL_LENGTH } from "../lib/query-share";
import { deleteQuery, loadSavedQueries, saveQuery } from "../lib/saved-queries";

interface AdvancedSearchPanelProps {
  ast: QueryGroup;
  onChange: (next: QueryGroup) => void;
  options: OptionsByKey;
}

export default function AdvancedSearchPanel({ ast, onChange, options }: AdvancedSearchPanelProps) {
  const [saved, setSaved] = useState<SavedQuery[]>([]);
  const [nome, setNome] = useState("");
  const [shareState, setShareState] = useState<"idle" | "copied" | "too-long" | "error">("idle");

  // localStorage non è disponibile durante il render iniziale su ogni browser
  // (modalità privata con policy restrittive): leggiamo dopo il mount.
  useEffect(() => setSaved(loadSavedQueries()), []);

  const preview = describeNode(pruneAst(ast), options);

  const handleSave = useCallback(() => {
    if (!nome.trim()) return;
    setSaved(saveQuery(nome, ast));
    setNome("");
  }, [nome, ast]);

  const handleShare = useCallback(async () => {
    const url = buildShareUrl(pruneAst(ast));
    if (url.length > MAX_SHARE_URL_LENGTH) {
      setShareState("too-long");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
    } catch {
      // Clipboard API negata o contesto non sicuro (http): non è un errore
      // dell'utente, mostriamo l'URL da copiare a mano.
      window.prompt("Copia il link della ricerca:", url);
      setShareState("idle");
    }
  }, [ast]);

  useEffect(() => {
    if (shareState === "idle") return;
    const timer = setTimeout(() => setShareState("idle"), 3000);
    return () => clearTimeout(timer);
  }, [shareState]);

  return (
    <div className="bg-bg-main border border-border-base rounded p-3 md:p-4 mt-2 space-y-4">
      <QueryBuilder value={ast} onChange={onChange} options={options} />

      <div className="border-t border-dashed border-border-base pt-3">
        <span className="text-[10px] uppercase tracking-wider text-text-accent block mb-1">
          Ricerca corrente
        </span>
        <p className="text-xs md:text-sm text-text-main italic">Mostra i fuochi dove {preview}.</p>
      </div>

      <div className="border-t border-border-base pt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Nome del filtro..."
          maxLength={60}
          className="bg-bg-sidebar border border-border-base text-text-main text-xs md:text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!nome.trim()}
          className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline"
        >
          <Bookmark className="h-3.5 w-3.5" /> Salva filtro
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-text-accent hover:underline ml-auto"
        >
          {shareState === "copied" ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
          {shareState === "copied" ? "Link copiato" : "Condividi ricerca"}
        </button>
      </div>

      {shareState === "too-long" && (
        <p className="text-xs text-orange-500">
          La ricerca è troppo lunga per essere condivisa via link. Riducila o salvala come filtro.
        </p>
      )}

      {saved.length > 0 && (
        <div className="border-t border-dashed border-border-base pt-3">
          <span className="text-[10px] uppercase tracking-wider text-text-accent block mb-2">
            Filtri salvati su questo dispositivo
          </span>
          <div className="flex flex-wrap gap-2">
            {saved.map((query) => (
              <span
                key={query.id}
                className="inline-flex items-center gap-1 bg-bg-sidebar border border-border-base rounded-full pl-3 pr-1 py-1 text-xs text-text-main"
              >
                <button
                  type="button"
                  onClick={() => onChange(query.ast)}
                  className="hover:text-primary transition-colors"
                  title="Applica questo filtro"
                >
                  {query.nome}
                </button>
                <button
                  type="button"
                  onClick={() => setSaved(deleteQuery(query.id))}
                  className="text-text-accent hover:text-red-500 p-0.5"
                  title="Elimina filtro"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
