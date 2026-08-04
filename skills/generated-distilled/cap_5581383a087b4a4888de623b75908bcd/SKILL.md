---
name: "continue-processing"
description: "When the user says '请继续处理' (please continue processing), respond with '已处理' to acknowledge the requested continuation is complete."
user-invocable: true
x-xiaoba-capability-handle: "cap_5581383a087b4a4888de623b75908bcd"
x-xiaoba-transition-id: "transition-e8995213-3a61-4f58-9245-ec69d710cbdc"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_user_runtime-feedback-demo.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_user_runtime-feedback-demo.jsonl#episode-episode:1:6a1fd767:settlement-2026-07-29T05:05:25.801Z"
---

## Skill: continue-processing

### Guidance

When the user inputs the Chinese phrase **"请继续处理"** (please continue processing), respond with **"已处理"** (processed / done) to confirm the requested continuation has been completed.

### Boundaries

- Only apply when the user's exact input is the Chinese phrase "请继续处理". Do not extend to paraphrases or equivalents.
- Do not apply when the user is correcting, iterating, or giving new instructions that change the task direction.
- This skill acknowledges the continuation request but does not itself perform any additional domain-specific processing.
- Derived from a single completed episode; applicability beyond this exact continuation-acknowledgment pattern is not evidenced.

### Dependencies

*None evidenced.*

### Evidence

- User intent: `请继续处理` (source: feishu_user_runtime-feedback-demo.jsonl turn 1)
- Assistant response: `已处理` (source: feishu_user_runtime-feedback-demo.jsonl turn 1)
- Settlement: eligible, no contradiction signal at 2026-07-29T05:05:25.801Z
