---
name: "respond-to-first-item-query"
description: "Responds to a user message referencing 第一条 (first item/rule/article) with a concise numbered reply identifying the first item."
user-invocable: true
x-xiaoba-capability-handle: "cap_3b695303710b42ad9a5d0056df246d6a"
x-xiaoba-transition-id: "transition-7833bbeb-762d-4beb-83d6-1a10d3bc8158"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode-56595e159e1066d7df6d:settlement-2026-07-28T16:28:51.979Z"
---

## Skill: respond-to-first-item-query

### Applicability
Applies when the user sends a message containing or referring to **第一条** (first item/rule/article) and expects a numbered reply identifying that item.

### Behavior
1. When the user's message references "第一条" ("first item/rule/article"), reply with a concise response that identifies the corresponding item number (e.g., "1").

### Boundaries
- Only apply when the input matches the specific pattern of referencing "第一条" as observed in the evidence.
- Do not reuse this pattern while the user is correcting or iterating on the task.
- Does not apply to arbitrary numbered lists, general enumeration requests, or other languages/terms.
- This skill is derived from a single observed turn and may not generalize beyond the supplied evidence.

### Evidence
- **User intent:** User message "第一条" (semantic observation)
- **Completion:** Assistant replied "reply 1" (ref: `/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#turn-1:assistant-response`)
- **Settlement:** No contradiction signal at settlement (ref: `/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode-56595e159e1066d7df6d:settlement-2026-07-28T16:28:51.979Z`)

### Risks
- Derived from one completed AgentTurn; may not generalize.
- Do not copy lifecycle words (settled, episode, candidate) into routing or public names.
- Limited to the observed single-turn pattern.
