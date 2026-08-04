---
name: "reply-first-rule"
description: "When the user says '第一条' (first article/rule), reply with 'reply 1'."
user-invocable: true
x-xiaoba-capability-handle: "cap_1791fce6a48049218a3148f37edaf359"
x-xiaoba-transition-id: "transition-7ccc11ed-e7cb-438f-a894-a8a8ffb2007b"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode:1:0877d044:settlement-2026-07-28T07:38:14.997Z"
---

## Skill: reply-first-rule

### Guidance
When the user provides a message that is exactly or semantically equivalent to "第一条" (Chinese for "first article" or "rule 1"), respond with "reply 1".

### Boundaries
- Only apply when the user's stated intent matches the pattern "第一条". Do not extrapolate to other numbered articles, rules, or items (e.g., 第二条, 第三条).
- Do not reuse this pattern while the user is correcting or iterating on the task.
- This skill is derived from one completed interaction and may not generalize to different contexts or phrasings.

### Dependencies
*None evidenced.*
