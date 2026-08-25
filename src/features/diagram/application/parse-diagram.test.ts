import { describe, expect, it } from "vitest";

import { parseDiagram } from "./parse-diagram";

/** Narrows a `ParseDiagramResult` for a test that expects the successful branch. */
function expectOk(raw: string) {
  const result = parseDiagram(raw);
  if (!result.ok) {
    throw new Error(`Expected parseDiagram to succeed, got errors: ${result.errors.join(", ")}`);
  }
  return result.value;
}

/** Narrows a `ParseDiagramResult` for a test that expects the failing branch. */
function expectErrors(raw: string) {
  const result = parseDiagram(raw);
  if (result.ok) {
    throw new Error("Expected parseDiagram to fail, but it succeeded");
  }
  return result.errors;
}

describe("parseDiagram", () => {
  it("parses a valid minimal diagram", () => {
    const value = expectOk(
      JSON.stringify({
        nodes: [{ id: "a", label: "A", type: "start" }],
        edges: [],
      }),
    );

    expect(value).toEqual({
      nodes: [{ id: "a", label: "A", type: "start" }],
      edges: [],
    });
  });

  it("rejects an empty string", () => {
    const errors = expectErrors("");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/paste some json/i);
  });

  it("rejects whitespace-only input", () => {
    const errors = expectErrors("   \n\t  ");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/paste some json/i);
  });

  it("rejects malformed JSON with a readable message, not the raw engine wording", () => {
    const errors = expectErrors("{ not valid json");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/^Invalid JSON:/);
  });

  it("defaults edges to an empty array when omitted entirely", () => {
    const value = expectOk(
      JSON.stringify({
        nodes: [{ id: "a", label: "A" }],
      }),
    );

    expect(value.edges).toEqual([]);
  });

  it("rejects a node missing an id", () => {
    const errors = expectErrors(
      JSON.stringify({
        nodes: [{ label: "A" }],
      }),
    );
    expect(errors.some((e) => e.includes("nodes[0].id"))).toBe(true);
  });

  it("rejects a node missing a label", () => {
    const errors = expectErrors(
      JSON.stringify({
        nodes: [{ id: "a" }],
      }),
    );
    expect(errors.some((e) => e.includes("nodes[0].label"))).toBe(true);
  });

  it("rejects a node with an empty-string id", () => {
    const errors = expectErrors(
      JSON.stringify({
        nodes: [{ id: "", label: "A" }],
      }),
    );
    expect(errors.some((e) => e.includes("nodes[0].id"))).toBe(true);
  });

  it("rejects a duplicate node id, naming the offending id", () => {
    const errors = expectErrors(
      JSON.stringify({
        nodes: [
          { id: "a", label: "A" },
          { id: "a", label: "A again" },
        ],
      }),
    );
    expect(errors.some((e) => e.includes('duplicate node id "a"'))).toBe(true);
  });

  it("rejects an edge referencing a node id that does not exist, naming it", () => {
    const errors = expectErrors(
      JSON.stringify({
        nodes: [{ id: "a", label: "A" }],
        edges: [{ from: "a", to: "missing-node" }],
      }),
    );
    expect(errors.some((e) => e.includes('no node with id "missing-node"'))).toBe(true);
  });

  it("derives an omitted edge id as `${from}-${to}`", () => {
    const value = expectOk(
      JSON.stringify({
        nodes: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
        edges: [{ from: "a", to: "b" }],
      }),
    );

    expect(value.edges).toEqual([{ id: "a-b", from: "a", to: "b" }]);
  });

  it("rejects two edges that derive the same id", () => {
    const errors = expectErrors(
      JSON.stringify({
        nodes: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
        edges: [
          { from: "a", to: "b" },
          { from: "a", to: "b" },
        ],
      }),
    );
    expect(errors.some((e) => e.includes('duplicate edge id "a-b"'))).toBe(true);
  });

  it("normalizes an omitted node type to the process default", () => {
    const value = expectOk(
      JSON.stringify({
        nodes: [{ id: "a", label: "A" }],
      }),
    );

    expect(value.nodes[0]?.type).toBe("process");
  });

  it("rejects an invalid node type, listing the allowed values", () => {
    const errors = expectErrors(
      JSON.stringify({
        nodes: [{ id: "a", label: "A", type: "bogus" }],
      }),
    );
    const message = errors.find((e) => e.includes("nodes[0].type"));
    expect(message).toBeDefined();
    expect(message).toContain("start");
    expect(message).toContain("process");
    expect(message).toContain("decision");
    expect(message).toContain("end");
  });

  it.each(["[]", "42", "null"])("rejects a non-object top level (%s)", (raw) => {
    const errors = expectErrors(raw);
    expect(errors.length).toBeGreaterThan(0);
  });
});
