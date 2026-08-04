---
name: "reply-second-item"
description: "When the user says '第二条' (second item/article), reply with '2'."
user-invocable: true
x-xiaoba-capability-handle: "cap_db49b3d332b0487db7b4cc50825f7396"
x-xiaoba-transition-id: "transition-fa37d26d-2be7-4d62-82bb-1f7c1563052f"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_session_v2_feishu_group_oc_group.jsonl#turn-2:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode:2:fc3e576a:settlement-2026-07-29T04:58:12.866Z"
---

## Skill: reply-second-item

### Guidance

When the user says `第二条` (meaning "second item" or "article two"), reply with `2`.

### Applicability

- **Trigger**: User message is exactly or semantically equivalent to `第二条`
- **Response**: Reply `2`

### Boundaries

- Only applies to this exact or semantically equivalent user intent (`第二条`).
- Do not apply while the user is correcting or iterating on the same task.
- Does not generalize to other numbered items or articles (e.g., `第一条`, `第三条`) unless separately evidenced.

### Dependencies

None.
