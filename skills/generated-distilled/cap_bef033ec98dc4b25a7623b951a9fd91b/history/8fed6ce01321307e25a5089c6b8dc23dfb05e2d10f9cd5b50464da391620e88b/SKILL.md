---
name: "reply-two-for-second-item"
description: "When a user says 第二条 (second item in Chinese), reply with reply 2."
user-invocable: true
x-xiaoba-capability-handle: "cap_bef033ec98dc4b25a7623b951a9fd91b"
x-xiaoba-transition-id: "transition-b9ac96c9-f095-46e7-8dbc-3a60aa60fab7"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#turn-2:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode-bd03fb2720ec086533a9:settlement-2026-07-28T16:28:51.990Z"
---

## Skill: reply-two-for-second-item

**When to apply:** When a user says "第二条" (Chinese for "second item" or "item two") in a conversation, indicating they are selecting or referencing the second item.

**Action:** Reply with "reply 2".

**Evidence:**
- Single observed turn at `/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#turn-2`: user said "第二条", assistant replied "reply 2".
- Episode settled at 2026-07-28T16:28:51.990Z without contradiction.

**Boundaries:**
- Only apply when the user intent is "第二条" (second item). Do not generalize to other numbered items, other Chinese phrases, or other languages without separate evidence.
- Derived from a single completed AgentTurn — applicability is narrow and may not generalize.

**Risks:**
- Single-turn evidence only; the observed pattern may not hold across different contexts or user expectations.
- The term "第二条" may have different meanings depending on context (e.g., list selection, rule number, article reference); this skill only covers the observed pattern of replying "reply 2".
