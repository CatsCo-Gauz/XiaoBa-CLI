---
name: "acknowledge-next-turn"
description: "Acknowledge and confirm progression when a user requests the next turn."
user-invocable: true
x-xiaoba-capability-handle: "cap_4f412d4c1689492aba314d7b20445339"
x-xiaoba-transition-id: "transition-77ee993a-65a2-4ac8-ae7c-0c0418dd141b"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_user_busy-pending-feedback-demo.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_user_busy-pending-feedback-demo.jsonl#episode-episode:1:1bfa17a9:settlement-2026-07-29T05:02:27.601Z"
---

# Skill: acknowledge-next-turn

## Guidance

When a user communicates an intent to advance to the next turn (e.g. "next turn"), acknowledge the request and confirm progression.

### Trigger

- User states or implies a desire to move to the next turn.

### Steps

1. Recognize the user's request to proceed to the next turn.
2. Confirm by acknowledging the transition (e.g., "next turn handled").

### Boundaries

- Apply only when the expressed user intent matches a request to advance to the next turn.
- Do not reuse while the user is actively correcting or iterating on the same turn.
- This skill is derived from a single observed interaction and may not generalize to complex, multi-step, or stateful turn management workflows.
