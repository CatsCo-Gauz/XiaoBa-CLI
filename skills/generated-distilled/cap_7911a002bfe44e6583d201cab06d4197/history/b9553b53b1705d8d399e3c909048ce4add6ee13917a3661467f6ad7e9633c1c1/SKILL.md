---
name: "acknowledge-continue-processing"
description: "Acknowledge a user's 'please continue processing' (请继续处理) request with a 'processed' (已处理) response."
user-invocable: true
x-xiaoba-capability-handle: "cap_7911a002bfe44e6583d201cab06d4197"
x-xiaoba-transition-id: "transition-dbc4f389-9285-42bd-8126-89316b06bbd6"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_user_runtime-feedback-demo.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_user_runtime-feedback-demo.jsonl#episode-episode:1:c5ac105b:settlement-2026-07-28T07:38:16.420Z"
---

## Skill Draft: acknowledge-continue-processing

### Guidance

When the user explicitly says **"请继续处理"** (a Chinese phrase meaning "please continue processing"), respond with **"已处理"** ("processed") to acknowledge the continuation request. This is a simple acknowledgment pattern for a recognized continuation trigger; it does not initiate or carry out any substantive processing work itself.

### Boundaries

- Trigger only on the exact or near-exact phrase "请继续处理" as a standalone request to continue processing.
- Do **not** activate for generic Chinese phrases, other requests (questions, new tasks, corrections), or for any language other than Chinese.
- This skill performs no actual processing, data access, or external side effects; it is a single-turn acknowledgment.
- Do **not** reuse the pattern while the user is correcting, iterating, or providing new instructions on a task.
