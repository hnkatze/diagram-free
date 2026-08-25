import type { Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";

import {
  buildExportPngOptions,
  computeExportTransform,
  EXPORT_PNG_HEIGHT,
  EXPORT_PNG_WIDTH,
} from "./export-diagram-png";

function makeNode(id: string, x: number, y: number, width: number, height: number): Node {
  return { id, type: "process", position: { x, y }, data: {}, width, height };
}

/** Maps a diagram-space point through the computed viewport, mirroring the CSS transform `toPng` applies. */
function toScreenPoint(
  point: { readonly x: number; readonly y: number },
  viewport: { readonly x: number; readonly y: number; readonly zoom: number },
) {
  return { x: point.x * viewport.zoom + viewport.x, y: point.y * viewport.zoom + viewport.y };
}

describe("computeExportTransform", () => {
  it("fails when there are no nodes", () => {
    const result = computeExportTransform([]);
    expect(result.ok).toBe(false);
  });

  it("fails when the only nodes have zero size", () => {
    const result = computeExportTransform([makeNode("a", 0, 0, 0, 0)]);
    expect(result.ok).toBe(false);
  });

  it("always caps the output at EXPORT_PNG_WIDTH x EXPORT_PNG_HEIGHT for a small diagram", () => {
    const result = computeExportTransform([makeNode("a", 0, 0, 100, 50)]);
    if (!result.ok) {
      throw new Error("Expected computeExportTransform to succeed");
    }
    expect(result.value.width).toBe(EXPORT_PNG_WIDTH);
    expect(result.value.height).toBe(EXPORT_PNG_HEIGHT);
  });

  it("always caps the output at EXPORT_PNG_WIDTH x EXPORT_PNG_HEIGHT for a huge, spread-out diagram", () => {
    const nodes = [
      makeNode("a", 0, 0, 100, 50),
      makeNode("b", 20000, 15000, 100, 50),
      makeNode("c", -8000, 12000, 100, 50),
    ];
    const result = computeExportTransform(nodes);
    if (!result.ok) {
      throw new Error("Expected computeExportTransform to succeed");
    }
    expect(result.value.width).toBe(EXPORT_PNG_WIDTH);
    expect(result.value.height).toBe(EXPORT_PNG_HEIGHT);
  });

  it("fits every node's bounding box inside the output frame, regardless of spread", () => {
    const nodes = [
      makeNode("a", -300, -150, 120, 60),
      makeNode("b", 900, 50, 80, 80),
      makeNode("c", 200, 700, 150, 40),
    ];
    const result = computeExportTransform(nodes);
    if (!result.ok) {
      throw new Error("Expected computeExportTransform to succeed");
    }

    const { viewport } = result.value;
    const epsilon = 0.5;
    for (const node of nodes) {
      const corners = [
        { x: node.position.x, y: node.position.y },
        { x: node.position.x + (node.width ?? 0), y: node.position.y + (node.height ?? 0) },
      ];
      for (const corner of corners) {
        const screen = toScreenPoint(corner, viewport);
        expect(screen.x).toBeGreaterThanOrEqual(-epsilon);
        expect(screen.x).toBeLessThanOrEqual(EXPORT_PNG_WIDTH + epsilon);
        expect(screen.y).toBeGreaterThanOrEqual(-epsilon);
        expect(screen.y).toBeLessThanOrEqual(EXPORT_PNG_HEIGHT + epsilon);
      }
    }
  });

  it("still fits a single far-off-viewport node, proving export does not depend on the current pan/zoom", () => {
    // A node placed far outside any plausible on-screen viewport (e.g. panned away by the user).
    const nodes = [makeNode("only", 50000, -50000, 100, 60)];
    const result = computeExportTransform(nodes);
    if (!result.ok) {
      throw new Error("Expected computeExportTransform to succeed");
    }

    const screen = toScreenPoint({ x: 50050, y: -49970 }, result.value.viewport);
    expect(screen.x).toBeGreaterThanOrEqual(0);
    expect(screen.x).toBeLessThanOrEqual(EXPORT_PNG_WIDTH);
    expect(screen.y).toBeGreaterThanOrEqual(0);
    expect(screen.y).toBeLessThanOrEqual(EXPORT_PNG_HEIGHT);
  });
});

describe("buildExportPngOptions", () => {
  it("encodes the fitted viewport as a CSS transform and requests an opaque background", () => {
    const options = buildExportPngOptions(
      { viewport: { x: 12, y: -4, zoom: 0.75 }, width: 1920, height: 1080 },
      "oklch(1 0 0)",
    );

    expect(options.backgroundColor).toBe("oklch(1 0 0)");
    expect(options.width).toBe(1920);
    expect(options.height).toBe(1080);
    expect(options.style?.transform).toBe("translate(12px, -4px) scale(0.75)");
    expect(options.style?.width).toBe("1920px");
    expect(options.style?.height).toBe("1080px");
  });
});
