---
name: build-code-graph
description: Build, refresh, validate, and visualize evidence-backed code graphs for software repositories. Use when Codex needs to understand an unfamiliar codebase, map components/files/symbols and their dependencies, document runtime or user flows, detect architectural drift, prepare repository context for another agent, or create a reusable interactive architecture viewer with drill-down component internals.
skillhub_author: "lin"
skillhub_version: "1.0.0"
skillhub_uploaded_at: "2026-07-24T02:31:44.952Z"
---

# Build Code Graph

Build one reusable graph contract from deterministic code evidence plus a small, reviewed semantic profile. Keep code facts, architectural interpretation, and presentation separate.

## Output Contract

Produce:

1. `code-evidence.json`: analyzer-derived files, symbols, and cross-component edges.
2. `project-architecture.json`: reviewed components, contracts, flows, locale, and declarative layout hints.
3. `agent-codegraph.json`: validated merged graph consumed by agents and the viewer.
4. An optional interactive viewer installed from `assets/viewer`.

Treat `agent-codegraph.json` as the portable result. Do not make the viewer depend on repository-specific TypeScript modules.

## Workflow

### 1. Gather deterministic evidence

For TypeScript, prefer a compiler-resolved analyzer and canonical schema-v2 output. See [analyzers.md](references/analyzers.md).

Run:

```powershell
node scripts/analyze-typescript.mjs --repo <repo> --output <analysis.json>
```

If an analyzer is already available, reuse its stable JSON instead of rerunning it.

### 2. Scaffold, then review the semantic profile

Generate a draft:

```powershell
node scripts/scaffold-profile.mjs --analysis <analysis.json> --output <project-architecture.json> --locale zh-CN
```

The scaffold is directory-based orientation, not an accepted architecture. Read entry points, composition roots, lifecycle owners, execution loops, persistence, and important boundaries. Replace draft groups and summaries with stable runtime responsibilities.

Use [semantic-modeling.md](references/semantic-modeling.md) when deciding component boundaries, contracts, internal steps, and user/runtime flows.

### 3. Add drill-down only where evidence supports it

Use `internalSteps` and `internalEdges` for a component's local execution structure. A step may recursively contain `children` and `internalEdges`.

Rules:

- Every step must name a stable responsibility and cite a file or symbol.
- Every internal edge must connect siblings in the same scope.
- Map external edges to top-level `sourceStep` or `targetStep` only when the boundary is clear.
- Do not invent a deeper level merely to fill the UI. An evidence-poor component may remain a leaf.

### 4. Build and validate

Run the complete deterministic refresh:

```powershell
node scripts/refresh-codegraph.mjs --analysis <analysis.json> --profile <project-architecture.json> --output-dir <output-dir>
```

Or run the stages separately:

```powershell
node scripts/build-evidence.mjs --analysis <analysis.json> --profile <project-architecture.json> --output <code-evidence.json>
node scripts/merge-codegraph.mjs --evidence <code-evidence.json> --profile <project-architecture.json> --output <agent-codegraph.json>
node scripts/validate-codegraph.mjs <agent-codegraph.json>
```

Fix unclassified or ambiguously classified production files before claiming broad repository coverage. Static call counts are code-site evidence, not runtime invocation counts.

### 5. Install and verify the viewer

```powershell
node scripts/install-viewer.mjs --graph <agent-codegraph.json> --output <viewer-dir>
cd <viewer-dir>
npm install
npm run dev
```

Visually verify:

- the system atlas is readable without crossing cards;
- edge labels do not overlap ports or nodes;
- clicking a component opens its actual internal graph;
- nested steps with children can be opened recursively;
- external inputs/outputs align with the component's mapped contracts;
- locale, flow tabs, edge-density control, zoom, and fit-view work.

The viewer layout and routing are generic. Project-specific grouping, ordering, labels, edge overrides, and nested structure belong in `project-architecture.json`.

### 6. Refresh without erasing reviewed semantics

On later revisions, rerun evidence and merge against the existing profile. Optionally compare evidence:

```powershell
node scripts/refresh-codegraph.mjs --analysis <analysis.json> --profile <project-architecture.json> --output-dir <output-dir> --baseline <old-code-evidence.json>
```

Use drift output to target review. Do not regenerate semantic summaries from scratch for ordinary refactors.

## Agent Use

For repository work, start with project metadata, groups, components, and selected flows. Load file/symbol evidence only for the components relevant to the task. The graph narrows source reading; it does not replace source verification.

Before editing code:

1. identify the owning component and flow;
2. inspect incoming/outgoing contracts;
3. read the cited source and nearby symbols;
4. update the graph only if ownership, contracts, or lifecycle changed.

## Guardrails

- Prefer the smallest architecture that explains ownership and runtime behavior.
- Keep raw imports/calls as evidence; reserve semantic edge kinds for reviewed meaning.
- Never claim field-level data flow from import evidence alone.
- Keep IDs stable across revisions and locales.
- Store persistent language in `project.locale`; do not rely on a one-turn prompt for viewer language.
- Validate the graph before presenting or installing the viewer.
- Run `node scripts/self-test.mjs` after changing the Skill itself.

See [data-contract.md](references/data-contract.md) for artifact boundaries and extension rules.
