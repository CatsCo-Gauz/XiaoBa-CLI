---
name: "handle-old-request-after-clear"
description: "When a user references an old request that existed before the conversation was cleared, do not restore the old reply from before the clear into the conversation history."
user-invocable: true
x-xiaoba-capability-handle: "cap_c5f5033bcdad4bd3aff3278afd0392cb"
x-xiaoba-transition-id: "transition-c947d862-47fe-465e-91b1-3ee0b5b070e5"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#episode-episode:1:a4b3937b:settlement-2026-07-29T12:35:04.922Z"
---

## Skill: handle-old-request-after-clear

### Trigger
The user references or asks about a request, message, or reply that existed **before** the conversation was cleared (e.g., "清空前的旧请求" / "old request before clearing").

### Rule
Do **not** restore the old reply (the response from before the clear) back into the conversation history. The old reply should remain outside the restored or active history.

### Boundaries
- This skill applies only when a new task matches exactly this user-facing capability (a user references a pre-clear old request).
- Do not reuse while the user is still correcting or iterating on the task.
- Does not generalize to general history management, conversation restoration, or retention policies beyond this narrow pattern.

### Risks
- Derived from a single completed turn; applicability may not generalize to all clear-and-restore scenarios.
- Requires matching the specific user reference to a pre-clear request.
