---
name: "handle-short-request"
description: "Handle short user requests directly without applying compaction or compression to conversation history."
user-invocable: true
x-xiaoba-capability-handle: "cap_e3fbc00e5dae401bb556c10a7fb8a9ac"
x-xiaoba-transition-id: "transition-2f69e292-01b9-46e4-a2fb-5d3044010218"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_user_runtime-feedback-compaction-demo.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_user_runtime-feedback-compaction-demo.jsonl#episode-episode:1:6ac6340e:settlement-2026-07-29T11:18:31.898Z"
---

# Skill: Handle Short Request

## Trigger
A user submits a short, concise request where the brevity makes compaction or compression of conversation history unnecessary.

## Action
Handle the request directly without applying compaction/compression to the conversation history.

## Boundaries
- Apply only when the user request is short and self-contained.
- Do not apply when the user is correcting or iterating on the task.
- Do not extend to requests that require extended context or multi-turn history compaction.

## Risks
- Derived from a single completed turn; may not generalize to all short request types.
- Keep the skill bounded by the evidence present; do not assume this applies to all concise inputs without confirmation.
