---
name: "acknowledge-autosave-preference"
description: "When a user expresses an autosave preference (e.g., 'autosave user'), acknowledges the request with a confirmation."
user-invocable: true
x-xiaoba-capability-handle: "cap_0084644a5e0248a09c5ea3520a60c50d"
x-xiaoba-transition-id: "transition-f260c542-b517-4d2f-b311-cd7b03b00c2b"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_catscompany_lifecycle-autosave.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_catscompany_lifecycle-autosave.jsonl#episode-episode:1:f97a7fd3:settlement-2026-07-29T05:03:04.789Z"
---

## Skill: Acknowledge Autosave Preference

### Guidance
When a user expresses a desire to "autosave user" or a similar autosave preference, acknowledge the request by responding with a confirmation (e.g., "ok").

### Boundaries
- Only apply when the user clearly communicates an autosave-related preference for themselves.
- Do not reuse this pattern while the user is correcting or iterating on the task.
- This skill covers acknowledgment only; it does not include implementing, configuring, or verifying an autosave mechanism.

### Dependencies
None.

### Evidence
- Source exchange: User: "autosave user" → Assistant: "ok" (ref: `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_catscompany_lifecycle-autosave.jsonl#turn-1:assistant-response`)
- Settlement at 2026-07-29T05:03:04.789Z without contradiction (ref: `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_catscompany_lifecycle-autosave.jsonl#episode-episode:1:f97a7fd3:settlement-2026-07-29T05:03:04.789Z`)
