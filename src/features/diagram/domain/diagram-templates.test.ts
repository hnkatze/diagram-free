import { describe, expect, it } from "vitest";

import { buildFlowGraph } from "../application/build-flow-graph";
import { DIAGRAM_TEMPLATES } from "./diagram-templates";
import { diagramSourceSchema } from "./diagram-source";

describe("DIAGRAM_TEMPLATES", () => {
  it("has unique template ids", () => {
    const ids = DIAGRAM_TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(DIAGRAM_TEMPLATES.map((template) => [template.id, template] as const))(
    "template %s parses cleanly through diagramSourceSchema",
    (_id, template) => {
      const result = diagramSourceSchema.safeParse(template.source);
      expect(result.success).toBe(true);
    },
  );

  it.each(DIAGRAM_TEMPLATES.map((template) => [template.id, template] as const))(
    "template %s builds a graph without throwing and with no overlapping node positions",
    (_id, template) => {
      const build = () => buildFlowGraph(template.source);
      expect(build).not.toThrow();

      const { nodes } = build();
      const positionKeys = nodes.map((node) => `${node.position.x},${node.position.y}`);
      expect(new Set(positionKeys).size).toBe(positionKeys.length);
    },
  );

  it.each(DIAGRAM_TEMPLATES.map((template) => [template.id, template] as const))(
    "template %s edges all reference nodes that exist in the same template",
    (_id, template) => {
      const nodeIds = new Set(template.source.nodes.map((node) => node.id));
      for (const edge of template.source.edges) {
        expect(nodeIds.has(edge.from)).toBe(true);
        expect(nodeIds.has(edge.to)).toBe(true);
      }
    },
  );
});
