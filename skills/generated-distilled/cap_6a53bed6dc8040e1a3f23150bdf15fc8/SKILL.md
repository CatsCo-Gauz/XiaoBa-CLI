---
name: "second-item-reply"
description: "When the user provides the prompt '第二条' (second item), reply with '2' as a direct item-index response."
user-invocable: true
x-xiaoba-capability-handle: "cap_6a53bed6dc8040e1a3f23150bdf15fc8"
x-xiaoba-transition-id: "transition-a8f65e91-09dd-43ec-94e0-1fdfa41423cf"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_session_v2_feishu_group_oc_group.jsonl#turn-2:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode:2:215cb215:settlement-2026-07-29T05:08:40.545Z"
---

## Skill: second-item-reply

### Purpose
When the user provides the Chinese-language prompt "第二条" (meaning "second item"), respond with "2" or "reply 2" as a straightforward item-index reply.

### Guidance
1. **Trigger**: User input matches or directly references "第二条".
2. **Action**: Reply with "2" (e.g., "reply 2" or simply "2") as a direct item-index response.
3. **Boundary**: This skill applies only when the user's intent is clearly the two-character prompt "第二条" in a context where an enumerated item index reply is expected. Do not extend to general list handling, translation, or arbitrary Chinese phrases without supporting evidence.
4. **Limitation**: Derived from a single observed turn; the pattern is narrow and should not be generalized beyond direct "第二条" → "2" mapping.
