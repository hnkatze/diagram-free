import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import { NODE_SIZE_BY_TYPE } from "../../domain/diagram-node-type";

type ProcessNodeType = Node<{ label: string }, "process">;

export function ProcessNode({ data }: NodeProps<ProcessNodeType>) {
  const { width, height } = NODE_SIZE_BY_TYPE.process;

  return (
    <div
      style={{ width, height }}
      className="flex items-center justify-center rounded-md border border-node-process-border bg-node-process px-4 text-center text-sm font-medium text-node-process-foreground"
    >
      <Handle type="target" position={Position.Top} />
      {data.label}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
