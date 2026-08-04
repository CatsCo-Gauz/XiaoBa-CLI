---
name: "reply-first-item-index"
description: "When the user intent is '第一条' (first item), reply with '1' to indicate the first-choice selection."
user-invocable: true
x-xiaoba-capability-handle: "cap_1332c573fb7049e89493f0b7b68bbf6b"
x-xiaoba-transition-id: "transition-eb925a1b-b093-4f5d-9c16-af94550bf515"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_session_v2_feishu_group_oc_group.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode:1:0a590964:settlement-2026-07-29T05:08:40.536Z"
---

## Skill: Reply First Item Index

### Guidance

When the user expresses the intent "第一条" (selecting the first item), reply with `1` to indicate the first-choice selection.

### Boundaries

- **Scope**: Applies only when the user explicitly says "第一条" as the user intent.
- **Evidence limit**: Derived from a single completed turn; may not generalize to other selection phrases or item-counting patterns.
- **No access or permissions**: Does not require any external accounts, credentials, or data access.

### Applicability

Trigger when the user's stated intent is "第一条" and the appropriate response is to indicate the first item by replying with the number `1`.

### Risks

- Narrow single-turn evidence — may not apply to variant phrasings or multi-item selection flows.
- Do not reuse this pattern while the user is correcting or iterating on the task.
