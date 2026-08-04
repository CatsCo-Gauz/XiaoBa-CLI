---
name: "runtime-state-injection-comparison-guide"
description: "Creates a visual HTML comparison guide explaining runtime state injection differences, including before/after examples, user vs system role placement, and impact on provider SDKs."
user-invocable: true
x-xiaoba-capability-handle: "cap_9ebd40ef72aa4146b0bd32d395c01865"
x-xiaoba-transition-id: "transition-69231638-df86-48bb-b636-744fe20945ac"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1062.jsonl#turn-2:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1062.jsonl#turn-2:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1062.jsonl#episode-episode:2:1bf64242:settlement-2026-07-29T09:06:00.988Z"
---

# runtime-state-injection-comparison-guide

## Description
Creates a visual HTML comparison guide explaining runtime state injection differences. When a user asks about how runtime state (plan/subagent observations) is injected into LLM requests — specifically before/after examples, user role vs system role placement, and impact on provider SDKs — the skill produces a styled HTML document with side-by-side comparisons and optionally delivers a PDF copy.

## Input Requirements
- A user query asking about runtime state injection patterns, before/after injection differences, role placement (system vs user), and/or SDK compatibility impact.
- The query may reference "旧 Responses" (legacy Responses API), "Anthropic SDK", "system role", "user role", "subagent state", or "prompt caching".

## Guidance
1. **Understand the dimensions to cover**: The document should address:
   - What was changed in the injection behavior (before vs after).
   - Whether the injected content uses system role or user role.
   - The before/after representation in the provider request structure.
   - Whether provider SDKs (e.g., Anthropic) are affected by the change.
2. **Generate an HTML document** with:
   - A clear, styled layout (grid/card layout, color-coded before/after sections, code samples).
   - Side-by-side comparison tables or cards showing old vs new injection structure.
   - A section clarifying the role assignment (system role for plan/subagent state; placement differs between old "instructions" concatenation and new "input" tail positioning).
   - A section explaining whether the change affects each provider SDK (e.g., Anthropic remains unaffected structurally because system field concatenation is unchanged; prompt caching is a separate concern).
   - Code examples showing the request JSON structure before and after.
3. **Save and deliver**: Write the HTML file to a temporary path, then send the deliverable. Optionally also generate and send a PDF version using the same HTML content.

## Boundaries
- This skill is specific to explaining runtime state injection patterns. It does not implement the actual injection logic, modify provider code, or perform prompt caching optimization.
- The analysis is scoped to the provider request structure; do not make claims about runtime performance, caching hit rates, or production behavior without explicit evidence.
- Do not extend this guidance to general prompt engineering, arbitrary API documentation, or unrelated SDK integration questions.

## Fallback
If the user's question does not involve runtime state injection or provider request structure comparison, do not apply this skill.
