import dagre from "@dagrejs/dagre";
import type { EdgeLabel, Graph as DagreGraph, GraphLabel, NodeLabel } from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";

import {
  NODE_SIZE_BY_TYPE,
  NODE_TYPE_LABEL,
  resolveDiagramNodeType,
} from "../domain/diagram-node-type";
import type { DiagramSource } from "../domain/diagram-source";

const FALLBACK_SIZE = NODE_SIZE_BY_TYPE.process;
const GRID_COLUMNS = 4;
const GRID_GAP = 60;

type EdgePair = { readonly source: string; readonly target: string };
type Position = { readonly x: number; readonly y: number };
type NodeSize = { readonly width: number; readonly height: number };

function buildDagreGraph(
  nodeSizeById: ReadonlyMap<string, NodeSize>,
  edgePairs: readonly EdgePair[],
): DagreGraph<GraphLabel, NodeLabel, EdgeLabel> {
  const graph = new dagre.graphlib.Graph<GraphLabel, NodeLabel, EdgeLabel>();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 60 });

  for (const [id, size] of nodeSizeById) {
    graph.setNode(id, { width: size.width, height: size.height });
  }
  for (const pair of edgePairs) {
    graph.setEdge(pair.source, pair.target);
  }

  dagre.layout(graph);
  return graph;
}

/**
 * `graph.node()` is typed as always returning a label; this falls back to a grid instead of
 * trusting that or throwing. Unreachable-by-construction today — kept as a defensive net.
 */
function resolveNodeCenter(
  graph: DagreGraph<GraphLabel, NodeLabel, EdgeLabel>,
  nodeId: string,
  fallbackIndex: number,
  size: NodeSize,
): Position {
  const label = graph.node(nodeId);
  if (label && label.x !== undefined && label.y !== undefined) {
    return { x: label.x, y: label.y };
  }
  const column = fallbackIndex % GRID_COLUMNS;
  const row = Math.floor(fallbackIndex / GRID_COLUMNS);
  return {
    x: column * (FALLBACK_SIZE.width + GRID_GAP) + size.width / 2,
    y: row * (FALLBACK_SIZE.height + GRID_GAP) + size.height / 2,
  };
}

function centerToPosition(center: Position, size: NodeSize): Position {
  return { x: center.x - size.width / 2, y: center.y - size.height / 2 };
}

/**
 * Dagre lays out the whole graph first (rank by rank, top to bottom); any node with an
 * explicit `position` then overwrites that computed placement in the final result.
 */
export function buildFlowGraph(source: DiagramSource): { nodes: Node[]; edges: Edge[] } {
  const nodeSizeById = new Map(
    source.nodes.map((node) => [node.id, NODE_SIZE_BY_TYPE[node.type]] as const),
  );
  const edgePairs = source.edges.map((edge) => ({ source: edge.from, target: edge.to }));
  const graph = buildDagreGraph(nodeSizeById, edgePairs);

  const nodes: Node[] = source.nodes.map((node, index) => {
    const size = NODE_SIZE_BY_TYPE[node.type];
    const computedPosition = centerToPosition(
      resolveNodeCenter(graph, node.id, index, size),
      size,
    );
    return {
      id: node.id,
      type: node.type,
      position: node.position ?? computedPosition,
      data: { label: node.label },
      ariaLabel: `${NODE_TYPE_LABEL[node.type]}: ${node.label}`,
    };
  });

  const edges: Edge[] = source.edges.map((edge) => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    ...(edge.label !== undefined ? { label: edge.label } : {}),
  }));

  return { nodes, edges };
}

/**
 * Re-lays out the current graph in place: every node is repositioned, including ones that
 * originally carried an explicit `position` — that is what "Auto layout" is expected to do.
 */
export function layoutFlowNodes(nodes: readonly Node[], edges: readonly Edge[]): Node[] {
  const nodeSizeById = new Map(
    nodes.map((node) => [node.id, NODE_SIZE_BY_TYPE[resolveDiagramNodeType(node.type)]] as const),
  );
  const edgePairs = edges.map((edge) => ({ source: edge.source, target: edge.target }));
  const graph = buildDagreGraph(nodeSizeById, edgePairs);

  return nodes.map((node, index) => {
    const size = NODE_SIZE_BY_TYPE[resolveDiagramNodeType(node.type)];
    return {
      ...node,
      position: centerToPosition(resolveNodeCenter(graph, node.id, index, size), size),
    };
  });
}
