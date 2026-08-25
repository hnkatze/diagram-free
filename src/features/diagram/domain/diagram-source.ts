import { z } from "zod";

import {
  DEFAULT_DIAGRAM_NODE_TYPE,
  DIAGRAM_NODE_TYPES,
  type DiagramNodeType,
} from "./diagram-node-type";

const NON_EMPTY_STRING_MESSAGE = "expected a non-empty string";
const NODE_TYPE_MESSAGE = `expected one of ${DIAGRAM_NODE_TYPES.map((type) => `"${type}"`).join(", ")}`;

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const rawNodeSchema = z.object({
  id: z.string({ error: NON_EMPTY_STRING_MESSAGE }).min(1, NON_EMPTY_STRING_MESSAGE),
  label: z.string({ error: NON_EMPTY_STRING_MESSAGE }).min(1, NON_EMPTY_STRING_MESSAGE),
  type: z.enum(DIAGRAM_NODE_TYPES, { error: NODE_TYPE_MESSAGE }).optional(),
  position: positionSchema.optional(),
});

const rawEdgeSchema = z.object({
  from: z.string({ error: NON_EMPTY_STRING_MESSAGE }).min(1, NON_EMPTY_STRING_MESSAGE),
  to: z.string({ error: NON_EMPTY_STRING_MESSAGE }).min(1, NON_EMPTY_STRING_MESSAGE),
  id: z.string().min(1, NON_EMPTY_STRING_MESSAGE).optional(),
  label: z.string().optional(),
});

const rawDiagramSourceSchema = z.object({
  nodes: z.array(rawNodeSchema, { error: "expected an array of nodes" }),
  edges: z.array(rawEdgeSchema, { error: "expected an array of edges" }).optional(),
});

export type DiagramSourceNode = {
  readonly id: string;
  readonly label: string;
  readonly type: DiagramNodeType;
  readonly position?: { readonly x: number; readonly y: number };
};

export type DiagramSourceEdge = {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly label?: string;
};

export type DiagramSource = {
  readonly nodes: readonly DiagramSourceNode[];
  readonly edges: readonly DiagramSourceEdge[];
};

/**
 * Cross-field rules (unique node ids, resolved edge endpoints, unique derived edge ids)
 * can't be expressed by per-field schemas, so they run here and report via `ctx.addIssue`.
 */
export const diagramSourceSchema = rawDiagramSourceSchema.transform((raw, ctx): DiagramSource => {
  const nodeIds = new Set<string>();
  raw.nodes.forEach((node, index) => {
    if (nodeIds.has(node.id)) {
      ctx.addIssue({
        code: "custom",
        message: `duplicate node id "${node.id}"`,
        path: ["nodes", index, "id"],
      });
      return;
    }
    nodeIds.add(node.id);
  });

  const rawEdges = raw.edges ?? [];
  const edgeIds = new Set<string>();
  const edges: DiagramSourceEdge[] = [];

  rawEdges.forEach((edge, index) => {
    if (!nodeIds.has(edge.from)) {
      ctx.addIssue({
        code: "custom",
        message: `no node with id "${edge.from}"`,
        path: ["edges", index, "from"],
      });
    }
    if (!nodeIds.has(edge.to)) {
      ctx.addIssue({
        code: "custom",
        message: `no node with id "${edge.to}"`,
        path: ["edges", index, "to"],
      });
    }

    const id = edge.id ?? `${edge.from}-${edge.to}`;
    if (edgeIds.has(id)) {
      ctx.addIssue({
        code: "custom",
        message: `duplicate edge id "${id}"`,
        path: ["edges", index, "id"],
      });
      return;
    }
    edgeIds.add(id);

    edges.push({
      id,
      from: edge.from,
      to: edge.to,
      ...(edge.label !== undefined ? { label: edge.label } : {}),
    });
  });

  const nodes: DiagramSourceNode[] = raw.nodes.map((node) => ({
    id: node.id,
    label: node.label,
    type: node.type ?? DEFAULT_DIAGRAM_NODE_TYPE,
    ...(node.position !== undefined ? { position: node.position } : {}),
  }));

  return { nodes, edges };
});
