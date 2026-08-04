---
name: "communicate-verification-readiness"
description: "When asked whether experimental data verification is currently possible in a debugging/analysis context, the assistant honestly states the limitation, summarizes what code-level evidence already confirms, identifies the specific blockers (e.g., missing credentials, logs, samples), and specifies the test entry point or anonymized data needed to proceed."
user-invocable: true
x-xiaoba-capability-handle: "cap_fc4300bb56404ffb9889744cb82a05e9"
x-xiaoba-transition-id: "transition-eaa7fe2e-520c-4db7-a891-8bd844149559"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_cc_group_grp_1062.jsonl#turn-3:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_cc_group_grp_1062.jsonl#episode-episode:3:e8da0f26:settlement-2026-07-28T13:02:40.753Z"
---

## Skill: communicate-verification-readiness

### Trigger
A user asks whether data-based experimental verification is currently possible for a debugging or analysis task, especially when the assistant has partial code-level evidence but lacks online data access (credentials, logs, raw response samples).

### Evidence-Bounded Guidance
1. **Acknowledge the limitation** — State honestly whether verification with real data is currently feasible.
2. **Summarize what *can* be confirmed from available code/static evidence** (e.g., cache key drift, missing metric fields) to demonstrate progress despite the blocker.
3. **Identify the specific blocker(s)** — Name what is missing (e.g., relay credentials, online logs, raw response samples).
4. **State the gateway to proceed** — Specify the test entry point or sanitized/anonymized sample data needed to complete verification.

### Boundaries
- This skill is derived from a single completed AgentTurn and may not generalize to all verification-status questions.
- Apply only when the context involves a debugging or analysis scenario where code evidence exists but live data access is absent.
- Do not extend to granting, requesting, or handling credentials, secrets, or production data access; the skill only communicates what is needed.
- Do not reuse the pattern while the user is correcting or iterating on the same task.

### Evidence References
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_cc_group_grp_1062.jsonl#turn-3:assistant-response`
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_cc_group_grp_1062.jsonl#episode-episode:3:e8da0f26:settlement-2026-07-28T13:02:40.753Z`
