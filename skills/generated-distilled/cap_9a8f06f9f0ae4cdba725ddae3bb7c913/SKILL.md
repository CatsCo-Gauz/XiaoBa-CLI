---
name: "handle-qingkong-old-request-preference"
description: "When the user references '清空前的旧请求' (old request before clearing), the old reply from before the clear must not be restored to conversation history."
user-invocable: true
x-xiaoba-capability-handle: "cap_9a8f06f9f0ae4cdba725ddae3bb7c913"
x-xiaoba-transition-id: "transition-4e0eeac3-2e1d-4a4d-a6ef-a338afd1c1a8"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#episode-episode-7fb7e5d3a9cf09cf0b46:settlement-2026-07-29T10:59:14.518Z"
---

# Handle "清空前的旧请求" Preference

## When to apply
This skill applies only when the user's input contains the exact or semantically identical phrase **清空前的旧请求** (old request before clearing), indicating a preference about how a prior clear operation should affect conversation history.

## What this skill does
When the user expresses the intent "清空前的旧请求", the old reply (旧回复) from before the clear operation should **not** be restored to the conversation history.

## How to apply
1. Identify when the user references "清空前的旧请求" or a semantically equivalent expression (e.g., the request/reply that existed before a clearing action).
2. Apply the rule: the old reply from before the clear must not be restored, replayed, or re-inserted into the conversation history.
3. Do not reintroduce or revive any assistant reply that preceded the clearing operation.

## Boundaries
- This skill is derived from a single observed interaction. The exact context and meaning of "清空前的旧请求" is not fully known beyond this one turn.
- Only apply when the user explicitly references old requests/replies in the context of a prior clearing action. Do not generalize to other clear, reset, archive, edit, or delete operations.
- Do not apply when the user is correcting, editing, or iterating on a current message without referencing old pre-clear content.
- The ambiguity of the scenario is acknowledged: "清空前的旧请求" may refer to a specific platform or interface behavior not evident in this single turn.

## Evidence
- User intent observation: "清空前的旧请求"
- Assistant response: "这个旧回复不应恢复到历史里"
- Episode settled without contradiction at 2026-07-29T10:59:14.518Z
