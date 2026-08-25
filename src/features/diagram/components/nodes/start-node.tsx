import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import { NODE_SIZE_BY_TYPE } from "../../domain/diagram-node-type";

type StartNodeType = Node<{ label: string }, "start">;

export function StartNode({ data }: NodeProps<StartNodeType>) {
  const { width, height } = NODE_SIZE_BY_TYPE.start;

  return (
    <div
      style={{ width, height }}
      className="flex items-center justify-center rounded-full border-2 border-node-start-border bg-node-start px-4 text-center text-sm font-medium text-node-start-foreground"
    >
      {data.label}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
