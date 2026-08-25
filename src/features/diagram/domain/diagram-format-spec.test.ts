import { describe, expect, it } from "vitest";

import { parseDiagram } from "../application/parse-diagram";
import { DIAGRAM_FORMAT_EXAMPLE, buildDiagramFormatSpec } from "./diagram-format-spec";
import { DEFAULT_DIAGRAM_NODE_TYPE, DIAGRAM_NODE_TYPES } from "./diagram-node-type";

describe("buildDiagramFormatSpec", () => {
  it("mentions every value in DIAGRAM_NODE_TYPES (anti-rot: a new type must show up here too)", () => {
    const spec = buildDiagramFormatSpec();

    for (const type of DIAGRAM_NODE_TYPES) {
      expect(spec).toContain(`"${type}"`);
    }
  });

  it("names the actual default node type, not a hardcoded literal", () => {
    const spec = buildDiagramFormatSpec();

    expect(spec).toContain(`default, "${DEFAULT_DIAGRAM_NODE_TYPE}"`);
  });

  it("embeds the exact worked example, serialized, in the spec text", () => {
    const spec = buildDiagramFormatSpec();

    expect(spec).toContain(JSON.stringify(DIAGRAM_FORMAT_EXAMPLE, null, 2));
  });

  it("describes the top-level shape and the required/optional fields", () => {
    const spec = buildDiagramFormatSpec();

    expect(spec).toMatch(/"nodes"/);
    expect(spec).toMatch(/"edges".*optional/i);
    expect(spec).toContain('"id"');
    expect(spec).toContain('"label"');
    expect(spec).toContain('"from"');
    expect(spec).toContain('"to"');
    expect(spec).toMatch(/unique/i);
  });
});

describe("DIAGRAM_FORMAT_EXAMPLE", () => {
  it("is valid diagram JSON that parses cleanly through parseDiagram", () => {
    const result = parseDiagram(JSON.stringify(DIAGRAM_FORMAT_EXAMPLE));

    if (!result.ok) {
      throw new Error(`Expected the worked example to parse, got errors: ${result.errors.join(", ")}`);
    }
    expect(result.ok).toBe(true);
  });
});
