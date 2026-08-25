import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import { NODE_SIZE_BY_TYPE } from "../../domain/diagram-node-type";

type DecisionNodeType = Node<{ label: string }, "decision">;

/** A square rotated 45° inscribes a diamond whose vertices touch the container's edge midpoints. */
const { width, height } = NODE_SIZE_BY_TYPE.decision;
const DIAMOND_SIZE = Math.round(Math.min(width, height) / Math.SQRT2);
/** Largest axis-aligned square inscribed in a diamond of full width/height `width` is `width / 2`. */
const LABEL_BOX_SIZE = Math.round(width / 2);

export function DecisionNode({ data }: NodeProps<DecisionNodeType>) {
  return (
    <div style={{ width, height }} className="relative">
      <Handle type="target" position={Position.Top} />
      <div
        style={{ width: DIAMOND_SIZE, height: DIAMOND_SIZE }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-node-decision-border bg-node-decision"
      />
      <div
        style={{ width: LABEL_BOX_SIZE, height: LABEL_BOX_SIZE }}
        className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden text-center"
      >
        <span
          className="line-clamp-3 text-xs leading-tight font-medium break-words text-node-decision-foreground"
          title={data.label}
        >
          {data.label}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
}
