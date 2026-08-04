---
name: "reply-second-item"
description: "When the user says '第二条' (second item/article), respond with 'reply 2'. Derived from a Feishu group interaction where the assistant mapped the ordinal reference to the corresponding numbered reply."
user-invocable: true
x-xiaoba-capability-handle: "cap_f2f4bc8e0dcb4295a10670bcb4544bf1"
x-xiaoba-transition-id: "transition-cc9e11d2-1c62-4e6a-b39d-6c5dc2e9f388"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#turn-2:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode:2:cbd5335e:settlement-2026-07-28T07:31:52.744Z"
---

## Skill: reply-second-item

**Problem:** When a user provides the input "第二条" (second item/article), respond by indicating that item's position.

**Guidance:**
When the user input is "第二条", reply with "reply 2" (or the equivalent English response indicating the second item). This is a simple lookup and response pattern derived from a Feishu group context where numbered items are referenced by ordinal.

**Applicability:**
- Apply when the user request is "第二条" (Chinese for "second item" / "Article 2" / "second rule")
- Intended for contexts where a numbered list or set of items is being referenced by ordinal position

**Boundaries:**
- Do not apply to arbitrary ordinal requests beyond "第二条" unless evidence supports extension
- Do not apply while the user is correcting, iterating, or clarifying the request
- Does not cover creating, modifying, or managing the underlying numbered items — only the response mapping from the ordinal reference

**Evidence refs:**
- `/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#turn-2:assistant-response`
- `/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode:2:cbd5335e:settlement-2026-07-28T07:31:52.744Z`
