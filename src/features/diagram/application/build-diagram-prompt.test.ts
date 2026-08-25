import type { Edge, Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";

import { DIAGRAM_NODE_TYPES } from "../domain/diagram-node-type";
import { buildDiagramPrompt } from "./build-diagram-prompt";

function node(id: string, label: string, type?: string): Node {
  return { id, type, position: { x: 0, y: 0 }, data: { label } };
}

describe("buildDiagramPrompt", () => {
  it("lists connections using labels, not ids, with the source's type on first mention", () => {
    const nodes = [node("a", "Start", "start"), node("b", "Process order", "process")];
    const edges: Edge[] = [{ id: "a-b", source: "a", target: "b" }];

    const prompt = buildDiagramPrompt(nodes, edges);

    expect(prompt).toContain("- Start (start) -> Process order");
    expect(prompt).not.toContain("a -> b");
  });

  it("renders an edge label in brackets when present", () => {
    const nodes = [node("a", "Approved?", "decision"), node("b", "Ship order", "process")];
    const edges: Edge[] = [{ id: "a-b", source: "a", target: "b", label: "Yes" }];

    const prompt = buildDiagramPrompt(nodes, edges);

    expect(prompt).toContain("- Approved? (decision) -> Ship order [Yes]");
  });

  it("omits the bracket entirely when an edge has no label", () => {
    const nodes = [node("a", "A"), node("b", "B")];
    const edges: Edge[] = [{ id: "a-b", source: "a", target: "b" }];

    const prompt = buildDiagramPrompt(nodes, edges);

    expect(prompt).toContain("- A (process) -> B");
    expect(prompt).not.toMatch(/A \(process\) -> B \[/);
  });

  it("falls back to the default node type for an undefined or unrecognized type", () => {
    const nodes = [node("a", "A", undefined), node("b", "B", "totally-unrecognized")];
    const edges: Edge[] = [{ id: "a-b", source: "a", target: "b" }];

    const prompt = buildDiagramPrompt(nodes, edges);

    expect(prompt).toContain("- A (process) -> B");
  });

  it("falls back to the node id when the label is missing", () => {
    const nodes: Node[] = [
      { id: "orphan", type: "process", position: { x: 0, y: 0 }, data: {} },
      node("b", "B", "process"),
    ];
    const edges: Edge[] = [{ id: "orphan-b", source: "orphan", target: "b" }];

    const prompt = buildDiagramPrompt(nodes, edges);

    expect(prompt).toContain("- orphan (process) -> B");
  });

  it("does not show a node's type again once it has already appeared", () => {
    const nodes = [
      node("a", "Start", "start"),
      node("b", "Process order", "process"),
      node("c", "Approved?", "decision"),
    ];
    const edges: Edge[] = [
      { id: "a-b", source: "a", target: "b" },
      { id: "b-c", source: "b", target: "c" },
    ];

    const prompt = buildDiagramPrompt(nodes, edges);

    expect(prompt).toContain("- Start (start) -> Process order");
    expect(prompt).toContain("- Process order -> Approved?");
    expect(prompt).not.toContain("Process order (process)");
  });

  it("still lists a node with no outgoing edges", () => {
    const nodes = [
      node("a", "Start", "start"),
      node("b", "End", "end"),
      node("c", "Unused", "process"),
    ];
    const edges: Edge[] = [{ id: "a-b", source: "a", target: "b" }];

    const prompt = buildDiagramPrompt(nodes, edges);

    expect(prompt).toContain("- Start (start) -> End");
    expect(prompt).toContain("- Unused (process)");
  });

  it("returns only the rules and the generate instruction for an empty graph, with no reference section", () => {
    const prompt = buildDiagramPrompt([], []);

    expect(prompt).not.toContain("For reference");
    expect(prompt).not.toContain("Nodes:");
    expect(prompt).not.toContain("Connections:");
    expect(prompt).toContain("Format rules:");
    expect(prompt).toMatch(/Generate the flow I describe next/i);
  });

  it("includes the format rules section for an empty graph", () => {
    const prompt = buildDiagramPrompt([], []);

    expect(prompt).toContain("Format rules:");
    expect(prompt).toContain('"nodes"');
    expect(prompt).toContain('"edges"');
  });

  it("orders rules, reference section, and generate instruction for a non-empty graph", () => {
    const nodes = [node("a", "Start", "start"), node("b", "Process order", "process")];
    const edges: Edge[] = [{ id: "a-b", source: "a", target: "b" }];

    const prompt = buildDiagramPrompt(nodes, edges);

    const rulesIndex = prompt.indexOf("Format rules:");
    const referenceIndex = prompt.indexOf("For reference, here is the flow I currently have:");
    const generateIndex = prompt.indexOf("Generate the flow I describe next");

    expect(rulesIndex).toBeGreaterThanOrEqual(0);
    expect(referenceIndex).toBeGreaterThan(rulesIndex);
    expect(generateIndex).toBeGreaterThan(referenceIndex);
  });

  it("never asks the AI to review the current diagram", () => {
    const nodes = [node("a", "Start", "start"), node("b", "Process order", "process")];
    const edges: Edge[] = [{ id: "a-b", source: "a", target: "b" }];

    const emptyPrompt = buildDiagramPrompt([], []);
    const filledPrompt = buildDiagramPrompt(nodes, edges);

    expect(emptyPrompt).not.toContain("Help me review it");
    expect(filledPrompt).not.toContain("Help me review it");
  });

  it("mentions every allowed node type in the format rules, so a new type can't rot the prompt silently", () => {
    const prompt = buildDiagramPrompt([], []);

    for (const type of DIAGRAM_NODE_TYPES) {
      expect(prompt).toContain(`"${type}"`);
    }
  });

  it("includes an edge that exists ONLY in the passed-in arrays, never in any DiagramSource (regression)", () => {
    // Reproduces the "Auto layout" bug class: a hand-drawn edge that only ever lived in
    // React Flow state, with no DiagramSource behind it, must still show up in the prompt.
    const nodes = [node("x", "X", "process"), node("y", "Y", "decision")];
    const handDrawnEdge: Edge = { id: "hand-drawn-x-y", source: "x", target: "y", label: "manual" };

    const prompt = buildDiagramPrompt(nodes, [handDrawnEdge]);

    expect(prompt).toContain("- X (process) -> Y [manual]");
  });
});
