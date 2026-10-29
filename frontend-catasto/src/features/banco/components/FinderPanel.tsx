import { useEffect, useId, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { SELECTION_MAX_FUOCHI, SUGGEST_LIMIT, type SuggestItem } from "@catasto/shared";
import { fetchSuggest } from "../../../api/catastoService";
import { fetchFuochiByIdsChunked } from "../../../api/fuochi-by-ids";
import { userMessage } from "../../../api/client";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useLanguage, useT } from "../../../i18n";
import { useCompare } from "../../compare/compare-context";
import { SELEZIONE, type AddTarget, type TargetKey } from "../add-target";
import { createCollection, renameCollection } from "../collections";
import { finderMessages } from "../finder.messages";
import { parsePastedIds } from "../paste-ids";
import { useCollections } from "../useCollections";
import CollectionNameForm from "./CollectionNameForm";

interface FinderPanelProps {
  target: AddTarget;
  onTarget: (key: TargetKey) => void;
}

const SEARCH_DEBOUNCE_MS = 200;
const PASTE_DEBOUNCE_MS = 400;
const MISSING_SHOWN = 10;

const link = "min-h-9 inline-flex items-center text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary";

type Notice = { text: string; undo?: () => void };

const isTextField = (el: Element | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/**
 * «Trova e aggiungi» del Banco: una casella che cerca mentre si scrive
 * (capofamiglia, mestiere, popolo, numero del fuoco, carta del campione) e
 * un campo per incollare un elenco di numeri. I fuochi vanno nella
 * destinazione scelta, la selezione o una raccolta; la query del Banco non
 * cambia. Ogni aggiunta si può annullare.
 */
export default function FinderPanel({ target, onTarget }: FinderPanelProps) {
  const t = useT(finderMessages);
  const { lang, locale } = useLanguage();
  const collections = useCollections();
  const selection = useCompare().ids;
  const baseId = useId();
  const listId = `${baseId}-list`;
  const inputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"search" | "paste">("search");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [naming, setNaming] = useState<"rename" | "create" | null>(null);
  const [pasted, setPasted] = useState("");

  const nome = target.nome;
  const dest = nome ? t("destCollection", { nome }) : t("destSelection");
  const to = nome ? t("toCollection", { nome }) : t("toSelection");
  const into = nome ? t("inCollection", { nome }) : t("inSelection");
  const from = nome ? t("fromCollection", { nome }) : t("fromSelection");
  const fullDest = nome ? t("fullCollection", { nome }) : t("fullSelection");

  // «/» da qualunque punto della pagina, tranne mentre si scrive altrove.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || isTextField(document.activeElement)) return;
      e.preventDefault();
      setTab("search");
      requestAnimationFrame(() => inputRef.current?.focus());
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // --- ricerca ---
  const term = useDebouncedValue(q.trim(), SEARCH_DEBOUNCE_MS);
  const suggest = useQuery({
    queryKey: ["suggest", lang, term],
    queryFn: ({ signal }) => fetchSuggest(term, signal),
    enabled: term.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
  const items = term ? (suggest.data?.data ?? []) : [];
  const total = term ? (suggest.data?.total ?? 0) : 0;
  const showList = open && q.trim().length > 0;
  const activeIndex = Math.min(active, Math.max(0, items.length - 1));

  const add = (ids: number[], label: string) => {
    const before = target.ids;
    if (ids.length === 1 && target.has(ids[0])) {
      setNotice({ text: t("already", { nome: label, in: into }) });
      return;
    }
    if (target.full) {
      setNotice({ text: t("full", { dest: fullDest, max: SELECTION_MAX_FUOCHI }) });
      return;
    }
    const added = target.add(ids);
    if (added.length === 0) return;
    setNotice({
      text: added.length === 1 ? t("added", { nome: label, to }) : t("addedMany", { n: added.length, to }),
      undo: () => target.restore(before),
    });
  };

  const toggle = (item: SuggestItem) => {
    if (!target.has(item.id)) {
      add([item.id], item.nome);
      return;
    }
    const before = target.ids;
    target.remove([item.id]);
    setNotice({ text: t("removed", { nome: item.nome, from }), undo: () => target.restore(before) });
  };

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive(Math.min(activeIndex + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[activeIndex];
      // Invio aggiunge e basta: togliere resta un gesto esplicito (clic sulla voce o casella).
      if (showList && item) add([item.id], item.nome);
    } else if (e.key === "Escape") {
      if (showList) setOpen(false);
      else setQ("");
    }
  };

  // --- incolla ---
  const parsed = useMemo(() => parsePastedIds(pasted), [pasted]);
  const pasteIds = useDebouncedValue(parsed.ids, PASTE_DEBOUNCE_MS);
  const check = useQuery({
    queryKey: ["fuochiByIds", lang, pasteIds],
    queryFn: ({ signal }) => fetchFuochiByIdsChunked(pasteIds, signal),
    enabled: tab === "paste" && pasteIds.length > 0,
    staleTime: 10 * 60 * 1000,
  });
  const report = useMemo(() => {
    if (!check.data || pasteIds !== parsed.ids) return null;
    const found = new Set(check.data.map((f) => Number(f.id)));
    return {
      fresh: pasteIds.filter((id) => found.has(id) && !target.has(id)),
      inside: pasteIds.filter((id) => found.has(id) && target.has(id)).length,
      missing: pasteIds.filter((id) => !found.has(id)),
    };
  }, [check.data, pasteIds, parsed.ids, target]);

  // --- destinazione ---
  const selectValue = target.key.kind === "raccolta" ? `r:${target.key.id}` : "selezione";
  const count = (n: number) => (n === 1 ? t("collectionCountOne") : t("collectionCount", { n: n.toLocaleString(locale) }));

  const nameSubmit = (nome: string) => {
    if (naming === "rename" && target.key.kind === "raccolta") {
      const result = renameCollection(target.key.id, nome);
      if (!result.ok) return result.reason;
      setNotice({ text: t("renamed", { nome: nome.trim() }) });
    } else {
      const created = createCollection(nome);
      if (!created) return nome.trim() ? "taken" : "empty";
      onTarget({ kind: "raccolta", id: created.id });
      setNotice({ text: t("created", { nome: created.nome }) });
    }
    setNaming(null);
    return null;
  };

  const tabClass = (on: boolean) =>
    `min-h-9 px-3 ${on ? "bg-primary text-on-primary" : "text-text-accent hover:text-primary"}`;

  return (
    <section aria-labelledby={`${baseId}-h`} className="border border-border-base rounded-ui bg-bg-card p-3 sm:p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 id={`${baseId}-h`} className="text-lg font-bold text-accent-strong">
          {t("heading")}
        </h2>
        <div role="tablist" aria-label={t("modes")} className="inline-flex border border-border-base/60 rounded-ui text-sm">
          <button type="button" role="tab" id={`${baseId}-tab-s`} aria-selected={tab === "search"} aria-controls={`${baseId}-pane-s`} onClick={() => setTab("search")} className={tabClass(tab === "search")}>
            {t("tabSearch")}
          </button>
          <button type="button" role="tab" id={`${baseId}-tab-p`} aria-selected={tab === "paste"} aria-controls={`${baseId}-pane-p`} onClick={() => setTab("paste")} className={tabClass(tab === "paste")}>
            {t("tabPaste")}
          </button>
        </div>
        <label className="sm:ml-auto inline-flex items-center gap-2 text-sm text-text-accent max-w-full">
          {t("addTo")}
          <select
            value={selectValue}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "new") setNaming("create");
              else {
                setNaming(null);
                onTarget(v === "selezione" ? SELEZIONE : { kind: "raccolta", id: v.slice(2) });
              }
            }}
            className="min-h-9 min-w-0 max-w-[22rem] border border-border-base rounded-ui px-1 bg-bg-main text-text-main"
          >
            <option value="selezione">{t("targetSelection", { n: selection.length })}</option>
            {collections.map((r) => (
              <option key={r.id} value={`r:${r.id}`}>
                {t("targetCollection", { nome: r.nome, n: r.ids.length })}
              </option>
            ))}
            <option value="new">{t("newCollection")}</option>
          </select>
        </label>
      </div>

      {/* Destinazione: nome (si rinomina sul posto) e quanti fuochi contiene. */}
      <div className="text-sm">
        {naming ? (
          <CollectionNameForm
            key={naming}
            initial={naming === "rename" ? (target.nome ?? "") : ""}
            submitLabel={naming === "rename" ? t("save") : t("create")}
            onSubmit={nameSubmit}
            onCancel={() => setNaming(null)}
          />
        ) : target.nome ? (
          <p className="flex flex-wrap items-baseline gap-x-3">
            <button type="button" onClick={() => setNaming("rename")} title={t("rename")} className="font-semibold text-text-main hover:underline decoration-dashed underline-offset-4 text-left">
              {target.nome}
            </button>
            <span className="text-text-accent tabular-nums">{count(target.ids.length)}</span>
            <button type="button" onClick={() => setNaming("rename")} aria-label={t("renameAria", { nome: target.nome })} className={link}>
              {t("rename")}
            </button>
          </p>
        ) : (
          <p className="text-text-accent">
            <span className="tabular-nums">{count(target.ids.length)}</span> · {t("selectionNote")}
          </p>
        )}
      </div>

      <div id={`${baseId}-pane-s`} role="tabpanel" aria-labelledby={`${baseId}-tab-s`} hidden={tab !== "search"} className="relative">
        <label htmlFor={`${baseId}-q`} className="sr-only">
          {t("searchLabel")}
        </label>
        <div className="flex items-center gap-2 border-[1.5px] border-border-base rounded-ui bg-bg-main px-2 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
          <input
            ref={inputRef}
            id={`${baseId}-q`}
            type="search"
            role="combobox"
            autoComplete="off"
            spellCheck={false}
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && items[activeIndex] ? `${listId}-${activeIndex}` : undefined}
            aria-describedby={`${baseId}-hint`}
            placeholder={t("searchPlaceholder")}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onSearchKey}
            // Il fuoco si vede sul bordo della casella intera (focus-within), non sul solo campo.
            style={{ outline: "none" }}
            className="flex-1 min-w-0 min-h-11 bg-transparent text-base"
          />
          <kbd aria-hidden="true" className="text-xs text-text-accent border border-border-base/60 rounded-ui px-1.5">
            /
          </kbd>
        </div>
        <p id={`${baseId}-hint`} className="mt-1 text-xs text-text-accent">
          {t("searchHint")}
        </p>

        {showList && (
          // mousedown non toglie il fuoco alla casella: si continua a scrivere dopo un clic.
          <div onMouseDown={(e) => e.preventDefault()} className="absolute z-30 inset-x-0 top-12 bg-bg-card border border-border-base rounded-ui max-h-[26rem] overflow-y-auto">
            <p className="flex flex-wrap justify-between gap-x-3 px-3 py-1.5 text-xs text-text-accent border-b border-border-base/40">
              <span role="status" aria-live="polite">
                {suggest.isError
                  ? userMessage(suggest.error, t("searchError"), lang)
                  : suggest.isFetching && items.length === 0
                    ? t("searching")
                    : total === 0
                      ? t("none")
                      : `${total === 1 ? t("foundOne") : t("found", { n: total.toLocaleString(locale) })} · ${t(
                          suggest.data?.mode === "id" ? "modeId" : suggest.data?.mode === "carta" ? "modeCarta" : "modeTesto",
                        )}`}
              </span>
              <span>
                {t("addTo")}: <strong className="font-semibold text-text-main">{dest}</strong>
              </span>
            </p>
            <ul id={listId} role="listbox" aria-label={t("resultsLabel")}>
              {items.map((item, i) => {
                const inside = target.has(item.id);
                const place = [item.quartiere, item.popolo].filter((p) => p && p.trim()).join(" » ");
                return (
                  <li
                    key={item.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    aria-label={`${item.nome}${inside ? `, ${t("inside")}` : ""}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => toggle(item)}
                    className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-2 cursor-pointer border-b border-border-base/20 ${
                      i === activeIndex ? "bg-item-hover" : ""
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="font-semibold">{item.nome}</span> <span className="text-text-accent tabular-nums text-sm">#{item.id}</span>
                      <span className="block text-sm text-text-accent truncate">
                        {[
                          item.mestiere,
                          place,
                          item.imponibile !== null ? t("imponibile", { n: Number(item.imponibile).toLocaleString(locale) }) : null,
                          item.volume ? t("refShort", { volume: item.volume, foglio: item.foglio || "?" }) : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`min-h-8 px-2.5 inline-flex items-center rounded-ui text-sm whitespace-nowrap ${
                        inside ? "text-primary" : "border border-primary text-primary"
                      }`}
                    >
                      {inside ? `✓ ${t("inside")}` : `+ ${t("add")}`}
                    </span>
                  </li>
                );
              })}
            </ul>
            {total > SUGGEST_LIMIT && <p className="px-3 py-2 text-sm text-text-accent">{t("more", { n: (total - items.length).toLocaleString(locale) })}</p>}
            {items.length > 0 && <p className="px-3 py-1.5 text-xs text-text-accent">{t("keys")}</p>}
          </div>
        )}
      </div>

      <div id={`${baseId}-pane-p`} role="tabpanel" aria-labelledby={`${baseId}-tab-p`} hidden={tab !== "paste"} className="space-y-2">
        <label htmlFor={`${baseId}-paste`} className="block text-sm text-text-accent">
          {t("pasteLabel", { max: SELECTION_MAX_FUOCHI })}
        </label>
        <textarea
          id={`${baseId}-paste`}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={4}
          spellCheck={false}
          className="w-full min-h-24 px-2 py-1.5 border-[1.5px] border-border-base rounded-ui bg-bg-main text-text-main font-mono text-sm"
        />
        {parsed.ids.length > 0 && (
          <p role="status" aria-live="polite" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {check.isError ? (
              <span className="text-red-700 dark:text-red-300">{userMessage(check.error, t("pasteError"), lang)}</span>
            ) : !report ? (
              <span className="text-text-accent italic">{t("pasteChecking")}</span>
            ) : (
              <>
                <span className="font-semibold text-primary">{t("pasteNew", { n: report.fresh.length })}</span>
                <span>{t("pasteInside", { n: report.inside })}</span>
                {parsed.repeated > 0 && <span>{parsed.repeated === 1 ? t("pasteRepeatedOne") : t("pasteRepeated", { n: parsed.repeated })}</span>}
                {parsed.over > 0 && <span>{t("pasteOver", { n: parsed.over, max: SELECTION_MAX_FUOCHI })}</span>}
                {report.missing.length > 0 && (
                  <span className="text-red-700 dark:text-red-300">
                    {t("pasteMissing", {
                      ids: report.missing.slice(0, MISSING_SHOWN).join(", ") + (report.missing.length > MISSING_SHOWN ? ", …" : ""),
                    })}
                  </span>
                )}
              </>
            )}
          </p>
        )}
        <button
          type="button"
          disabled={!report || report.fresh.length === 0}
          onClick={() => {
            if (!report) return;
            const first = check.data?.find((f) => Number(f.id) === report.fresh[0]);
            add(report.fresh, first?.nome ?? `#${report.fresh[0]}`);
          }}
          className="min-h-9 px-3 rounded-ui bg-primary text-on-primary font-semibold disabled:opacity-40"
        >
          {!report || report.fresh.length === 0
            ? t("pasteNothing")
            : report.fresh.length === 1
              ? t("pasteAddOne")
              : t("pasteAdd", { n: report.fresh.length })}
        </button>
      </div>

      <p role="status" aria-live="polite" className="flex flex-wrap items-baseline gap-x-3 text-sm italic text-text-accent empty:hidden">
        {notice && (
          <>
            <span>{notice.text}</span>
            {notice.undo && (
              <button
                type="button"
                onClick={() => {
                  notice.undo?.();
                  setNotice({ text: t("undone") });
                }}
                className={`${link} not-italic`}
              >
                {t("undo")}
              </button>
            )}
          </>
        )}
      </p>
    </section>
  );
}
