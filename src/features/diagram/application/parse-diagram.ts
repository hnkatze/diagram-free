import { z } from "zod";

import { diagramSourceSchema, type DiagramSource } from "../domain/diagram-source";

export type ParseDiagramResult =
  | { readonly ok: true; readonly value: DiagramSource }
  | { readonly ok: false; readonly errors: readonly string[] };

/** Maps zod issues to `path: message` strings so the dialog can show them directly to the user. */
export function parseDiagram(raw: string): ParseDiagramResult {
  if (raw.trim().length === 0) {
    return { ok: false, errors: ["Paste some JSON to import a diagram."] };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown JSON parsing error";
    return { ok: false, errors: [`Invalid JSON: ${message}`] };
  }

  const result = diagramSourceSchema.safeParse(parsedJson);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = z.core.toDotPath(issue.path);
      return path.length > 0 ? `${path}: ${issue.message}` : issue.message;
    });
    return { ok: false, errors };
  }

  return { ok: true, value: result.data };
}
