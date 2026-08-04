---
name: "check-code-review-progress"
description: "When asked for the status or progress of code review items (issues/PRs), provide a concise update on current phase, item-level status, and recommended next steps."
user-invocable: true
x-xiaoba-capability-handle: "cap_0b4ab9324b4e47c9b2ed79c899bf9158"
x-xiaoba-transition-id: "transition-2b1ea840-329c-4278-9d90-ed6f87b3f9d8"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_988.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_988.jsonl#episode-episode:1:7b3f28c2:settlement-2026-07-29T11:28:50.288Z"
---

# Skill: check-code-review-progress

## Guidance

When the user asks for the current status or progress of code review items (issues, pull requests, review tasks), provide a concise update that:

1. States the current phase (e.g., stuck in review-with-fixes phase, not yet merged).
2. Lists each relevant item and its latest state (no new commits, pending changes are reply interactions not covering review items, etc.).
3. Recommends the next steps in priority order (e.g., fix rebase and scan limits on one item, then address reliability issues on another).

## Boundaries

- **Input scope**: This skill applies only when the user specifically requests a progress/status update on specific code review items (issues or PRs identified by number or description). It does not apply to general project management, roadmap queries, or non-code-review artifacts.
- **Output scope**: The response is a factual status summary from observed issue/PR state. Do not modify issues, submit changes, or take actions beyond reporting.
- **Evidence basis**: Derived from a single episode where the user asked "[发言人: 布鲁斯] 到哪一步了@usr535" (status of review items #106 and #252). The skill does not generalize to other domains, teams, or workflows without additional evidence.
- **No inherited access**: This skill does not imply any credentials, repository access, or authorization to read issues. Execution requires available current authorization and issue/PR state at runtime.

## Dependencies

None.
