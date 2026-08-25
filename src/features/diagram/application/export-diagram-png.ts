import { getNodesBounds, getViewportForBounds, type Node, type Viewport } from "@xyflow/react";
import type { toPng } from "html-to-image";

// html-to-image does not export its `Options` type from the package root; derive it from the
// one function this module actually targets rather than duplicating the shape by hand.
type ToPngOptions = NonNullable<Parameters<typeof toPng>[1]>;

/** Full-HD cap: readable for any diagram size, while never producing a multi-thousand-pixel image. */
export const EXPORT_PNG_WIDTH = 1920;
export const EXPORT_PNG_HEIGHT = 1080;
export const EXPORT_PNG_FILENAME = "diagram.png";

const EXPORT_PNG_PADDING = 0.1;
// Low enough that any realistically sized diagram still fits fully inside the frame above
// instead of being cropped when the required fit-zoom would otherwise be clamped upward.
const EXPORT_PNG_MIN_ZOOM = 0.01;
const EXPORT_PNG_MAX_ZOOM = 2;

export type ExportPngTransform = {
  readonly viewport: Viewport;
  readonly width: number;
  readonly height: number;
};

export type ComputeExportTransformResult =
  | { readonly ok: true; readonly value: ExportPngTransform }
  | { readonly ok: false; readonly reason: string };

/**
 * Fits every node — not just what is currently on screen — into a fixed
 * `EXPORT_PNG_WIDTH x EXPORT_PNG_HEIGHT` frame, independent of the canvas's live pan/zoom.
 */
export function computeExportTransform(nodes: readonly Node[]): ComputeExportTransformResult {
  if (nodes.length === 0) {
    return { ok: false, reason: "The diagram has no nodes to export." };
  }

  const bounds = getNodesBounds([...nodes]);
  if (bounds.width <= 0 || bounds.height <= 0) {
    return { ok: false, reason: "The diagram has no visible area to export." };
  }

  const viewport = getViewportForBounds(
    bounds,
    EXPORT_PNG_WIDTH,
    EXPORT_PNG_HEIGHT,
    EXPORT_PNG_MIN_ZOOM,
    EXPORT_PNG_MAX_ZOOM,
    EXPORT_PNG_PADDING,
  );

  return { ok: true, value: { viewport, width: EXPORT_PNG_WIDTH, height: EXPORT_PNG_HEIGHT } };
}

/** `toPng` paints whatever CSS transform is on the node, so the fitted viewport is applied via inline style rather than driving React Flow's own pan/zoom state. */
export function buildExportPngOptions(
  transform: ExportPngTransform,
  backgroundColor: string,
): ToPngOptions {
  return {
    backgroundColor,
    width: transform.width,
    height: transform.height,
    style: {
      width: `${transform.width}px`,
      height: `${transform.height}px`,
      transform: `translate(${transform.viewport.x}px, ${transform.viewport.y}px) scale(${transform.viewport.zoom})`,
    },
  };
}
