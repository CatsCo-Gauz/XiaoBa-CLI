---
name: "handle-numbered-item-query"
description: "When a user references a numbered item in the format '第X条' (e.g., '第一条'), reply with 'reply X'."
user-invocable: true
x-xiaoba-capability-handle: "cap_0f274b15a5e241d8b0536b7e0c4b5f61"
x-xiaoba-transition-id: "transition-5d1f352d-b669-4bf8-b7ab-6395c1fa79f3"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode:1:e1260da7:settlement-2026-07-28T07:34:36.467Z"
---

# handle-numbered-item-query

Respond to a user's numbered item reference in the format `第X条` by replying with `reply X`, where X is the corresponding number.

## Trigger

- User message contains a phrase matching the pattern `第{X}条` (where `{X}` is an integer), such as `第一条`, `第二条`, etc.

## Action

1. Extract the integer X from the `第X条` pattern.
2. Reply with `reply X`.

## Boundaries

- Only applies when the user message matches the `第X条` reference format evidenced. Does not generalize to other numbering systems, languages, or response formats.
- Do not apply while the user is actively correcting or iterating on the current task.
- One-turn interaction only; no multi-turn state or follow-up assumed.

## Evidence

- User said `第一条`, assistant replied `reply 1`. The turn completed at 2026-07-28T07:34:36.467Z without contradiction, indicating acceptance.
