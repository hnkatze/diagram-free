import dagre from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";

import { NODE_SIZE_BY_TYPE, NODE_TYPE_LABEL } from "../domain/diagram-node-type";
import type { DiagramSource } from "../domain/diagram-source";
import { buildFlowGraph, layoutFlowNodes } from "./build-flow-graph";

type NodeSize = { readonly width: number; readonly height: number };

/**
 * Independently reproduces dagre's center placement with the same graph settings as
 * `build-flow-graph.ts`, avoiding hardcoded dagre absolute coordinates in assertions.
 */
function computeDagreCenters(
  nodeSizeById: ReadonlyMap<string, NodeSize>,
  edgePairs: readonly { readonly source: string; readonly target: string }[],
): ReadonlyMap<string, { readonly x: number; readonly y: number }> {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 60 });

  for (const [id, size] of nodeSizeById) {
    graph.setNode(id, { width: size.width, height: size.height });
  }
  for (const pair of edgePairs) {
    graph.setEdge(pair.source, pair.target);
  }

  dagre.layout(graph);

  const centers = new Map<string, { x: number; y: number }>();
  for (const id of nodeSizeById.keys()) {
    const label = graph.node(id);
    if (label && label.x !== undefined && label.y !== undefined) {
      centers.set(id, { x: label.x, y: label.y });
    }
  }
  return centers;
}

describe("buildFlowGraph", () => {
  it("converts each node's center to a top-left position using that node's OWN size", () => {
    const source: DiagramSource = {
      nodes: [
        { id: "d", label: "Decision", type: "decision" },
        { id: "p", label: "Process", type: "process" },
      ],
      edges: [{ id: "d-p", from: "d", to: "p" }],
    };

    const { nodes } = buildFlowGraph(source);
    const centers = computeDagreCenters(
      new Map([
        ["d", NODE_SIZE_BY_TYPE.decision],
        ["p", NODE_SIZE_BY_TYPE.process],
      ]),
      [{ source: "d", target: "p" }],
    );

    const decisionNode = nodes.find((node) => node.id === "d");
    const processNode = nodes.find((node) => node.id === "p");
    const decisionCenter = centers.get("d");
    const processCenter = centers.get("p");
    if (!decisionNode || !processNode || !decisionCenter || !processCenter) {
      throw new Error("Expected both nodes and their dagre centers to be resolved");
    }

    expect(decisionNode.position.x).toBeCloseTo(decisionCenter.x - NODE_SIZE_BY_TYPE.decision.width / 2);
    expect(decisionNode.position.y).toBeCloseTo(decisionCenter.y - NODE_SIZE_BY_TYPE.decision.height / 2);
    expect(processNode.position.x).toBeCloseTo(processCenter.x - NODE_SIZE_BY_TYPE.process.width / 2);
    expect(processNode.position.y).toBeCloseTo(processCenter.y - NODE_SIZE_BY_TYPE.process.height / 2);

    const decisionOffsetX = decisionCenter.x - decisionNode.position.x;
    const processOffsetX = processCenter.x - processNode.position.x;
    expect(decisionOffsetX).toBeCloseTo(NODE_SIZE_BY_TYPE.decision.width / 2);
    expect(processOffsetX).toBeCloseTo(NODE_SIZE_BY_TYPE.process.width / 2);
    expect(decisionOffsetX).not.toBeCloseTo(processOffsetX);
  });

  it("lets an explicit node position win over the computed one", () => {
    const source: DiagramSource = {
      nodes: [
        { id: "a", label: "A", type: "process", position: { x: 500, y: 500 } },
        { id: "b", label: "B", type: "process" },
      ],
      edges: [{ id: "a-b", from: "a", to: "b" }],
    };

    const { nodes } = buildFlowGraph(source);
    const nodeA = nodes.find((node) => node.id === "a");

    expect(nodeA?.position).toEqual({ x: 500, y: 500 });
  });

  it("computes a real position for nodes that do not declare one", () => {
    const source: DiagramSource = {
      nodes: [
        { id: "a", label: "A", type: "process" },
        { id: "b", label: "B", type: "process" },
      ],
      edges: [{ id: "a-b", from: "a", to: "b" }],
    };

    const { nodes } = buildFlowGraph(source);
    const nodeA = nodes.find((node) => node.id === "a");
    const nodeB = nodes.find((node) => node.id === "b");

    // "b" is one rank below "a" in a top-to-bottom layout, so it must sit lower on the canvas.
    expect(nodeB?.position.y).toBeGreaterThan(nodeA?.position.y ?? Number.POSITIVE_INFINITY);
  });

  it("carries the node type through to the React Flow node", () => {
    const source: DiagramSource = {
      nodes: [
        { id: "d", label: "Decision", type: "decision" },
        { id: "p", label: "Process", type: "process" },
      ],
      edges: [],
    };

    const { nodes } = buildFlowGraph(source);

    expect(nodes.find((node) => node.id === "d")?.type).toBe("decision");
    expect(nodes.find((node) => node.id === "p")?.type).toBe("process");
  });

  it("builds an ariaLabel including the type label and the node label", () => {
    const source: DiagramSource = {
      nodes: [{ id: "d", label: "Approved?", type: "decision" }],
      edges: [],
    };

    const { nodes } = buildFlowGraph(source);

    expect(nodes[0]?.ariaLabel).toBe(`${NODE_TYPE_LABEL.decision}: Approved?`);
  });

  it("carries edges with resolved id, source, target, and label when present", () => {
    const source: DiagramSource = {
      nodes: [
        { id: "a", label: "A", type: "process" },
        { id: "b", label: "B", type: "process" },
        { id: "c", label: "C", type: "process" },
      ],
      edges: [
        { id: "a-b", from: "a", to: "b", label: "Yes" },
        { id: "b-c", from: "b", to: "c" },
      ],
    };

    const { edges } = buildFlowGraph(source);
    const labeledEdge = edges.find((edge) => edge.id === "a-b");
    const unlabeledEdge = edges.find((edge) => edge.id === "b-c");

    expect(labeledEdge).toMatchObject({ id: "a-b", source: "a", target: "b", label: "Yes" });
    expect(unlabeledEdge).toMatchObject({ id: "b-c", source: "b", target: "c" });
    expect(unlabeledEdge && "label" in unlabeledEdge).toBe(false);
  });
});

describe("layoutFlowNodes", () => {
  it("preserves every non-position property and does not drop hand-drawn edges (regression)", () => {
    // Constructed directly, not from any DiagramSource — the old "Auto layout" bug rebuilt
    // the graph from the last imported source, silently dropping hand-drawn edges like this one.
    const nodes: Node[] = [
      {
        id: "x",
        type: "process",
        position: { x: 0, y: 0 },
        data: { label: "X" },
        ariaLabel: "Process: X",
      },
      {
        id: "y",
        type: "decision",
        position: { x: 0, y: 0 },
        data: { label: "Y" },
        ariaLabel: "Decision: Y",
      },
    ];
    const handDrawnEdge: Edge = { id: "hand-drawn-x-y", source: "x", target: "y", label: "manual" };

    const result = layoutFlowNodes(nodes, [handDrawnEdge]);

    expect(result).toHaveLength(2);
    const resultX = result.find((node) => node.id === "x");
    const resultY = result.find((node) => node.id === "y");
    if (!resultX || !resultY) {
      throw new Error("Expected both nodes to survive layoutFlowNodes");
    }

    expect(resultX.data).toEqual({ label: "X" });
    expect(resultX.type).toBe("process");
    expect(resultX.ariaLabel).toBe("Process: X");
    expect(resultY.data).toEqual({ label: "Y" });
    expect(resultY.type).toBe("decision");
    expect(resultY.ariaLabel).toBe("Decision: Y");

    // The hand-drawn edge must actually have driven the layout (proving it was not
    // silently ignored): "y" is downstream of "x" in a top-to-bottom layout.
    expect(resultY.position.y).toBeGreaterThan(resultX.position.y);
  });

  it("falls back to the default node size for an undefined or unrecognized type, without throwing", () => {
    const nodes: Node[] = [
      { id: "a", position: { x: 0, y: 0 }, data: { label: "A" } },
      { id: "b", type: "totally-unrecognized-type", position: { x: 0, y: 0 }, data: { label: "B" } },
    ];
    const edges: Edge[] = [{ id: "a-b", source: "a", target: "b" }];

    const layout = () => layoutFlowNodes(nodes, edges);
    expect(layout).not.toThrow();

    const result = layout();
    const centers = computeDagreCenters(
      new Map([
        ["a", NODE_SIZE_BY_TYPE.process],
        ["b", NODE_SIZE_BY_TYPE.process],
      ]),
      [{ source: "a", target: "b" }],
    );
    const nodeA = result.find((node) => node.id === "a");
    const centerA = centers.get("a");
    if (!nodeA || !centerA) {
      throw new Error("Expected node 'a' and its dagre center to be resolved");
    }

    expect(nodeA.position.x).toBeCloseTo(centerA.x - NODE_SIZE_BY_TYPE.process.width / 2);
    expect(nodeA.position.y).toBeCloseTo(centerA.y - NODE_SIZE_BY_TYPE.process.height / 2);
  });
});
