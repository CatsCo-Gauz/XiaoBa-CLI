---
name: "continue-processing"
description: "Acknowledges a 'continue processing' (请继续处理) request and responds with 'processed' (已处理)."
user-invocable: true
x-xiaoba-capability-handle: "cap_1169edf9c0a8448398fbb6b9a6275cfd"
x-xiaoba-transition-id: "transition-b92ad082-32e7-47c9-88df-525994c65989"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_user_runtime-feedback-demo.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_user_runtime-feedback-demo.jsonl#episode-episode:1:0b9d26eb:settlement-2026-07-28T12:11:17.204Z"
---

## Skill: continue-processing

### Guidance

When a user issues the request "请继续处理" (please continue processing), respond by acknowledging the continuation request with "已处理" (processed), confirming that the prior task or workflow has been continued as requested.

### Boundaries

- This skill applies only when the user's explicit intent is to request continuation of processing ("请继续处理").
- Do not apply when the user is correcting, iterating, or providing new instructions.
- Do not extend this skill to arbitrary "continue" requests in different languages or domains without additional evidence.
- This skill does not imply any specific tool usage, data access, or external side effects beyond the acknowledgment response.

### Evidence

- User intent observation: "请继续处理" (source: feishu_user_runtime-feedback-demo.jsonl#turn-1:user-intent)
- Assistant response: "已处理" (source: feishu_user_runtime-feedback-demo.jsonl#turn-1:assistant-response)
- Settlement at 2026-07-28T12:11:17.204Z (eligible status)
