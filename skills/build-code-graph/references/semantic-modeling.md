# Semantic Modeling

## Model Ownership, Not Folders

Choose components that explain runtime ownership:

- interaction or protocol surfaces;
- bootstrap and dependency composition;
- durable state owners;
- request, turn, job, or episode controllers;
- execution loops;
- context and prompt construction;
- model, database, network, and tool boundaries;
- persistence and background workers;
- extension, skill, or child-agent runtimes.

Merge files that share one lifecycle and owner. Split a directory only when it contains independent state or execution boundaries. Avoid a generic `utils` component unless it is a real subsystem.

## Evidence-Guided Reading

Read in this order:

1. process entry points and composition roots;
2. high-reference symbols in candidate components;
3. high-weight cross-component edges;
4. constructors/factories that wire services;
5. methods that own loops, persistence, cancellation, callbacks, or queues.

The graph should reduce source reading, not replace it.

## Edge Semantics

Use:

- `data`: request, result, or state payload;
- `control`: cancellation, gating, policy, pause/resume;
- `async`: event, queue, observation, or background completion;
- `init`: construction, registration, or bootstrap;
- `dependency`: resolved code relation without stronger interpretation.

Describe payloads at the highest useful level, such as `Message[] + ToolDefinition[] -> ChatResponse`. Do not infer field-level flow without direct source or data-flow evidence.

## Internal Graphs

`internalSteps` explain a component locally. `internalEdges` connect sibling steps. A step can recursively own `children` and its own `internalEdges`.

Add a level only when it:

- exposes a meaningful lifecycle or decision boundary;
- helps map an external contract to internal handling;
- narrows future source inspection;
- has a file or symbol citation.

Stop when the next level would merely restate function bodies. Empty children are valid.

## Flows

Flows are ordered semantic views over the same graph. Useful examples:

- startup and session creation;
- one user request or agent turn;
- tool-call continuation;
- persistence/restore;
- cancellation and queued input;
- asynchronous observation injection.

Flows do not create new dependency evidence.

## Maintenance

Keep semantic IDs and summaries stable across ordinary refactors. Review the profile when production files become unclassified, ownership changes, important contracts appear/disappear, or user-visible lifecycle behavior changes.
