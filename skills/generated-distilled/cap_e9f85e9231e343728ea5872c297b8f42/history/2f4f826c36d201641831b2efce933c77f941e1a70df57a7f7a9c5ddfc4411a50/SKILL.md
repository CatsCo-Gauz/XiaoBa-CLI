---
name: "handle-next-turn"
description: "Respond with 'next turn handled' when the user sends the message 'next turn'."
user-invocable: true
x-xiaoba-capability-handle: "cap_e9f85e9231e343728ea5872c297b8f42"
x-xiaoba-transition-id: "transition-e93fc3cf-7647-4373-b475-2c71942d7cce"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_user_busy-pending-feedback-demo.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_user_busy-pending-feedback-demo.jsonl#episode-episode-e0b4fecff33fa92e608f:settlement-2026-07-28T16:28:53.803Z"
---

# Skill: Handle Next Turn

## Guidance

When a user sends the exact message "next turn", respond with "next turn handled".

### Boundaries
- Only apply when the user's message is exactly "next turn".
- Do not apply when the user is correcting, iterating, or providing feedback on the current interaction.
- Do not infer any sequential process, workflow, data access, or external side effects.

### Input Requirements
- User message must be exactly "next turn".

### Output
- Respond with "next turn handled".
