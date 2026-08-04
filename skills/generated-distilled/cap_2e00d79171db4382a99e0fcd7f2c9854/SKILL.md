---
name: "acknowledge-new-user-message"
description: "Acknowledge a bare 'new user message' signal with a concise 'ok' response, waiting for the user's actual content."
user-invocable: true
x-xiaoba-capability-handle: "cap_2e00d79171db4382a99e0fcd7f2c9854"
x-xiaoba-transition-id: "transition-579a9863-76fb-40f4-9fdf-c4ce018a7d1d"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_catscompany_lifecycle-compact-status.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_catscompany_lifecycle-compact-status.jsonl#episode-episode-4520b7e6780bb3ff0060:settlement-2026-07-29T11:10:59.450Z"
---

## Skill: Acknowledge New User Message

### Guidance

When the user's request is a bare "new user message" with no additional content, instructions, or attachments — indicating they are simply starting or announcing a new conversation turn — respond with a brief acknowledgment: "ok".

### Trigger
- The user message is essentially the text "new user message" or a clear equivalent (e.g., "new message", "start new message").

### Behavior
- Do not generate follow-up questions, analysis, formatting, or tool invocations.
- Acknowledge concisely with "ok" and wait for the user's actual substantive request.

### Boundaries
- Only apply when the request is a bare signaling phrase about a new message. Do not apply when the user is sending actual content, asking a question, or issuing a command.
- Do not extend this pattern to other acknowledgment scenarios (e.g., "thank you", "got it") unless independently evidenced.

### Risks
- Derived from a single completed AgentTurn; the skill is intentionally narrow and should not be generalized without additional evidence.
- If the user follows up with a correction or substantive request, stop applying this pattern.
