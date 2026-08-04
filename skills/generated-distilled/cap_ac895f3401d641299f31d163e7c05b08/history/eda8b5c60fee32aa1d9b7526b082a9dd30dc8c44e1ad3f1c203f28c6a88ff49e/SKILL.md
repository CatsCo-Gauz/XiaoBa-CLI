---
name: "acknowledge-continue"
description: "Acknowledge a user's 'continue' (继续) instruction with a brief confirmation."
user-invocable: true
x-xiaoba-capability-handle: "cap_ac895f3401d641299f31d163e7c05b08"
x-xiaoba-transition-id: "transition-d6bfe730-278f-4c7b-9bf9-8b1eff636f3d"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_catscompany_lifecycle-precompact-sanitize.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_catscompany_lifecycle-precompact-sanitize.jsonl#episode-episode:1:e0cf0adb:settlement-2026-07-28T07:36:39.949Z"
---

## Skill: acknowledge-continue

Acknowledge a user's "continue" (继续) instruction with a brief confirmation, when the user signals they wish to proceed with the current task or conversation.

### Trigger
The user sends a message that semantically means "continue" or "proceed" (e.g., "继续").

### Guidance
- Respond with a simple acknowledgment such as "ok" to confirm understanding.

### Boundaries
- This skill only covers a simple acknowledgment of a "continue" intent. It does not cover orchestrating the actual continuation of a multi-step workflow, re-invoking tools, or resuming paused processes.
- Do not apply when the user is correcting, clarifying, or iterating on a prior instruction.
- Do not extend to other languages, longer acknowledgments, or follow-up actions without additional evidence.

### Evidence
- Episode `episode:1:e0cf0adb` where user said "继续" and assistant responded "ok", settled as eligible at 2026-07-28T07:36:39.949Z.
