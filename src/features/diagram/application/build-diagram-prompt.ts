import type { Edge, Node } from "@xyflow/react";

import { buildDiagramFormatSpec } from "../domain/diagram-format-spec";
import { resolveDiagramNodeType } from "../domain/diagram-node-type";

const INTRO = "You generate flow diagrams as JSON for an app that renders them.";

const REFERENCE_HEADER = "For reference, here is the flow I currently have:";

const GENERATE_INSTRUCTION = "Generate the flow I describe next, replying with ONLY the JSON.";

function resolveNodeLabel(node: Node): string {
  const label = node.data.label;
  return typeof label === "string" && label.length > 0 ? label : node.id;
}

function resolveEdgeLabel(edge: Edge): string | undefined {
  return typeof edge.label === "string" && edge.label.length > 0 ? edge.label : undefined;
}

/**
 * One combined connection list; a node's type is shown in parens only the first time its
 * label appears (as source or target), then a trailing line covers any node with no edges at all.
 */
function buildReferenceLines(nodes: readonly Node[], edges: readonly Edge[]): readonly string[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node] as const));
  const seen = new Set<string>();
  const lines: string[] = [];

  for (const edge of edges) {
    const sourceNode = nodeById.get(edge.source);
    const targetNode = nodeById.get(edge.target);
    const sourceLabel = sourceNode ? resolveNodeLabel(sourceNode) : edge.source;
    const targetLabel = targetNode ? resolveNodeLabel(targetNode) : edge.target;
    const sourceType = seen.has(edge.source)
      ? ""
      : ` (${resolveDiagramNodeType(sourceNode?.type)})`;
    const edgeLabel = resolveEdgeLabel(edge);
    const suffix = edgeLabel === undefined ? "" : ` [${edgeLabel}]`;

    lines.push(`- ${sourceLabel}${sourceType} -> ${targetLabel}${suffix}`);
    seen.add(edge.source);
    seen.add(edge.target);
  }

  for (const node of nodes) {
    if (!seen.has(node.id)) {
      lines.push(`- ${resolveNodeLabel(node)} (${resolveDiagramNodeType(node.type)})`);
    }
  }

  return lines;
}

/**
 * Reads the CURRENT React Flow graph, never a `DiagramSource` — hand-drawn edges and moved
 * nodes have already diverged from whatever was last imported.
 */
export function buildDiagramPrompt(nodes: readonly Node[], edges: readonly Edge[]): string {
  const sections = [INTRO, buildDiagramFormatSpec()];

  if (nodes.length > 0) {
    const referenceLines = buildReferenceLines(nodes, edges);
    sections.push([REFERENCE_HEADER, referenceLines.join("\n")].join("\n\n"));
  }

  sections.push(GENERATE_INSTRUCTION);

  return sections.join("\n\n");
}
