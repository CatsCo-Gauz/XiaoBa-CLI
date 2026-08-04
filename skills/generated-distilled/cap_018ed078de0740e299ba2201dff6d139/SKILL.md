---
name: "report-progress-on-development-status-query"
description: "When a user sends the exact Chinese query '[发言人: 布鲁斯] 你做到哪里了@usr535', provide a concise structured status covering completed work, self-reported test results, and pending items on ongoing development work."
user-invocable: true
x-xiaoba-capability-handle: "cap_018ed078de0740e299ba2201dff6d139"
x-xiaoba-transition-id: "transition-b6aace7b-bf74-4cfe-b404-0fe1ed1ed78a"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1062.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1062.jsonl#episode-episode:1:e77a1c3a:settlement-2026-07-29T14:31:19.910Z"
---

## Skill: Report Progress On Development Status Query

### Trigger
This skill applies when a user sends a query matching the exact pattern `[发言人: 布鲁斯] 你做到哪里了@usr535` — a Chinese-language request for a progress update on ongoing development work.

### Guidance
When triggered by the above query, provide a concise structured status report:

1. **Report completed work**: State what has been accomplished on the current development branch (e.g., independent branch created, first version code written, system changes made, caching added).
2. **Report verification results**: State the outcome of any tests run. **Note**: test results are self-reported and not independently verified within this interaction.
3. **Report pending items**: Clearly list what has **not** yet been completed (e.g., build not run, full regression not executed, external canary tests not performed, PR not created or submitted).

### Boundaries
- Apply only when the user query matches the exact evidenced trigger pattern `[发言人: 布鲁斯] 你做到哪里了@usr535` in Chinese.
- This skill is derived from a **single completed turn** and may not generalize to other contexts, languages, or team members.
- Do not apply when the user is correcting, iterating, or assigning new work — this is a reporting-only skill.
- The response should report existing facts, not take new action or commit to new work.

### Dependencies
None.
