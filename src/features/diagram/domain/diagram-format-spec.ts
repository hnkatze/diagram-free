import type { z } from "zod";

import { DEFAULT_DIAGRAM_NODE_TYPE, DIAGRAM_NODE_TYPES } from "./diagram-node-type";
import { diagramSourceSchema } from "./diagram-source";

/**
 * The worked example embedded in the format spec. Typed against the schema's own raw input
 * shape, so a future required field breaks this literal at compile time, not silently at runtime.
 */
export const DIAGRAM_FORMAT_EXAMPLE: z.input<typeof diagramSourceSchema> = {
  nodes: [
    { id: "start", label: "Start", type: "start" },
    { id: "check-payment", label: "Payment valid?", type: "decision" },
    { id: "charge-card", label: "Charge card", type: "process" },
    { id: "show-error", label: "Show error", type: "process" },
    { id: "end", label: "End", type: "end" },
  ],
  edges: [
    { from: "start", to: "check-payment" },
    { from: "check-payment", to: "charge-card", label: "Yes" },
    { from: "check-payment", to: "show-error", label: "No" },
    { from: "charge-card", to: "end" },
    { from: "show-error", to: "end" },
  ],
};

/**
 * Node/edge rules always read off `DIAGRAM_NODE_TYPES`/`DEFAULT_DIAGRAM_NODE_TYPE` by
 * interpolation so this text can never drift from what `diagramSourceSchema` actually accepts.
 */
export function buildDiagramFormatSpec(): string {
  const typeList = DIAGRAM_NODE_TYPES.map((type) => `"${type}"`).join(", ");
  const exampleJson = JSON.stringify(DIAGRAM_FORMAT_EXAMPLE, null, 2);

  return [
    "Format rules:",
    'Top level: { "nodes": [...], "edges": [...] }. "edges" is optional and defaults to [].',
    [
      "Each node:",
      '- "id": required, non-empty string, unique across all nodes',
      '- "label": required, non-empty string',
      `- "type": optional, one of ${typeList}; omitting it means the default, "${DEFAULT_DIAGRAM_NODE_TYPE}"`,
      '- "position": optional { "x", "y" }; omit it and the app lays the graph out automatically (it uses dagre)',
    ].join("\n"),
    [
      "Each edge:",
      '- "from" and "to": required, each must match the "id" of an existing node',
      '- "id": optional; when omitted it is derived as "${from}-${to}"',
      '- "label": optional',
      "Final edge ids (explicit or derived) must all be unique.",
    ].join("\n"),
    `Example:\n${exampleJson}`,
  ].join("\n\n");
}
