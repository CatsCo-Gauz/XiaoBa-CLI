---
name: "reply-first-item"
description: "Reply with '1' when the user says '第一条' (first item) to acknowledge or select the first item in a chat or group context."
user-invocable: true
x-xiaoba-capability-handle: "cap_b843e7d9371249deb80134df78d3017a"
x-xiaoba-transition-id: "transition-2301bfd4-7fe0-403f-8454-9cf7085eb704"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_session_v2_feishu_group_oc_group.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode:1:cfb43153:settlement-2026-07-29T05:02:25.989Z"
---

## Skill: reply-first-item

### Applicability
Apply when the user sends a message containing "第一条" (first item) in a chat or group context and the expected behavior is to select or acknowledge that item.

### Behavior
Reply with `1` to indicate selection or acknowledgment of the first item referenced by the user.

### Evidence
- **User intent:** "第一条"  
- **Observed action:** Assistant replied "1"  
- **Settlement:** Episode completed without contradiction at 2026-07-29T05:02:25.989Z

### Boundaries
- Only apply when the user explicitly uses "第一条" as the message content.
- Do not apply for unrelated numeric queries, counting, or ordinal references outside this pattern.
- Do not generalize to other ordinal phrases (e.g., "第二条", "第三条") without additional evidence.

### Risks
- Derived from a single completed episode and may not generalize to all chat contexts.
- The meaning of "第一条" may vary by group culture or conversation context.
