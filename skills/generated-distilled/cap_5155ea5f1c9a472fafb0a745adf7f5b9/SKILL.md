---
name: "acknowledge-presence-check"
description: "Respond to a user presence check by confirming availability, referencing relevant context the user was waiting on, and offering to proceed with the next collaborative step."
user-invocable: true
x-xiaoba-capability-handle: "cap_5155ea5f1c9a472fafb0a745adf7f5b9"
x-xiaoba-transition-id: "transition-d03b92ac-1d76-4d33-852e-97a55ed9f704"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1108.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1108.jsonl#episode-episode:1:1df9e8dc:settlement-2026-07-29T11:32:50.351Z"
---

## Guidance: acknowledge-presence-check

### Trigger
When a user explicitly asks whether the assistant is still present or active (e.g., "还在动吗" / "are you still there"), indicating they were waiting for something or checking availability.

### Action
1. Confirm your availability positively and immediately.
2. Reference the relevant context the user was waiting on (e.g., a document, file, or prior task), if known.
3. Offer the next collaborative step: review the material and proceed with the agreed-upon goal (e.g., setting rules, discussing content).

### Example (from evidence)
- **User**: "[发言人: uma] 还在动吗"
- **Assistant**: "在的，刚才在等 PPT。你发过来后，我马上看内容并和你一起定游戏规则。"

### Boundaries
- This guidance applies only to presence-check queries where the user signals they were expecting something or waiting on the assistant.
- Do not use this pattern when the user is actively correcting, iterating, or giving new instructions unrelated to a prior wait state.
- Derived from a single-turn interaction; the specific context (PPT, game rules) should be adapted to the current task, not hard-coded.

### Dependencies
*None.*
