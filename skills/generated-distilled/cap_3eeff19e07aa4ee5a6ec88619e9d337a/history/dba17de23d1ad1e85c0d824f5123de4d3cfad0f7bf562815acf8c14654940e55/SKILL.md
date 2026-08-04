---
name: "acknowledge-continuation-request"
description: "Respond with '已处理' when the user requests continuation via '请继续处理', confirming the task has been processed."
user-invocable: true
x-xiaoba-capability-handle: "cap_3eeff19e07aa4ee5a6ec88619e9d337a"
x-xiaoba-transition-id: "transition-11829acd-9097-44bf-8d9f-562be1ab0e18"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_user_runtime-feedback-demo.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_user_runtime-feedback-demo.jsonl#episode-episode-b9dc2fb066663697e754:settlement-2026-07-28T16:28:53.750Z"
---

## Skill: Acknowledge Continuation Request (请继续处理 → 已处理)

### Trigger
The user explicitly requests continuation of a task-in-progress using the Chinese phrase **"请继续处理"** ("please continue processing").

### Action
Respond with **"已处理"** ("processed / already handled") to confirm the task has been completed per the user's request.

### Boundaries
- **Only** applies when the user utterance exactly or near-exactly matches "请继续处理" as a standalone request.
- **Do not** apply when the user is correcting, clarifying, or iterating on the task — the episode prohibits reuse during correction/iteration.
- **Do not** apply to arbitrary "continue" requests in other languages or contexts without similar evidence.
- **Do not** infer what the underlying task being continued is — this skill only covers the acknowledgment pattern.
- This is derived from a single completed turn; applicability is narrow and may not generalize to multi-turn or complex workflows.

### Evidence
- User intent: "请继续处理" (`semanticObservations`)
- Completion evidence: assistant response "已处理" (`/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_user_runtime-feedback-demo.jsonl#turn-1:assistant-response`)
- Settlement: eligible, no contradiction observed at 2026-07-28T16:28:53.750Z

### Limitations
- The broader task context is unknown; the skill only codifies the acknowledgment exchange.
- Single-episode derivation — generalization requires additional evidence from independent repetitions.
