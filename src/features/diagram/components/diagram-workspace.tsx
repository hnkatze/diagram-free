"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addEdge,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type ColorModeClass,
  type Edge,
  type Node,
  type OnConnect,
} from "@xyflow/react";
import { toPng } from "html-to-image";
import { useTheme } from "next-themes";

import { useHydrated } from "@/hooks/use-hydrated";

import { buildDiagramPrompt } from "../application/build-diagram-prompt";
import { buildFlowGraph, layoutFlowNodes } from "../application/build-flow-graph";
import {
  buildExportPngOptions,
  computeExportTransform,
  EXPORT_PNG_FILENAME,
} from "../application/export-diagram-png";
import type { DiagramSource } from "../domain/diagram-source";
import type { DiagramTemplate } from "../domain/diagram-templates";
import { DiagramCanvas } from "./diagram-canvas";
import { DiagramImportDialog } from "./diagram-import-dialog";
import { DiagramPromptFallbackDialog } from "./diagram-prompt-fallback-dialog";
import { DiagramToolbar } from "./diagram-toolbar";

const COPIED_CONFIRMATION_DURATION_MS = 2000;

/** The exported PNG must match the theme actually on screen, so this reads the same CSS custom property `bg-background` resolves to rather than re-deriving color from `canvasColorMode`. */
function resolveExportBackgroundColor(): string | null {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
  return value.length > 0 ? value : null;
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

type PromptFallbackState =
  | { readonly open: false }
  | { readonly open: true; readonly prompt: string };

function DiagramWorkspaceContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [promptFallbackState, setPromptFallbackState] = useState<PromptFallbackState>({
    open: false,
  });
  const [isCopied, setIsCopied] = useState(false);
  const isCopyInFlightRef = useRef(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const isExportInFlightRef = useRef(false);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();
  const { resolvedTheme } = useTheme();
  const isHydrated = useHydrated();

  // resolvedTheme is undefined until next-themes settles on the client; defaulting to
  // "light" beforehand matches the server-rendered markup and avoids a hydration mismatch.
  const canvasColorMode: ColorModeClass = isHydrated && resolvedTheme === "dark" ? "dark" : "light";

  const onConnect = useCallback<OnConnect>(
    (connection) => setEdges((current) => addEdge(connection, current)),
    [setEdges],
  );

  const handleImport = useCallback(
    (source: DiagramSource) => {
      const graph = buildFlowGraph(source);
      setNodes(graph.nodes);
      setEdges(graph.edges);
    },
    [setNodes, setEdges],
  );

  const handleSelectTemplate = useCallback(
    (template: DiagramTemplate) => {
      handleImport(template.source);
    },
    [handleImport],
  );

  const handleAutoLayout = useCallback(() => {
    setNodes((current) => layoutFlowNodes(current, edges));
  }, [edges, setNodes]);

  const handleFitView = useCallback(() => {
    void fitView({ duration: 200 });
  }, [fitView]);

  const copyPromptToClipboard = useCallback(async () => {
    const prompt = buildDiagramPrompt(nodes, edges);
    const clipboard = navigator.clipboard;
    if (!clipboard) {
      setPromptFallbackState({ open: true, prompt });
      return;
    }

    try {
      await clipboard.writeText(prompt);
      setIsCopied(true);
    } catch (error) {
      console.error("Failed to copy diagram prompt to clipboard:", error);
      setPromptFallbackState({ open: true, prompt });
    }
  }, [nodes, edges]);

  // Drop clicks that arrive while a copy is still in flight — otherwise two concurrent
  // writeText calls can race and show the fallback dialog and "Copied" status at once.
  const handleCopyPrompt = useCallback(() => {
    if (isCopyInFlightRef.current) {
      return;
    }
    isCopyInFlightRef.current = true;
    void copyPromptToClipboard().finally(() => {
      isCopyInFlightRef.current = false;
    });
  }, [copyPromptToClipboard]);

  const handlePromptFallbackOpenChange = useCallback((open: boolean) => {
    setPromptFallbackState((current) => (open ? current : { open: false }));
  }, []);

  const exportDiagramAsPng = useCallback(async () => {
    const viewportElement = canvasWrapperRef.current?.querySelector<HTMLElement>(
      ".react-flow__viewport",
    );
    if (!viewportElement) {
      setExportError("Could not find the diagram canvas to export.");
      return;
    }

    const transformResult = computeExportTransform(nodes);
    if (!transformResult.ok) {
      setExportError(transformResult.reason);
      return;
    }

    const backgroundColor = resolveExportBackgroundColor();
    if (backgroundColor === null) {
      setExportError("Could not read the current theme background to export the diagram.");
      return;
    }

    try {
      const dataUrl = await toPng(
        viewportElement,
        buildExportPngOptions(transformResult.value, backgroundColor),
      );
      downloadDataUrl(dataUrl, EXPORT_PNG_FILENAME);
      setExportError(null);
    } catch (error) {
      console.error("Failed to export diagram as PNG:", error);
      setExportError("Could not export the diagram as an image. Please try again.");
    }
  }, [nodes]);

  // Drop clicks that arrive while an export is still in flight — the same guard used for
  // "Copy as prompt" above, since a second concurrent toPng call would race the first.
  const handleExportPng = useCallback(() => {
    if (isExportInFlightRef.current) {
      return;
    }
    isExportInFlightRef.current = true;
    void exportDiagramAsPng().finally(() => {
      isExportInFlightRef.current = false;
    });
  }, [exportDiagramAsPng]);

  // Auto-dismiss the "Copied" confirmation without letting a stale timer fire after unmount.
  useEffect(() => {
    if (!isCopied) {
      return;
    }
    const timeoutId = setTimeout(() => setIsCopied(false), COPIED_CONFIRMATION_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [isCopied]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DiagramToolbar
        onImport={() => setIsImportOpen(true)}
        onSelectTemplate={handleSelectTemplate}
        onAutoLayout={handleAutoLayout}
        onFitView={handleFitView}
        onCopyPrompt={handleCopyPrompt}
        onExportPng={handleExportPng}
        isCopied={isCopied}
        isEmpty={nodes.length === 0}
        exportError={exportError}
      />
      <div ref={canvasWrapperRef} className="min-h-0 flex-1">
        <DiagramCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          label="Diagram editor canvas"
          colorMode={canvasColorMode}
        />
      </div>
      <DiagramImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} onImport={handleImport} />
      <DiagramPromptFallbackDialog
        open={promptFallbackState.open}
        onOpenChange={handlePromptFallbackOpenChange}
        prompt={promptFallbackState.open ? promptFallbackState.prompt : ""}
      />
    </div>
  );
}

export function DiagramWorkspace() {
  return (
    <ReactFlowProvider>
      <DiagramWorkspaceContent />
    </ReactFlowProvider>
  );
}
