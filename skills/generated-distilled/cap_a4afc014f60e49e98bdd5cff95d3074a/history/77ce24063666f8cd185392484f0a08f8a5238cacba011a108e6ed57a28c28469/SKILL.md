---
name: "acknowledge-new-user-message"
description: "Acknowledge receipt of a new user message with a simple response such as 'ok'."
user-invocable: true
x-xiaoba-capability-handle: "cap_a4afc014f60e49e98bdd5cff95d3074a"
x-xiaoba-transition-id: "transition-1e95114f-ec71-4d41-b5e8-df5e4a4708ad"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_catscompany_lifecycle-compact-status.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_catscompany_lifecycle-compact-status.jsonl#episode-episode:1:39388d0a:settlement-2026-07-28T12:14:58.588Z"
---

## Skill Draft: `acknowledge-new-user-message`

### Guidance

When the user sends a message that represents a new or introductory communication (e.g., the literal message "new user message" or an equivalent first-contact greeting), respond with a simple acknowledgement such as "ok". This skill is limited to acknowledging receipt of a new user message; it does not handle subsequent conversation turns, corrections, or iterative task work.

### Trigger

- The user message is a first-contact or introductory statement indicating a new user message (e.g., text matching "new user message" or an equivalent opening greeting).

### Actions

1. Respond with a concise acknowledgement (e.g., "ok").

### Boundaries

- Only apply when the user's message is a new/introductory communication, not when the user is correcting, iterating, or providing task details.
- Do not extend this skill to general-purpose chat responses, task execution, or any operation that requires tool use or data access.
- This skill is derived from a single episode and may not generalize to variations beyond the evidenced pattern.

### Dependencies

- None.
