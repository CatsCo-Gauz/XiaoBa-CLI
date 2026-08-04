---
name: "acknowledge-autosave-user"
description: "Acknowledge a user's request to autosave a user context by replying 'ok' — a narrow confirmation step derived from a single-turn eligible episode."
user-invocable: true
x-xiaoba-capability-handle: "cap_11babfcf3e9b4cb194c9af6a5b7fbe80"
x-xiaoba-transition-id: "transition-1834417f-2e42-44ae-bb08-9a0dd6597c35"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_catscompany_lifecycle-autosave.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_catscompany_lifecycle-autosave.jsonl#episode-episode:1:c4cad757:settlement-2026-07-29T05:09:37.020Z"
---

## Skill: Acknowledge Autosave User Intent

### Trigger
When the user expresses the intent "autosave user" (or a close semantic equivalent requesting to enable or acknowledge autosave for a user context).

### Guidance
1. Confirm receipt of the user's autosave intent by replying "ok".
2. Do not infer any specific autosave implementation, configuration, or persistent state change beyond the acknowledgment.
3. Do not extend this pattern to requests about saving files, documents, or other data that are not specifically about enabling or acknowledging an autosave capability for a user.
4. This skill covers only the acknowledgment step; any follow-up configuration, implementation details, or error handling are outside its scope.

### Boundaries
- Apply only when a new task matches the same user-facing capability: acknowledging an "autosave user" intent.
- Do not apply while the user is correcting, iterating on, or providing additional requirements beyond the acknowledgment.
- Do not reuse for general save, file save, or any data persistence operation that does not match the autosave-user acknowledgment pattern.
- This skill is derived from one completed AgentTurn and does not generalize to multi-step workflows or implementation details.

### Dependencies
None.
