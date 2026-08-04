---
name: code-inspection
description: Inspect an unfamiliar repository, a code change, or a focused engineering concern. Build only the minimum evidence-backed understanding needed, optionally use build-code-graph, report coverage and unknowns, and hand each concrete falsifiable problem to the existing Evidence Envelope Review. Use for baseline inspection, change review, architecture consultation, code-cleanup assessment, and focused safety, reliability, performance, or maintainability investigations.
argument-hint: "<repo> [baseline|change|focus] [scope or topic]"
---

# Code Inspection

Run a professional, evidence-backed code inspection inside the current Agent Session. This Skill defines the investigation method and output contract. It does not create a new runtime, adapter, scheduler, case state machine, dashboard, or candidate-Finding pool.

## Boundary

Use this Skill when the user asks to inspect code but has not supplied one already-normalized concrete Finding.

- For a concrete Finding that already has an observation and decision question, use `build-evidence-envelope-review` directly.
- For code modification, fixing, or refactoring, finish inspection first and treat implementation as a separate authorized task.
- Never assume that the repository is defective merely because inspection was requested.

## Minimal Input

Resolve these before making broad claims:

1. `repo`: repository or source-tree boundary.
2. `snapshot`: an immutable commit, archive hash, or deterministic tree hash. If only a live working tree exists, record that limitation.
3. `mode`: `baseline`, `change`, or `focus`.
4. `scope`: included paths or concern boundary and material exclusions.
5. `evidence permissions`: which source, tests, config, docs, logs, runtime systems, and commands may be read or executed.
6. For `change`, a `baseSnapshot`.
7. For `focus`, a concrete `topic`.

The user does not need to prescribe the investigation procedure. Infer the smallest useful procedure from the task, evidence, risk, and permissions.

## Modes

### Baseline

Use for a first inspection or when prior context is not trustworthy. Establish the minimum reusable system understanding needed for the current goal: entry points, responsibilities, boundaries, important dependencies, critical paths, tests, and material unknowns.

Do not promise full-repository comprehension. Prefer high-risk and high-connectivity paths over uniform file-by-file reading.

### Change

Use for a later inspection of a known or bounded modification. Start from the diff and a trustworthy prior baseline when available. Determine affected boundaries, contracts, tests, and regression risk. Do not rebuild the whole architecture unless the change invalidates the prior understanding.

### Focus

Use for a bounded concern such as architecture evolution, security, reliability, performance, data integrity, or maintainability. Load the smallest relevant specialist Skill or method. Do not silently expand the work into an all-repository audit.

## Investigation Method

This is a professional default, not a mandatory pipeline. Reorder, skip, or revisit actions according to information value.

1. Clarify the inspection goal and the standard by which a problem could be judged.
2. Freeze or identify the source boundary and version.
3. Establish the minimum system or change map needed to choose high-value evidence.
4. Inspect the paths most likely to change the conclusion.
5. Cross-check important claims against a second evidence type when practical: tests, config, contracts, docs, logs, runtime behavior, or another source path.
6. Challenge the leading interpretation with counter-evidence and plausible alternatives.
7. Stop when the task-level completion condition is met, a permission or evidence blocker prevents further discrimination, or marginal evidence value becomes too low. State which condition applied.

Record concise auditable action summaries. Never expose or fabricate hidden chain-of-thought.

## When to Use build-code-graph

Call `build-code-graph` when a graph is likely to reduce uncertainty materially, especially when:

- baseline mode covers a non-trivial unfamiliar repository;
- ownership, entry points, or cross-component dependencies are unclear;
- a change crosses several components;
- architecture drift or dependency direction is the focus.

Skip it when a small, well-bounded diff or narrow source path already provides enough orientation.

A code graph is context evidence, not architecture truth. Verify semantic responsibilities and runtime claims in source or other evidence. Never infer field-level runtime data flow from import or call edges alone.

## Finding Gate

A structural fact, style preference, or vague concern is not a Finding. Register a Finding only when all are present:

1. a concrete falsifiable observation;
2. a traceable expected behavior, contract, or engineering constraint;
3. cited evidence that locates the observation;
4. a material impact or risk boundary worth confirming.

If any item is missing, keep the item in the inspection report as a context observation or unknown. Do not create a second candidate-Finding lifecycle.

For every item that passes the gate:

1. register it in the existing Finding Pool;
2. scaffold or bind its Evidence Envelope;
3. hand it to `build-evidence-envelope-review` and the existing Review Adapter;
4. do not recommend an Issue before that Review is complete.

## Output Contract

Create one immutable inspection result directory. Produce:

1. `inspection-report.json`: canonical machine-readable result validated by `scripts/validate-inspection.mjs`. By default the validator also verifies every Finding's Envelope directory, `finding.json`, ID, and review state.
2. `reports/inspection-report.html`: easy-to-read human projection rendered by `scripts/render-inspection-report.mjs`. The CLI refuses to render when contract or Envelope binding validation fails.
3. Optional evidence artifacts referenced by the report, such as a validated code graph, test output, or architecture note.

The report must state:

- exact source boundary and snapshot;
- mode, goal, scope, permissions, and material exclusions;
- concise system understanding, change impact, or focus conclusion;
- evidence references and their limitations;
- reviewed and unreviewed coverage;
- context observations that did not become Findings;
- material unknowns;
- zero or more already-registered Findings and their Envelope paths;
- stop reason and residual risk.

“Nothing found” means only that no Finding passed the gate within the recorded coverage. It never means the code has no problems.

## Deterministic Helpers

Initialize a report:

```powershell
node scripts/scaffold-inspection.mjs --output-dir <dir> --repo <repo> --snapshot <snapshot> --mode baseline --goal "<goal>"
```

For change mode also pass `--base-snapshot`; for focus mode also pass `--topic`.

Validate and render:

```powershell
node scripts/validate-inspection.mjs <dir>/inspection-report.json
node scripts/render-inspection-report.mjs <dir>/inspection-report.json --output <dir>/reports/inspection-report.html
```

After changing this Skill, run:

```powershell
node scripts/self-test.mjs
```

## Guardrails

- Evidence before explanation; explanation before Finding handoff.
- Keep direct observation, derived evidence, interpretation, and unknowns distinct.
- Do not modify code, create commits, open Issues, or assign work unless separately authorized.
- Do not access production systems or sensitive data outside explicit permission.
- Prefer bounded, reproducible checks over broad claims.
- Preserve source references and snapshot identity.
- Use the existing Agent Session for execution and the existing Review Runtime for Finding confirmation. Do not add an Inspection Adapter until durable automatic triggering, independent recovery, queueing, RBAC, or cross-channel operation is a demonstrated requirement.
