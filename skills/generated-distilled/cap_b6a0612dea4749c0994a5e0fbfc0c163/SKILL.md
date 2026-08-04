---
name: "clear-old-requests"
description: "When a user asks to clear old previous requests from conversation history, the old replies should not be restored to history."
user-invocable: true
x-xiaoba-capability-handle: "cap_b6a0612dea4749c0994a5e0fbfc0c163"
x-xiaoba-transition-id: "transition-653d8771-dd31-4b46-9560-880fae3fe849"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#episode-episode:1:dbba1e5f:settlement-2026-07-29T04:56:35.937Z"
---

## Skill: clear-old-requests

### Guidance

When a user expresses intent to clear old requests or previous conversation history items (e.g., "清空前的旧请求"), respond by confirming that the old replies should not be restored to the conversation history.

### When to apply

- Apply only when a new task matches the user-facing capability of clearing old/previous requests from conversation history.
- Do not reuse this pattern while the user is correcting, iterating, or clarifying the task.

### Boundaries

- This guidance is derived from a single completed interaction and may not generalize to broader clear/delete operations.
- Do not extend this behavior to clearing data, credentials, files, or external system state — it applies only to conversation history restoration preference.
- The old reply should not be restored to history, per the observed user preference.

### Dependencies

None.
