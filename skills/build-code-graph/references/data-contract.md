# Data Contract

## Artifact Boundaries

### `project-architecture.json`

Agent-reviewed semantics:

```text
schemaVersion
project
groups
components
edgeSemantics
flows
layout
```

`project.language` describes source code. `project.locale` fixes labels, summaries, contracts, flow names, and viewer chrome.

Component `filePatterns` are JavaScript regular-expression strings. Multiple matches are ambiguous; first match never silently wins.

### `code-evidence.json`

Deterministic analyzer output grouped by the reviewed component profile:

```text
source
components[].files[].symbols[]
edges[]
diagnostics
```

Each grouped edge carries static call-site count, total weight, provenance, and bounded evidence samples.

### `agent-codegraph.json`

Validated merge consumed by agents and the viewer:

```text
source
project
groups
components
edges
flows
layout
diagnostics
```

Do not add repository-specific imports to the viewer. Extend this JSON contract instead.

## Recursive Internal Scope

A component has:

```json
{
  "internalSteps": [
    {
      "id": "execute",
      "label": "Execute tools",
      "summary": "Owns tool execution and normalization.",
      "file": "src/runner.ts",
      "symbol": "Runner.execute",
      "children": [],
      "internalEdges": []
    }
  ],
  "internalEdges": [
    {
      "id": "prepare-to-execute",
      "source": "prepare",
      "target": "execute",
      "kind": "control",
      "label": "dispatch",
      "payload": "ToolCall[]"
    }
  ]
}
```

At every depth, internal edges may reference only sibling IDs in that scope. External component edges may map only to top-level `sourceStep` and `targetStep`.

## Stable Identifiers

- IDs use lowercase letters, digits, `_`, or `-`.
- Preserve IDs when labels or locale change.
- Normalize repository-relative paths to `/`.
- Prefer analyzer-stable qualified symbol names.

## Evidence Rules

- Normal graph edges require grouped static evidence.
- Semantic-only event/control edges set `evidenceRequired: false` and cite source references.
- Missing evidence is a merge error unless explicitly exempted.
- Recursive internal steps require source citations but are not independently generated static call edges.

## Layout

Keep layout declarative:

```text
direction
groupOrder
componentOrder
edgeOverrides
```

The viewer derives coordinates, ports, lanes, labels, and obstacle avoidance. Do not store generated pixel coordinates in the semantic profile.
