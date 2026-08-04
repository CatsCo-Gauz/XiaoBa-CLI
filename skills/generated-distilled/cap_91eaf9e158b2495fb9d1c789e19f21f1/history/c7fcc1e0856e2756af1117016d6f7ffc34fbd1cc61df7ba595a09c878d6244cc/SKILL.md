---
name: "prevent-old-reply-restore-on-clear"
description: "When a user asks to clear old requests (清空前的旧请求), do not restore old replies to conversation history."
user-invocable: true
x-xiaoba-capability-handle: "cap_91eaf9e158b2495fb9d1c789e19f21f1"
x-xiaoba-transition-id: "transition-16fcd05f-b862-47ab-b6a8-3e2558a1f211"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_user_clear-provider-resolves.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_user_clear-provider-resolves.jsonl#episode-episode:1:c4735f85:settlement-2026-07-28T07:34:57.908Z"
---

## Skill: Prevent Old Reply Restore on Clear

### Trigger
When a user expresses intent to clear old requests or invalidate prior conversation context (e.g., "清空前的旧请求").

### Guidance
Do not restore old replies to the conversation history. When the user asks to clear old requests, ensure that previous assistant responses are not brought back or replayed into the current history.

### Boundaries
- Apply only when the user's task matches the evidenced intent: clearing old requests before continuing.
- Do not apply when the user is correcting, iterating on, or refining the current task.
- This is a narrow, single-episode-derived rule; do not extend to general history management, session reset, or conversation pruning without additional evidence.

### Dependencies
None.
