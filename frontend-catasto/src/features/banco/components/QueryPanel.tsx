import { useEffect, useId, useState } from "react";
import { FIELD_REGISTRY, type QueryGroup, type SavedQuery } from "@catasto/shared";
import QueryBuilder from "../../catasto/components/QueryBuilder";
import { describeNode, type OptionsByKey } from "../../catasto/lib/query-describe";
import { pruneAst } from "../../catasto/lib/query-ast-utils";
import { buildShareUrl, MAX_SHARE_URL_LENGTH } from "../../catasto/lib/query-share";
import { deleteQuery, loadSavedQueries, saveQuery } from "../../catasto/lib/saved-queries";
import { useLanguage, useT } from "../../../i18n";
import { bancoMessages } from "../banco.messages";

interface QueryPanelProps {
  ast: QueryGroup;
  onChange: (next: QueryGroup) => void;
  options: OptionsByKey;
}

const linkClasses = "min-h-11 inline-flex items-center text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary";

/**
 * La query del Banco si legge come una frase («Fuochi dove serie è Città e
 * mestiere è lanaiolo»); il costruttore a gruppi E/O della Home si apre solo
 * per modificarla. Stesso AST, stessi preset salvati e stesso link `#q=`.
 */
export default function QueryPanel({ ast, onChange, options }: QueryPanelProps) {
  const t = useT(bancoMessages);
  const { lang } = useLanguage();
  const editorId = useId();
  const [editing, setEditing] = useState(false);
  const [naming, setNaming] = useState(false);
  const [nome, setNome] = useState("");
  const [saved, setSaved] = useState<SavedQuery[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => setSaved(loadSavedQueries()), []);
  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(""), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  const pruned = pruneAst(ast);
  const sentence = pruned.children.length > 0 ? `${t("sentenceStart")} ${describeNode(pruned, options, 0, lang)}` : t("allFuochi");

  const addCondition = () => {
    const field = FIELD_REGISTRY[0];
    onChange({ ...ast, children: [...ast.children, { kind: "condition", field: field.key, operator: field.operators[0], value: "" }] });
    setEditing(true);
  };

  const copyLink = async () => {
    const url = buildShareUrl(pruned);
    if (url.length > MAX_SHARE_URL_LENGTH) {
      setStatus(t("linkTooLong"));
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus(t("linkCopied"));
    } catch {
      window.prompt(t("copyPrompt"), url);
    }
  };

  const save = () => {
    if (!nome.trim()) return;
    setSaved(saveQuery(nome, ast));
    setStatus(t("saved", { nome: nome.trim() }));
    setNome("");
    setNaming(false);
  };

  return (
    <section aria-labelledby={`${editorId}-h`} className="space-y-2">
      <h2 id={`${editorId}-h`} className="sr-only">
        {t("querySection")}
      </h2>
      <p className="text-lg md:text-xl font-serif text-text-main leading-snug">{sentence}</p>

      <div className="flex flex-wrap items-center gap-x-4 text-sm">
        <button type="button" onClick={addCondition} className={linkClasses}>
          {t("addCondition")}
        </button>
        <button type="button" onClick={() => setEditing((v) => !v)} aria-expanded={editing} aria-controls={editorId} className={linkClasses}>
          {editing ? t("closeEditor") : t("editGroups")}
        </button>
        <button type="button" onClick={() => setNaming((v) => !v)} aria-expanded={naming} className={linkClasses}>
          {t("saveQuery")}
        </button>
        <button type="button" onClick={copyLink} className={linkClasses}>
          {t("copyLink")}
        </button>
        <span role="status" aria-live="polite" className="text-text-accent italic">
          {status}
        </span>
      </div>

      {naming && (
        <form
          className="flex flex-wrap items-center gap-2 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label htmlFor={`${editorId}-nome`} className="text-text-accent">
            {t("saveQueryName")}
          </label>
          <input
            id={`${editorId}-nome`}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={60}
            autoFocus
            className="min-h-9 px-2 border border-border-base rounded-ui bg-bg-main text-text-main"
          />
          <button type="submit" disabled={!nome.trim()} className="min-h-9 px-3 rounded-ui border border-primary text-primary font-semibold disabled:opacity-40">
            {t("save")}
          </button>
        </form>
      )}

      <div id={editorId} hidden={!editing} className="border border-border-base rounded-ui p-3 bg-bg-main">
        {editing && <QueryBuilder value={ast} onChange={onChange} options={options} />}
      </div>

      {saved.length > 0 && (
        <p className="text-sm text-text-accent">
          <span className="small-caps">{t("savedQueries")}</span>:{" "}
          {saved.map((q, i) => (
            <span key={q.id} className="whitespace-nowrap">
              {i > 0 && " · "}
              <button type="button" onClick={() => onChange(q.ast)} className="text-primary hover:underline underline-offset-4">
                {q.nome}
              </button>
              <button
                type="button"
                onClick={() => setSaved(deleteQuery(q.id))}
                aria-label={`${t("deleteCollection")} ${q.nome}`}
                className="ml-0.5 min-w-6 text-text-accent hover:text-primary"
              >
                ×
              </button>
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
