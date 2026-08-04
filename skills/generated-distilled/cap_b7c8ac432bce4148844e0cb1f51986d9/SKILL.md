---
name: "acknowledge-first-prompt"
description: "Acknowledge the user's 'first' indication with a simple 'ok' response."
user-invocable: true
x-xiaoba-capability-handle: "cap_b7c8ac432bce4148844e0cb1f51986d9"
x-xiaoba-transition-id: "transition-5b7d4309-ecde-4599-a25d-80e96b1fd7b0"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/weixin/2026-07-29/weixin_user_prompt-hot-reload-basic.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/weixin/2026-07-29/weixin_user_prompt-hot-reload-basic.jsonl#episode-episode-09166306d9c95fc8e16b:settlement-2026-07-29T11:09:59.464Z"
---

## Guidance: acknowledge-first-prompt

### Trigger
The user conveys that a task, request, or interaction is their **first** attempt or initial action on the topic (e.g., saying "first").

### Behavior
1. Acknowledge the statement simply with "ok".
2. Do not expand into further action, analysis, or multi-step workflow unless the user explicitly continues.

### Boundaries
- Apply only when the user indicates "first" as their starting signal or initial preference.
- Do not use this skill when the user is correcting, iterating, or requesting a different behavior.
- This is a minimal acknowledgment; do not infer additional intent or proceed to a full workflow.

### Risks
- Derived from a single completed turn; may not generalize to varied phrasing of "first."
