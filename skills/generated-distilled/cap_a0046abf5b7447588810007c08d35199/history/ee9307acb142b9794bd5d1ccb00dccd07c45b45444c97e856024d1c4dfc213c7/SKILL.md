---
name: "acknowledge-continuation"
description: "Respond with confirmation (已处理) when the user asks to continue processing (请继续处理)."
user-invocable: true
x-xiaoba-capability-handle: "cap_a0046abf5b7447588810007c08d35199"
x-xiaoba-transition-id: "transition-47ed265b-c59a-4a6f-81e9-f5e877bd89ec"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_user_runtime-feedback-demo.jsonl#turn-1:assistant-response"
---

## Skill Draft: acknowledge-continuation

### Applicability
Apply when the user expresses a request to continue or complete processing using the intent "请继续处理" (please continue handling).

### Guidance
1. When the user says "请继续处理" or equivalent Chinese continuation requests, acknowledge the completion of the previously underway task.
2. Respond with "已处理" (already handled / processed) to confirm the requested continuation has been completed.

### Boundaries
- This skill applies only when the user's utterance matches the intent of asking to continue or complete processing (请继续处理).
- Do not apply when the user is in the middle of correcting or iterating on the task.
- Do not extend to general greeting, unrelated requests, or tasks outside the evidenced continuation pattern.
- No dependencies on external tools, accounts, or services are required.

### Evidence
- Single eligible learning episode: user intent "请继续处理" → assistant response "已处理". Settled without contradiction at 2026-07-28T07:31:54.533Z.
