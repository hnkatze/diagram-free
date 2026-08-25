# Diagram Free

A browser-based diagram editor. Paste or import a small JSON description of nodes and edges, the
app lays it out automatically with dagre, and you can copy a format-rules prompt for an LLM or
export the canvas as a PNG.

## The JSON format

Top level: `{ "nodes": [...], "edges": [...] }`. `edges` is optional and defaults to `[]`.

### Node

| Field      | Required | Type                    | Notes                                                              |
| ---------- | -------- | ------------------------ | ------------------------------------------------------------------- |
| `id`       | yes      | non-empty string          | unique across all nodes                                             |
| `label`    | yes      | non-empty string          | text shown on the node                                              |
| `type`     | no       | one of `"start"`, `"process"`, `"decision"`, `"end"` | defaults to `"process"` |
| `position` | no       | `{ "x": number, "y": number }` | omit it and dagre places the node automatically              |

The allowed `type` values come from `DIAGRAM_NODE_TYPES` in
[`src/features/diagram/domain/diagram-node-type.ts`](./src/features/diagram/domain/diagram-node-type.ts)
— treat that file as the source of truth, not this table, if the two ever disagree.

### Edge

| Field   | Required | Type          | Notes                                                          |
| ------- | -------- | -------------- | ---------------------------------------------------------------- |
| `from`  | yes      | string          | must match the `id` of an existing node                          |
| `to`    | yes      | string          | must match the `id` of an existing node                          |
| `id`    | no       | string          | defaults to `"${from}-${to}"`; final ids (explicit or derived) must all be unique |
| `label` | no       | string          | text shown on the edge                                            |

### Layout: dagre + explicit position

dagre lays out the entire graph first, ranked top to bottom. Any node that carries an explicit
`position` then overwrites dagre's computed placement for that node — mix laid-out and pinned
nodes freely in the same diagram.

### Example

```json
{
  "nodes": [
    { "id": "start", "label": "Start", "type": "start" },
    { "id": "check-payment", "label": "Payment valid?", "type": "decision" },
    { "id": "charge-card", "label": "Charge card", "type": "process" },
    { "id": "show-error", "label": "Show error", "type": "process" },
    { "id": "end", "label": "End", "type": "end" }
  ],
  "edges": [
    { "from": "start", "to": "check-payment" },
    { "from": "check-payment", "to": "charge-card", "label": "Yes" },
    { "from": "check-payment", "to": "show-error", "label": "No" },
    { "from": "charge-card", "to": "end" },
    { "from": "show-error", "to": "end" }
  ]
}
```

## Getting started

```bash
npm install
npm run dev      # start the dev server (Turbopack)
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
npm test         # vitest, single run
npm run test:watch
```

## Project structure

Diagram logic lives in `src/features/diagram/`, split by dependency direction:

- `domain/` — the zod schema, node types, templates, the format spec text. No React, no
  `@xyflow/react`, no framework imports of any kind — plain TypeScript only.
- `application/` — parsing, building the React Flow graph (dagre layout), building the LLM
  prompt, PNG export. Depends on `domain/`, may depend on `@xyflow/react` types.
- `components/` — the canvas, toolbar, dialogs, node renderers. Depends on `application/` and
  `domain/`, owns all the React and `@xyflow/react` rendering.

`domain → application → components` is one-way; nothing downstream is imported back upstream.

## Deploying

Stock Next.js App Router project, deployable to Vercel with no extra configuration and no
environment variables.

## Caveats

`@xyflow/react` is pinned to an exact version (`12.11.2`, no `^`). `12.11.3` and `12.11.4` import
a symbol from `@xyflow/system` that their own pinned `@xyflow/system` version does not export —
`next build` compiles clean, but the page returns HTTP 500 at request time. If you bump this
dependency, load the page and check the network tab; a green build proves nothing here.
