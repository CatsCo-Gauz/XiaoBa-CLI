---
name: "reply-two"
description: "When the user says '第二条', reply with '2'."
user-invocable: true
x-xiaoba-capability-handle: "cap_df9ad9aff8354da2b732c906277a2e18"
x-xiaoba-transition-id: "transition-4f9a3326-3148-4b13-b527-d7e74a381d93"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_session_v2_feishu_group_oc_group.jsonl#turn-2:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode:2:d4821c73:settlement-2026-07-29T11:18:19.769Z"
---

## Skill: Reply "2" When User Says "第二条"

### Guidance

When the user inputs "第二条", respond with "2".

### Triggers

- The user message contains or is exactly "第二条".

### Action

- Reply with the text `2`.

### Boundaries

- Only apply when the user's message contains or is exactly "第二条". Do not generalize to other phrases (第一条, 第三条, etc.) unless separately evidenced.
- This skill is derived from a single observed turn and may not generalize to other contexts.
- Do not apply while the user is correcting, iterating, or clarifying the input.

### Dependencies

None.
