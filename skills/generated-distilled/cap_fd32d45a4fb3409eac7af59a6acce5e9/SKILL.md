---
name: "respond-to-first-article-reference"
description: "Responds with 'reply 1' when the user references '第一条' (first article/rule/item)."
user-invocable: true
x-xiaoba-capability-handle: "cap_fd32d45a4fb3409eac7af59a6acce5e9"
x-xiaoba-transition-id: "transition-7d588089-147f-4768-bee0-ac16d4348219"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode:1:5ef97a9b:settlement-2026-07-28T12:11:15.680Z"
---

# Respond to First Article Reference

## Trigger
The user's request is "第一条" (first article/rule/item in Chinese).

## Action
Respond with "reply 1".

## Boundaries
- Only applies when the user's input matches the literal pattern of referencing "第一条".
- Derived from a single completed episode in a Feishu group chat context and may not generalize.
- Do not apply when the user is correcting or iterating on the task.
