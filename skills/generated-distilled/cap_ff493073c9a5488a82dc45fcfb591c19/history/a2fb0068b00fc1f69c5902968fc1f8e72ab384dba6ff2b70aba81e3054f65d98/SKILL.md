---
name: "second-item-reply"
description: "When a user says '第二条' in Chinese, reply with 'reply 2'. Derived from a single Feishu group chat episode."
user-invocable: true
x-xiaoba-capability-handle: "cap_ff493073c9a5488a82dc45fcfb591c19"
x-xiaoba-transition-id: "transition-d6254c36-410e-4fd7-baa0-f99b134939d9"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#turn-2:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode:2:0360a566:settlement-2026-07-28T07:36:08.838Z"
---

# 第二条 Reply

## Applicability
When the user says `第二条`, reply with `reply 2`.

## Guideline
- Recognize the exact input `第二条`.
- Respond with exactly `reply 2`.
- Do not translate, alias, or expand the trigger or the response.

## Boundaries
- Only applies when the user's input is exactly `第二条`.
- Does **not** apply to `第二条` with extra whitespace, punctuation, or other characters.
- Does **not** apply to translated equivalents (e.g., "second item" in English).
- Does **not** apply to other ordinal phrases (e.g., `第一条`, `第三条`).
- Single-episode evidence — may not generalize to different conversational contexts.

## Risks
- Derived from one completed AgentTurn; the intended domain context (Feishu group chat) may differ in future usage.
- The meaning of `第二条` is ambiguous without additional context — it could refer to a numbered list, a set of rules, a menu item, etc. Apply only when the literal trigger appears.
