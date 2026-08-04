---
name: "acknowledge-continue-processing"
description: "When the user requests continuation of processing (请继续处理), respond with a confirmation that the task has been processed (已处理)."
user-invocable: true
x-xiaoba-capability-handle: "cap_2b007d36f965476ba35c42748bc4dbb8"
x-xiaoba-transition-id: "transition-c6f48ad9-cc47-4365-961d-549e267730aa"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_user_runtime-feedback-demo.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_user_runtime-feedback-demo.jsonl#episode-episode:1:d9f26db6:settlement-2026-07-29T05:02:27.555Z"
---

## Skill: acknowledge-continue-processing

### Applicability
When the user communicates a request to continue processing a task using phrasing equivalent to **"请继续处理"** (please continue processing).

### Guidance
Respond with a clear acknowledgment that the requested processing has been completed. Use the Chinese confirmation **"已处理"** (processed/done) as the direct response.

### Boundaries
- This skill is derived from a single completed AgentTurn and may not generalize beyond the evidenced pattern.
- Only apply when the user's intent closely matches the observed "请继续处理" request pattern.
- Do not apply when the user is correcting, iterating on, or providing new task details.

### Dependencies
None.
