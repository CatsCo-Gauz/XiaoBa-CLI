---
name: "respond-second-item"
description: "When the user inputs '第二条' (Chinese for 'second item'), reply with 'reply 2'. Narrow single-turn capability derived from an eligible learning episode."
user-invocable: true
x-xiaoba-capability-handle: "cap_2915ddfd920a44f8888cb0206a8a5446"
x-xiaoba-transition-id: "transition-00310e57-5f53-4629-b250-c8c5437221f6"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#turn-2:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode:2:e4ef5efd:settlement-2026-07-28T07:38:15.004Z"
---

## Skill: Respond to "Second Item" Request

### Guidance

When the user input is "第二条" (Chinese for "second item"), reply with "reply 2".

### Boundaries

- This skill applies only when the user's exact input is "第二条".
- Do not apply this pattern to other numbered-item requests (e.g., "第一条", "第三条") unless separately evidenced.
- Do not reuse this pattern while the user is correcting or iterating on the task.
- This skill is derived from a single-turn interaction and should not be overgeneralized.

### Risks

- This candidate is derived from one completed AgentTurn and may not generalize to different phrasing or contexts.
- The meaning of "第二条" outside this interaction is not established by the evidence.
