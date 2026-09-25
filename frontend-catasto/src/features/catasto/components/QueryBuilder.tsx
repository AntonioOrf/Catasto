import { useCallback } from "react";
import { Plus, Trash2, FolderPlus } from "lucide-react";
import {
  AST_MAX_DEPTH,
  FIELD_REGISTRY,
  NO_VALUE_OPERATORS,
  OPERATOR_LABELS,
  getField,
  type Operator,
  type QueryCondition,
  type QueryGroup,
  type QueryNode,
} from "@catasto/shared";
import type { OptionsByKey } from "../lib/query-describe";

interface QueryBuilderProps {
  value: QueryGroup;
  onChange: (next: QueryGroup) => void;
  options: OptionsByKey;
}

const DEFAULT_FIELD = FIELD_REGISTRY[0];

const newCondition = (): QueryCondition => ({
  kind: "condition",
  field: DEFAULT_FIELD.key,
  operator: DEFAULT_FIELD.operators[0],
  value: "",
});

const newGroup = (): QueryGroup => ({ kind: "group", op: "AND", children: [newCondition()] });

/**
 * Sostituisce il nodo all'indice `path` producendo un nuovo albero.
 * Aggiornamento immutabile: l'AST finisce in una queryKey di React Query, che
 * confronta per valore — mutarlo in place non farebbe ripartire la ricerca.
 */
function updateAt(node: QueryGroup, path: number[], updater: (n: QueryNode) => QueryNode | null): QueryGroup {
  const [index, ...rest] = path;
  const children = [...node.children];

  if (rest.length === 0) {
    const next = updater(children[index]);
    if (next === null) children.splice(index, 1);
    else children[index] = next;
  } else {
    const child = children[index];
    if (child.kind !== "group") return node;
    children[index] = updateAt(child, rest, updater);
  }

  return { ...node, children };
}

const selectClasses =
  "bg-bg-main border border-border-base text-text-main text-xs md:text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40";
const inputClasses = `${selectClasses} min-w-0 flex-1`;

export default function QueryBuilder({ value, onChange, options }: QueryBuilderProps) {
  const update = useCallback(
    (path: number[], updater: (n: QueryNode) => QueryNode | null) =>
      onChange(updateAt(value, path, updater)),
    [value, onChange],
  );

  const addTo = useCallback(
    (path: number[], node: QueryNode) => {
      if (path.length === 0) {
        onChange({ ...value, children: [...value.children, node] });
        return;
      }
      onChange(
        updateAt(value, path, (target) =>
          target.kind === "group" ? { ...target, children: [...target.children, node] } : target,
        ),
      );
    },
    [value, onChange],
  );

  return (
    <GroupEditor
      group={value}
      path={[]}
      depth={1}
      options={options}
      onUpdate={update}
      onAdd={addTo}
      onToggleOp={(path, op) =>
        path.length === 0
          ? onChange({ ...value, op })
          : update(path, (n) => (n.kind === "group" ? { ...n, op } : n))
      }
      onToggleNot={(path, not) =>
        path.length === 0
          ? onChange({ ...value, not })
          : update(path, (n) => (n.kind === "group" ? { ...n, not } : n))
      }
    />
  );
}

interface GroupEditorProps {
  group: QueryGroup;
  path: number[];
  depth: number;
  options: OptionsByKey;
  onUpdate: (path: number[], updater: (n: QueryNode) => QueryNode | null) => void;
  onAdd: (path: number[], node: QueryNode) => void;
  onToggleOp: (path: number[], op: "AND" | "OR") => void;
  onToggleNot: (path: number[], not: boolean) => void;
}

function GroupEditor({ group, path, depth, options, onUpdate, onAdd, onToggleOp, onToggleNot }: GroupEditorProps) {
  const isRoot = path.length === 0;
  // Il limite di annidamento è imposto anche dal backend: meglio non offrire
  // un pulsante che produrrebbe una query rifiutata.
  const canNest = depth < AST_MAX_DEPTH;

  return (
    <div
      className={
        isRoot
          ? "space-y-2"
          : "space-y-2 border-l-2 border-primary/40 pl-2 md:pl-3 py-2 bg-bg-sidebar/50 rounded-r"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded overflow-hidden border border-border-base">
          {(["AND", "OR"] as const).map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => onToggleOp(path, op)}
              className={`px-2 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                group.op === op
                  ? "bg-primary text-white"
                  : "bg-bg-main text-text-accent hover:bg-border-base"
              }`}
            >
              {op === "AND" ? "Tutte" : "Almeno una"}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-1 text-[11px] text-text-accent uppercase tracking-wider cursor-pointer">
          <input
            type="checkbox"
            checked={group.not === true}
            onChange={(e) => onToggleNot(path, e.target.checked)}
            className="accent-primary"
          />
          Escludi
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAdd(path, newCondition())}
            className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Condizione
          </button>
          {canNest && (
            <button
              type="button"
              onClick={() => onAdd(path, newGroup())}
              className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-text-accent hover:underline"
            >
              <FolderPlus className="h-3.5 w-3.5" /> Gruppo
            </button>
          )}
          {!isRoot && (
            <button
              type="button"
              onClick={() => onUpdate(path, () => null)}
              className="text-text-accent hover:text-red-500 transition-colors"
              title="Rimuovi gruppo"
              aria-label="Rimuovi gruppo"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {group.children.length === 0 ? (
        <p className="text-xs text-text-accent italic">
          Nessuna condizione: la ricerca restituisce tutti i fuochi.
        </p>
      ) : (
        group.children.map((child, index) =>
          child.kind === "group" ? (
            <GroupEditor
              key={index}
              group={child}
              path={[...path, index]}
              depth={depth + 1}
              options={options}
              onUpdate={onUpdate}
              onAdd={onAdd}
              onToggleOp={onToggleOp}
              onToggleNot={onToggleNot}
            />
          ) : (
            <ConditionEditor
              key={index}
              condition={child}
              options={options}
              onChange={(next) => onUpdate([...path, index], () => next)}
              onRemove={() => onUpdate([...path, index], () => null)}
            />
          ),
        )
      )}
    </div>
  );
}

interface ConditionEditorProps {
  condition: QueryCondition;
  options: OptionsByKey;
  onChange: (next: QueryCondition) => void;
  onRemove: () => void;
}

function ConditionEditor({ condition, options, onChange, onRemove }: ConditionEditorProps) {
  const field = getField(condition.field) ?? DEFAULT_FIELD;
  const operator = condition.operator as Operator;
  const needsValue = !NO_VALUE_OPERATORS.includes(operator);
  const enumOptions = field.optionsKey ? (options[field.optionsKey] ?? []) : [];

  const handleFieldChange = (key: string) => {
    const next = getField(key) ?? DEFAULT_FIELD;
    // Cambiando campo l'operatore precedente può non essere più ammesso e il
    // valore appartiene a un dominio diverso: ripartiamo puliti.
    onChange({ kind: "condition", field: next.key, operator: next.operators[0], value: "" });
  };

  const handleOperatorChange = (nextOperator: Operator) => {
    if (nextOperator === "between") {
      onChange({ ...condition, operator: nextOperator, value: ["", ""] });
      return;
    }
    if (nextOperator === "in" || nextOperator === "not_in") {
      const current = Array.isArray(condition.value) ? condition.value : [];
      onChange({ ...condition, operator: nextOperator, value: current });
      return;
    }
    if (NO_VALUE_OPERATORS.includes(nextOperator)) {
      onChange({ kind: "condition", field: condition.field, operator: nextOperator });
      return;
    }
    const current = Array.isArray(condition.value) ? condition.value[0] : condition.value;
    onChange({ ...condition, operator: nextOperator, value: current ?? "" });
  };

  const range = Array.isArray(condition.value) ? condition.value : ["", ""];

  return (
    <div className="flex flex-wrap items-center gap-2 bg-bg-main border border-border-base rounded px-2 py-2">
      <select
        value={field.key}
        onChange={(e) => handleFieldChange(e.target.value)}
        className={selectClasses}
      >
        {FIELD_REGISTRY.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label}
          </option>
        ))}
      </select>

      <select
        value={operator}
        onChange={(e) => handleOperatorChange(e.target.value as Operator)}
        className={selectClasses}
      >
        {field.operators.map((op) => (
          <option key={op} value={op}>
            {OPERATOR_LABELS[op]}
          </option>
        ))}
      </select>

      {needsValue &&
        (operator === "between" ? (
          <div className="flex items-center gap-1 flex-1 min-w-[180px]">
            <input
              type="number"
              value={String(range[0] ?? "")}
              onChange={(e) => onChange({ ...condition, value: [e.target.value, range[1] ?? ""] })}
              placeholder="Min"
              className={inputClasses}
            />
            <span className="text-text-accent">-</span>
            <input
              type="number"
              value={String(range[1] ?? "")}
              onChange={(e) => onChange({ ...condition, value: [range[0] ?? "", e.target.value] })}
              placeholder="Max"
              className={inputClasses}
            />
          </div>
        ) : operator === "in" || operator === "not_in" ? (
          <select
            multiple
            value={(Array.isArray(condition.value) ? condition.value : []).map(String)}
            onChange={(e) =>
              onChange({
                ...condition,
                value: Array.from(e.target.selectedOptions, (o) => o.value),
              })
            }
            className={`${inputClasses} h-20`}
          >
            {enumOptions.map((o) => (
              <option key={String(o.id)} value={String(o.id)}>
                {o.label}
              </option>
            ))}
          </select>
        ) : enumOptions.length > 0 ? (
          <select
            value={String(condition.value ?? "")}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
            className={inputClasses}
          >
            <option value="">Seleziona...</option>
            {enumOptions.map((o) => (
              <option key={String(o.id)} value={String(o.id)}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={field.type === "number" ? "number" : "text"}
            value={String(condition.value ?? "")}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
            placeholder="Valore..."
            className={inputClasses}
          />
        ))}

      <button
        type="button"
        onClick={onRemove}
        className="text-text-accent hover:text-red-500 transition-colors ml-auto"
        title="Rimuovi condizione"
        aria-label="Rimuovi condizione"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
