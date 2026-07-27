# Analyzer Adapters

## TypeScript

Prefer `codeanalyzer-typescript` (`cants`) because it resolves symbols through the compiler rather than treating text imports as runtime facts.

Recommended setup:

```powershell
python -m venv .codegraph-venv
.\.codegraph-venv\Scripts\python -m pip install codeanalyzer-typescript
```

Use level 2 by default: symbol table plus resolved call graph. Use `--tsc-only` when reproducibility matters more than recovering every possible edge. Higher CFG/DDG/SDG levels are optional and should be justified by a local data-flow question.

The adapter expects canonical schema-v2 JSON containing:

```text
application.symbol_table
application.call_graph
```

Record analyzer version, options, repository revision, source roots, exclusions, and whether tests/generated code were included.

## Other Languages

Add an adapter that emits the same evidence boundary instead of changing the semantic profile or viewer.

Required properties:

- repository-relative normalized file paths;
- stable qualified symbol identifiers;
- directed call or dependency edges;
- provenance and optional weight;
- analyzer and revision metadata.

Compiler APIs, language-server indexes, SCIP, and CodeQL are good sources. Tree-sitter or import parsing is a fallback and must be labeled as syntax evidence.
