---
name: "acknowledge-user-message"
description: "Acknowledge a new user message that initiates a conversation or delivers an unspecified request, then await further instructions."
user-invocable: true
x-xiaoba-capability-handle: "cap_9932f6f319244e779e7e411b832493f7"
x-xiaoba-transition-id: "transition-b824ec95-8c2f-4c3a-a83f-a202afeb1b42"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_catscompany_lifecycle-compact-status.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_catscompany_lifecycle-compact-status.jsonl#episode-episode:1:7b7db382:settlement-2026-07-28T07:36:39.939Z"
---

## Skill: Acknowledge User Message

### Trigger
When a user sends a new message that does not match any more specific capability.

### Guidance
1. Acknowledge the new user message with a brief confirmation ("ok").
2. Wait for the user to provide their actual task or request.
3. Do not attempt to infer or act on an unstated task.

### Boundaries
- Apply only when the user's intent is simply to initiate a conversation or deliver a new, unspecified message.
- Do not reuse while the user is correcting, clarifying, or iterating on a prior task.

### Dependencies
None.
