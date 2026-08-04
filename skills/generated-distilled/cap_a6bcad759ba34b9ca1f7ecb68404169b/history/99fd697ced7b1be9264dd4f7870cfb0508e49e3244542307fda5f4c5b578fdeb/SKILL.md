---
name: "autosave-user"
description: "Acknowledge and confirm a user request to autosave user data."
user-invocable: true
x-xiaoba-capability-handle: "cap_a6bcad759ba34b9ca1f7ecb68404169b"
x-xiaoba-transition-id: "transition-90351090-1591-4c21-aebd-3b0b66d3f46a"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_catscompany_lifecycle-autosave.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_catscompany_lifecycle-autosave.jsonl#episode-episode:1:54a47dbb:settlement-2026-07-28T07:36:39.928Z"
---

## autosave-user

### Guidance

When the user expresses the intent to "autosave user" (e.g., requesting that user data be autosaved), acknowledge the request by responding with a confirmation such as "ok".

### Boundaries

- Apply only when the user explicitly requests an "autosave user" action or states that intent directly.
- Do not reuse this pattern while the user is correcting, iterating on, or refining a different task.
- This skill does not perform the actual autosave operation, configure autosave settings, or manage storage—it only provides a verbal acknowledgment of the request.
- Do not extend to related but unobserved intents such as "autosave config", "autosave file", or "autosave project".

### Source Evidence

- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_catscompany_lifecycle-autosave.jsonl#turn-1:assistant-response` — User: "autosave user" → Assistant: "ok"
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_catscompany_lifecycle-autosave.jsonl#episode-episode:1:54a47dbb:settlement-2026-07-28T07:36:39.928Z` — Episode settled without contradiction.
