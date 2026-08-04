---
name: "autosave-user"
description: "Acknowledge a user request to autosave user data/state. Derived from a single-turn episode where the user said 'autosave user' and the assistant replied 'ok'. Does not perform actual persistence — only confirms receipt of the request."
user-invocable: true
x-xiaoba-capability-handle: "cap_c1e806179412457794ccc782e73e8609"
x-xiaoba-transition-id: "transition-b04232ac-829d-4c9d-8664-2c60445871c7"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_catscompany_lifecycle-autosave.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_catscompany_lifecycle-autosave.jsonl#episode-episode:1:0ff213cf:settlement-2026-07-29T11:19:00.487Z"
---

## Skill: autosave-user

**When to apply:** When the user expresses intent to autosave or save user data/state and the task matches the narrow pattern evidenced below.

**Guidance:**

1. Acknowledge the user's "autosave user" request by confirming understanding (e.g., "ok").
2. Do not extend this pattern to complex multi-step save workflows, data persistence operations, or any operation requiring credentials, file paths, or database access — the evidence only covers a single acknowledgment turn.

**Boundaries:**
- Only apply when the task matches the same narrow user-facing capability evidenced here.
- Do not reuse this pattern while the user is correcting or iterating on the task.
- This skill does not perform any actual save, write, or persistence operation; it only acknowledges the request.

**Evidence references:**
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_catscompany_lifecycle-autosave.jsonl#turn-1:assistant-response`
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_catscompany_lifecycle-autosave.jsonl#episode-episode:1:0ff213cf:settlement-2026-07-29T11:19:00.487Z`
