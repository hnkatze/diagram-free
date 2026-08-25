import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import { NODE_SIZE_BY_TYPE } from "../../domain/diagram-node-type";

type EndNodeType = Node<{ label: string }, "end">;

export function EndNode({ data }: NodeProps<EndNodeType>) {
  const { width, height } = NODE_SIZE_BY_TYPE.end;

  return (
    <div
      style={{ width, height }}
      className="flex items-center justify-center rounded-full border-2 border-node-end-border bg-node-end px-4 text-center text-sm font-medium text-node-end-foreground"
    >
      <Handle type="target" position={Position.Top} />
      {data.label}
    </div>
  );
}
