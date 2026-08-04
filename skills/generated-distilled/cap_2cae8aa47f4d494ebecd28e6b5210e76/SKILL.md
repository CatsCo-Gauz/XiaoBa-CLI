---
name: "first-item-reply"
description: "When the user provides the Chinese input '第一条' (first item/article), respond with 'reply 1'. Narrow single-turn pattern."
user-invocable: true
x-xiaoba-capability-handle: "cap_2cae8aa47f4d494ebecd28e6b5210e76"
x-xiaoba-transition-id: "transition-be11057c-50bc-4093-a2ae-7ae70507f99e"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_session_v2_feishu_group_oc_group.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_session_v2_feishu_group_oc_group.jsonl#episode-episode:1:ef373aef:settlement-2026-07-29T05:05:24.129Z"
---

# first-item-reply

## Applicability
Apply when the user provides the Chinese input **"第一条"** (literally "first item" or "article 1") and the expected response is a simple ordinal reply referencing that item.

## Guidance
1. When you receive the user message exactly or closely matching **"第一条"**, respond with **"reply 1"**.
2. Do not infer additional context about lists, documents, or prior interactions beyond what is available.
3. This is a narrow, literal response to the Chinese phrase "第一条" — do not extend to other numbered items (第二条, 第三条, etc.) unless separately evidenced.

## Boundaries
- Only apply when the user input matches the evidenced trigger "第一条".
- Do not apply while the user is correcting, clarifying, or iterating on the task (e.g., saying "no, I meant something else").
- Do not extrapolate to other Chinese ordinal phrases or enumerate beyond "第一条".

## Risks
- Derived from a single completed AgentTurn — the pattern may not generalize.
- The meaning of "第一条" is ambiguous without broader context; use only the literal trigger–response pairing evidenced.
