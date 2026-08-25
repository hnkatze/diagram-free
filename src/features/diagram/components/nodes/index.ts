import type { NodeTypes } from "@xyflow/react";

import type { DiagramNodeType } from "../../domain/diagram-node-type";
import { DecisionNode } from "./decision-node";
import { EndNode } from "./end-node";
import { ProcessNode } from "./process-node";
import { StartNode } from "./start-node";

/**
 * Defined once at module scope: a fresh object passed as React Flow's `nodeTypes` prop on
 * every render would remount every node in the graph.
 */
export const diagramNodeTypes = {
  start: StartNode,
  process: ProcessNode,
  decision: DecisionNode,
  end: EndNode,
} as const satisfies Record<DiagramNodeType, NodeTypes[string]>;
