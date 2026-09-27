import { describe, expect, it } from "vitest";
import type { QueryGroup } from "@catasto/shared";
import { describeNode, type OptionsByKey } from "./query-describe";

const options: OptionsByKey = { mestieri: [{ id: 1, label: "Fabbro" }] } as unknown as OptionsByKey;

const ast: QueryGroup = {
  kind: "group",
  op: "AND",
  children: [
    { kind: "condition", field: "nome", operator: "contains", value: "Rossi" },
    {
      kind: "group",
      op: "OR",
      not: true,
      children: [
        { kind: "condition", field: "fortune", operator: "between", value: [100, 500] },
        { kind: "condition", field: "casa", operator: "is_empty" },
      ],
    },
  ],
};

describe("describeNode", () => {
  it("descrive l'AST in italiano", () => {
    expect(describeNode({ kind: "group", op: "AND", children: [] }, options, 0, "it")).toBe("tutti i fuochi");
    expect(describeNode(ast, options, 0, "it")).toBe(
      'Nome fuoco contiene "Rossi" e non ((Fortune compreso tra 100 e 500 oppure Casa è vuoto))',
    );
  });

  it("describes the AST in English", () => {
    expect(describeNode({ kind: "group", op: "AND", children: [] }, options, 0, "en")).toBe("all households");
    expect(describeNode(ast, options, 0, "en")).toBe(
      'Household name contains "Rossi" and not ((Fortune between 100 and 500 or House is empty))',
    );
    expect(
      describeNode({ kind: "condition", field: "boh", operator: "eq", value: "x" }, options, 0, "en"),
    ).toBe("invalid condition");
  });
});
