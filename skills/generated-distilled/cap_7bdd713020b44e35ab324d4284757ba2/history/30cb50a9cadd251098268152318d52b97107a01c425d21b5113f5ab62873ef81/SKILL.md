---
name: "handle-short-user-request"
description: "Handles a short user request without context compaction, based on the evidenced pattern."
user-invocable: true
x-xiaoba-capability-handle: "cap_7bdd713020b44e35ab324d4284757ba2"
x-xiaoba-transition-id: "transition-ad5c2849-3b1d-4d74-822e-51d87473d38d"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_user_runtime-feedback-compaction-demo.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_user_runtime-feedback-compaction-demo.jsonl#episode-episode:1:61356da3:settlement-2026-07-28T12:11:17.273Z"
---

## Skill: handle-short-user-request

### When to apply
Apply when the user makes a "short user request" that matches the evidenced pattern — a concise, self-contained request handled without compaction.

### Boundaries
- Apply only when the request fits the evidenced "short user request" pattern.
- Do not apply when the user is correcting, iterating, or giving negative feedback on the handling.
- Do not extend this skill to concepts not evidenced: history compression, summarization, multi-turn planning, or external tool orchestration.

### Guidance
When the trigger "short user request" is recognized:

1. Handle the request without compaction.
2. Respond directly — the response does not require context compaction or history reduction.

### Evidence
- User intent: "short user request" (semantic observation)
- Source assistant response: "handled without compaction"
- Settlement: Episode settled eligible at 2026-07-28T12:11:17.273Z with no contradiction signal
