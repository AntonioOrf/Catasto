import { describe, expect, it } from "vitest";
import { AST_MAX_DEPTH, type QueryGroup } from "@catasto/shared";
import { isQueryGroup } from "./query-ast-validate";
import { decodeAst, encodeAst } from "./query-share";
import { pruneAst } from "./query-ast-utils";

const cond = (value?: unknown) => ({ kind: "condition", field: "nome", operator: "contains", value });

const valid: QueryGroup = {
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
        { kind: "condition", field: "mestiere", operator: "in", value: ["1", "2"] },
        { kind: "condition", field: "casa", operator: "is_empty" },
      ],
    },
  ],
};

const nested = (levels: number): unknown => {
  let node: unknown = cond("x");
  for (let i = 0; i < levels; i++) node = { kind: "group", op: "AND", children: [node] };
  return node;
};

/** Codifica un payload arbitrario come farebbe un link scritto a mano. */
const encodeRaw = (value: unknown): string =>
  btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

describe("isQueryGroup", () => {
  it("accepts a well-formed tree", () => {
    expect(isQueryGroup(valid)).toBe(true);
    expect(isQueryGroup({ kind: "group", op: "OR", children: [] })).toBe(true);
  });

  it("accepts editing values (empty strings)", () => {
    expect(isQueryGroup({ kind: "group", op: "AND", children: [cond(""), cond(["", ""])] })).toBe(true);
  });

  it.each([
    ["null", null],
    ["array", []],
    ["condition as root", cond("x")],
    ["missing children", { kind: "group", op: "AND" }],
    ["invalid op", { kind: "group", op: "XOR", children: [] }],
    ["non-boolean not", { kind: "group", op: "AND", not: "yes", children: [] }],
    ["null child", { kind: "group", op: "AND", children: [null] }],
    ["unknown kind", { kind: "group", op: "AND", children: [{ kind: "foo" }] }],
    ["nested group without children", { kind: "group", op: "AND", children: [{ kind: "group", op: "AND" }] }],
    ["non-string field", { kind: "group", op: "AND", children: [{ kind: "condition", field: 1, operator: "eq", value: "a" }] }],
    ["missing operator", { kind: "group", op: "AND", children: [{ kind: "condition", field: "nome", value: "a" }] }],
    ["object value", { kind: "group", op: "AND", children: [cond({ a: 1 })] }],
    ["null value", { kind: "group", op: "AND", children: [cond(null)] }],
    ["nested array value", { kind: "group", op: "AND", children: [cond([["a"]])] }],
    ["NaN value", { kind: "group", op: "AND", children: [cond(Number.NaN)] }],
  ])("rejects %s", (_label, value) => {
    expect(isQueryGroup(value)).toBe(false);
  });

  it("bounds depth as the backend does (root = level 1)", () => {
    expect(isQueryGroup(nested(AST_MAX_DEPTH - 1))).toBe(true);
    expect(isQueryGroup(nested(AST_MAX_DEPTH))).toBe(false);
  });

  it("rejects very deep trees without overflowing the stack", () => {
    expect(isQueryGroup(nested(5000))).toBe(false);
  });
});

describe("decodeAst", () => {
  it("round-trips a valid AST", () => {
    expect(decodeAst(encodeAst(valid))).toEqual(valid);
  });

  it("returns null for garbage or malformed trees", () => {
    expect(decodeAst("not base64 !!")).toBeNull();
    expect(decodeAst(encodeRaw("text"))).toBeNull();
    expect(decodeAst(encodeRaw({ kind: "group", op: "AND", children: [null] }))).toBeNull();
    expect(decodeAst(encodeRaw({ kind: "group", op: "AND", children: [{ kind: "group", op: "OR" }] }))).toBeNull();
  });
});

describe("pruneAst", () => {
  it("drops malformed nodes instead of throwing", () => {
    const broken = {
      kind: "group",
      op: "AND",
      children: [null, { kind: "foo" }, { kind: "group", op: "OR" }, cond("Rossi")],
    } as unknown as QueryGroup;
    expect(pruneAst(broken)).toEqual({ kind: "group", op: "AND", children: [cond("Rossi")] });
  });
});
