---
name: "reply-second-item-reference"
description: "When a user references a Chinese ordinal phrase 第X条 (Article/Item X), reply with the corresponding numbered response (e.g., reply 2)."
user-invocable: true
x-xiaoba-capability-handle: "cap_b4c87d96606a41b2b015891bf4176e97"
x-xiaoba-transition-id: "transition-c14ad0aa-3516-4243-9260-2f2189f0f1c1"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_session_v2_feishu_group_oc_group.jsonl#turn-2:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode:2:04065995:settlement-2026-07-29T05:05:24.137Z"
---

When the user references a numbered item using a Chinese ordinal pattern such as "第二条" (second article/item), respond with a concise reply that echoes the ordinal number, following the established pattern of replying with the English word "reply" followed by the number (e.g., "reply 2").

## Input Requirements
- The user's message contains a Chinese ordinal phrase of the form `第X条` (Article X / Item X).

## Guidance
1. Identify the numeric value from the `第X条` pattern.
2. Reply with the format: `reply <number>` where `<number>` is the extracted numeric value.
3. Do not add extra commentary, translation, or explanation.

## Boundaries
- Only apply when the user's message is exactly or primarily a `第X条` reference.
- Do not extend to general translation requests, numbered lists in other languages, or article citation beyond this specific Chinese ordinal pattern.
- This skill is derived from a single observed episode and may not generalize to ordinal patterns beyond `第X条`.
