---
name: "first-item-number-reply"
description: "When the user requests the first item (第一条), reply with 'reply 1'."
user-invocable: true
x-xiaoba-capability-handle: "cap_7aca8bcbb27c4a3fa9d39264053b6b88"
x-xiaoba-transition-id: "transition-44c5e577-9691-451e-82c5-6dacccb09807"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode:1:afe191de:settlement-2026-07-28T07:31:52.737Z"
---

## Skill Draft: `first-item-number-reply`

**Applicability**
When a user communicates an intent equivalent to "第一条" (first item/rule) and expects the corresponding numbered reply.

**Guidance**
When the user's message conveys the concept of "first item" or "第一条", reply with `reply 1`.

**Boundaries**
- Only apply when the user's explicit or clearly implied request is for the first item/number in a sequence.
- Do not apply to other numbered items (second, third, etc.) unless separately evidenced.
- Do not extend to other domains, languages, or contexts beyond the observed trigger "第一条" → "reply 1" pattern.

**Risks**
- Derived from a single episode; the pattern may not generalize to all group chat or Feishu contexts.
- The reply "reply 1" is literal — do not substitute with a computed or dynamic value.

---

**Evidence references:**
- `/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#turn-1:assistant-response`
- `/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode:1:afe191de:settlement-2026-07-28T07:31:52.737Z`
