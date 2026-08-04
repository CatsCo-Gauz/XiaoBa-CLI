---
name: "acknowledge-continuation-request"
description: "When the user requests to continue processing using '请继续处理', respond with '已处理' to confirm completion."
user-invocable: true
x-xiaoba-capability-handle: "cap_b17b35fa3bf944a1bf2cf4831b305d69"
x-xiaoba-transition-id: "transition-7a475606-5ad1-4afe-bba6-894272e54f65"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_user_runtime-feedback-demo.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-29/feishu_user_runtime-feedback-demo.jsonl#episode-episode:1:c4757b5d:settlement-2026-07-29T05:08:42.232Z"
---

## Skill: acknowledge-continuation-request

### Guidance

When the user communicates a request to continue processing using the phrase "请继续处理" (or equivalent "please continue processing"), respond with a concise acknowledgment "已处理" to confirm the processing has been completed without further elaboration.

### Applicability

- Only apply when the user's request matches the intent of asking to continue or proceed with processing (in Chinese: "请继续处理").
- Do not apply to requests that contain specific new instructions, corrections, iterative feedback, or details about what should be processed.
- Do not apply to requests in languages other than Chinese unless clear equivalent continuation intent is present.
- This skill is derived from a single observed episode and should be narrowly applied.

### Boundaries

- The response is a simple confirmation ("已处理") — do not add explanations, status details, or follow-up questions.
- Do not reuse this pattern while the user is correcting or iterating on a specific task refinement.
- Do not extend this behavior to generic greetings, inquiries, or unrelated requests.
