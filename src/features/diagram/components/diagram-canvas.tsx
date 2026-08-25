"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type ColorModeClass,
  type Edge,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { diagramNodeTypes } from "./nodes";

type DiagramCanvasProps = {
  readonly nodes: readonly Node[];
  readonly edges: readonly Edge[];
  readonly onNodesChange: OnNodesChange<Node>;
  readonly onEdgesChange: OnEdgesChange<Edge>;
  readonly onConnect: OnConnect;
  readonly label: string;
  readonly colorMode: ColorModeClass;
};

export function DiagramCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  label,
  colorMode,
}: DiagramCanvasProps) {
  const isEmpty = nodes.length === 0;

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={[...nodes]}
        edges={[...edges]}
        nodeTypes={diagramNodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        aria-label={label}
        colorMode={colorMode}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <p className="rounded-lg border border-dashed border-border bg-background/80 px-4 py-3 text-center text-sm text-muted-foreground">
            No diagram loaded yet. Use &ldquo;Import JSON&rdquo; to load nodes and edges.
          </p>
        </div>
      )}
    </div>
  );
}
