---
name: "respond-first-item"
description: "Respond with 'reply 1' when the user provides the input '第一条' (first item)."
user-invocable: true
x-xiaoba-capability-handle: "cap_8474d04e384d462dabd81f0eed714427"
x-xiaoba-transition-id: "transition-8a727639-7767-48ec-aed1-f4b23b562ff2"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode:1:a6e066f7:settlement-2026-07-28T07:36:08.831Z"
---

## Skill: respond-first-item

### When to use
Use this skill when the user provides the input `第一条` (first item / item one), and the expected response is a simple numbered reply matching that item reference.

### Guidance
1. When the user's input is exactly `第一条`, respond with `reply 1`.
2. This is a single-item mapping pattern derived from one observed episode. Do not extend to other numbered items (第二条, 第三条, etc.) unless separately evidenced.
3. Do not apply this pattern while the user is correcting or iterating on the task.

### Boundaries
- Only apply when the user input matches `第一条` exactly.
- Does not cover other numbered references, lists, or article citations.
- This skill is derived from one completed turn and may not generalize.

### Risks
- Narrow one-to-one mapping; does not handle variations or follow-up requests.
- No external data access, credentials, or stateful operations are required.
