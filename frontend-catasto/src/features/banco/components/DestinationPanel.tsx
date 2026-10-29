import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { COMPARE_MAX_FUOCHI, COMPARE_MIN_FUOCHI, type Fuoco } from "@catasto/shared";
import { fetchFuochiByIdsChunked } from "../../../api/fuochi-by-ids";
import { userMessage } from "../../../api/client";
import { useLanguage, useT } from "../../../i18n";
import { exportFuochiIds } from "../../catasto/lib/export-ids";
import { useCompare } from "../../compare/compare-context";
import type { AddTarget } from "../add-target";
import { buildCollectionUrl, renameCollection, type Raccolta } from "../collections";
import { finderMessages } from "../finder.messages";
import type { TargetActions } from "../useTargetActions";
import CollectionNameForm from "./CollectionNameForm";

/** Oltre questo numero l'elenco si conta invece di scriverlo. */
const SHOWN = 100;

const link = "min-h-9 inline-flex items-center text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary disabled:opacity-50";

type Name = Pick<Fuoco, "id" | "nome" | "mestiere" | "popolo" | "quartiere">;

/**
 * Nomi dei fuochi della destinazione: si chiedono al server solo gli id che
 * mancano, a blocchi, e restano in memoria; aggiungere un fuoco non ricarica
 * gli altri.
 */
function useNames(ids: number[]): { names: Map<number, Name>; loading: boolean } {
  const { lang } = useLanguage();
  const [names, setNames] = useState(() => new Map<number, Name>());
  const missing = useMemo(() => ids.filter((id) => !names.has(id)), [ids, names]);
  const query = useQuery({
    queryKey: ["fuochiByIds", lang, missing],
    queryFn: ({ signal }) => fetchFuochiByIdsChunked(missing, signal),
    enabled: missing.length > 0,
    staleTime: 10 * 60 * 1000,
  });
  useEffect(() => {
    if (!query.data || query.data.length === 0) return;
    setNames((current) => new Map([...current, ...query.data.map((f) => [Number(f.id), f] as const)]));
  }, [query.data]);
  // La lingua cambia mestieri e luoghi: si ricomincia.
  useEffect(() => setNames(new Map()), [lang]);
  return { names, loading: query.isLoading };
}

interface DestinationPanelProps {
  target: AddTarget;
  actions: TargetActions;
  /** Apre la raccolta nel Banco (ricerca con il filtro ids). */
  onOpen: (raccolta: Pick<Raccolta, "id" | "nome" | "ids">) => void;
}

/**
 * Accanto alla tabella, la destinazione che si sta riempiendo: nome (si
 * rinomina sul posto), fuochi con l'ultimo aggiunto in alto e «togli», e le
 * azioni della raccolta o della selezione.
 */
export default function DestinationPanel({ target, actions, onOpen }: DestinationPanelProps) {
  const t = useT(finderMessages);
  const { lang, locale } = useLanguage();
  const compare = useCompare();
  const [renaming, setRenaming] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const { names, loading } = useNames(target.ids);

  const raccolta = target.key.kind === "raccolta" ? { id: target.key.id, nome: target.nome ?? "", ids: target.ids } : null;
  const latestFirst = [...target.ids].reverse();
  const count = target.ids.length === 1 ? t("collectionCountOne") : t("collectionCount", { n: target.ids.length.toLocaleString(locale) });

  const keyId = target.key.kind === "raccolta" ? target.key.id : "selezione";
  useEffect(() => setRenaming(false), [keyId]);

  const copy = async () => {
    if (!raccolta) return;
    const url = buildCollectionUrl(raccolta);
    try {
      await navigator.clipboard.writeText(url);
      setStatus(t("linkCopied"));
    } catch {
      window.prompt(t("copyLink"), url);
    }
  };

  const exportCsv = async () => {
    setBusy(true);
    setStatus(t("exporting"));
    try {
      setStatus(t("exported", { file: await exportFuochiIds(target.ids, lang) }));
    } catch (error) {
      setStatus(userMessage(error, t("exportFailed"), lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside aria-labelledby="banco-dest-h" className="border border-border-base rounded-ui bg-bg-card p-3 text-sm space-y-2 xl:sticky xl:top-4">
      {renaming && raccolta ? (
        <CollectionNameForm
          initial={raccolta.nome}
          submitLabel={t("save")}
          onSubmit={(nome) => {
            const result = renameCollection(raccolta.id, nome);
            if (!result.ok) return result.reason;
            actions.notify({ text: t("renamed", { nome: nome.trim() }) });
            setRenaming(false);
            return null;
          }}
          onCancel={() => setRenaming(false)}
        />
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h2 id="banco-dest-h" className="text-lg font-bold text-accent-strong min-w-0">
            {raccolta ? (
              <button type="button" onClick={() => setRenaming(true)} title={t("rename")} className="text-left hover:underline decoration-dashed underline-offset-4">
                {raccolta.nome}
              </button>
            ) : (
              t("selectionTitle")
            )}{" "}
            <span className="text-sm font-normal text-text-accent tabular-nums">({count})</span>
          </h2>
          {raccolta && (
            <button type="button" onClick={() => setRenaming(true)} aria-label={t("renameAria", { nome: raccolta.nome })} className={`${link} ml-auto`}>
              {t("rename")}
            </button>
          )}
        </div>
      )}
      <p className="text-xs text-text-accent">{raccolta ? t("trayCollection") : t("traySelection")}</p>

      {target.ids.length === 0 ? (
        <p className="italic text-text-accent">{t("trayEmpty")}</p>
      ) : (
        <ol className="max-h-[28rem] overflow-y-auto border-t border-border-base/40">
          {latestFirst.slice(0, SHOWN).map((id) => {
            const f = names.get(id);
            const nome = f?.nome ?? `#${id}`;
            const place = [f?.quartiere, f?.popolo].filter((p) => p && p.trim()).join(" » ");
            return (
              <li key={id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 py-1.5 border-b border-border-base/30">
                <span className="min-w-0">
                  <span className="font-semibold">{nome}</span> <span className="text-text-accent tabular-nums text-xs">#{id}</span>
                  <span className="block text-xs text-text-accent truncate">
                    {f ? [f.mestiere || t("noOccupation"), place].filter(Boolean).join(" · ") : loading ? t("trayLoading") : ""}
                  </span>
                </span>
                <button type="button" onClick={() => actions.remove(id, nome)} aria-label={t("trayRemoveAria", { nome })} className="self-center min-h-8 px-1 text-text-accent underline underline-offset-4 hover:text-primary">
                  {t("trayRemove")}
                </button>
              </li>
            );
          })}
          {latestFirst.length > SHOWN && <li className="py-1.5 text-text-accent">{t("trayMore", { n: (latestFirst.length - SHOWN).toLocaleString(locale) })}</li>}
        </ol>
      )}

      <div className="flex flex-wrap gap-x-4">
        {raccolta ? (
          <>
            <button type="button" onClick={() => onOpen(raccolta)} disabled={target.ids.length === 0} className={link}>
              {t("openInBanco")}
            </button>
            <button type="button" onClick={copy} disabled={target.ids.length === 0} className={link}>
              {t("copyLink")}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={compare.openView}
            disabled={!compare.canCompare}
            title={compare.canCompare ? undefined : t("compareRange", { min: COMPARE_MIN_FUOCHI, max: COMPARE_MAX_FUOCHI })}
            className={link}
          >
            {t("compare")}
          </button>
        )}
        <button type="button" onClick={exportCsv} disabled={busy || target.ids.length === 0} className={link}>
          {t("exportCsv")}
        </button>
      </div>
      <p role="status" aria-live="polite" className="text-xs text-text-accent empty:hidden">
        {status}
      </p>
    </aside>
  );
}
