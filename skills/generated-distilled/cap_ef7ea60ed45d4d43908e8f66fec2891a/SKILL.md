---
name: "acknowledge-first-input"
description: "Acknowledge a standalone 'first' input from the user by confirming readiness."
user-invocable: true
x-xiaoba-capability-handle: "cap_ef7ea60ed45d4d43908e8f66fec2891a"
x-xiaoba-transition-id: "transition-0921dfdb-1f4e-47ee-8acf-f452f5ddbaf2"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/weixin/2026-07-29/weixin_user_prompt-hot-reload-basic.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/weixin/2026-07-29/weixin_user_prompt-hot-reload-basic.jsonl#episode-episode:1:2f24f4f0:settlement-2026-07-29T04:57:58.839Z"
---

## Skill: Acknowledge "First" Input

### Applicability
Apply this skill when the user provides a standalone input of "first" (or semantically equivalent request to begin/initiate) with no additional task context, correction, or iteration.

### Guidance
When the user says "first" without further elaboration:
- Acknowledge the input simply and confirm readiness, e.g., respond "ok".
- Do not extend this pattern to multi-step workflows, sequencing requests, or tasks involving ordering, ranking, or prioritization.

### Boundaries
- Only applies to a single-word "first" input from the user with no accompanying task description.
- Do not apply when the user is correcting, iterating, or refining a prior response.
- Do not reuse for numbered lists, first steps in a procedure, or "firstly" in arguments.

### Dependencies
None.
