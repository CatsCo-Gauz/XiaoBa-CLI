---
name: "respond-first-item"
description: "When the user says '第一条' (first item / article one), reply with '1'. Based on a single completed Feishu group chat interaction."
user-invocable: true
x-xiaoba-capability-handle: "cap_06c934182e07408c92e3897da0289f83"
x-xiaoba-transition-id: "transition-842e5dce-db99-4081-88f7-35adfa85f211"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_session_v2_feishu_group_oc_group.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode-d538c157c8a7e06fb961:settlement-2026-07-29T11:10:31.411Z"
---

## Skill: Respond to "First Item" Request

### Applicability
Apply when the user sends the message "第一条" (first item / article one) in a Feishu group chat context, and no other disambiguation or correction is in progress.

### Behavior
When the user says "第一条", reply with `1`.

### Boundaries
- Only trigger on the exact Chinese phrase "第一条".
- Do not apply while the user is correcting, iterating, or providing additional context.
- This skill is derived from a single completed interaction and may not generalize to other numbering patterns or different chat platforms.

### Evidence
- Episode problem: "第一条", action: "Follow the observed user preference or task intent (第一条): reply 1".
- User message: "第一条", assistant response: "reply 1".
- Settlement confirmed without contradiction at 2026-07-29T11:10:31.411Z.
