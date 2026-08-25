export const DIAGRAM_NODE_TYPES = ["start", "process", "decision", "end"] as const;

export type DiagramNodeType = (typeof DIAGRAM_NODE_TYPES)[number];

export const DEFAULT_DIAGRAM_NODE_TYPE: DiagramNodeType = "process";

/**
 * Single source of truth for on-canvas node footprint: dagre uses these for layout and the
 * node components render at exactly these pixel dimensions, so they must never diverge.
 */
export const NODE_SIZE_BY_TYPE: Readonly<
  Record<DiagramNodeType, { readonly width: number; readonly height: number }>
> = {
  start: { width: 160, height: 48 },
  process: { width: 180, height: 56 },
  decision: { width: 160, height: 160 },
  end: { width: 160, height: 48 },
};

export const NODE_TYPE_LABEL: Readonly<Record<DiagramNodeType, string>> = {
  start: "Start",
  process: "Process",
  decision: "Decision",
  end: "End",
};

function isDiagramNodeType(value: string | undefined): value is DiagramNodeType {
  return value !== undefined && (DIAGRAM_NODE_TYPES as readonly string[]).includes(value);
}

/** React Flow's `Node.type` is `string | undefined`; unknown or missing values fall back to the default. */
export function resolveDiagramNodeType(type: string | undefined): DiagramNodeType {
  return isDiagramNodeType(type) ? type : DEFAULT_DIAGRAM_NODE_TYPE;
}
