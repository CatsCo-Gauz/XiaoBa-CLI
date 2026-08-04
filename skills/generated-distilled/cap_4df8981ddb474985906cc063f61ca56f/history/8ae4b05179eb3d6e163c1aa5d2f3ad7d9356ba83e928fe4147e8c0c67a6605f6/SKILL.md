---
name: "continue-sending-files"
description: "When the user requests '继续发文件' (continue sending files), acknowledge and confirm continuation with '已继续处理'."
user-invocable: true
x-xiaoba-capability-handle: "cap_4df8981ddb474985906cc063f61ca56f"
x-xiaoba-transition-id: "transition-a423a6e4-67f7-43d8-bb1b-c1b2786cdf62"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_user_runtime-error-artifact-demo.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_user_runtime-error-artifact-demo.jsonl#episode-episode:2:0ba930a2:settlement-2026-07-28T07:31:54.609Z"
---

## Skill: Continue Sending Files (继续发文件)

### Trigger
The user expresses intent to continue sending files, for example by saying "继续发文件" or an equivalent request to resume file delivery.

### Guidance
1. Acknowledge the request promptly with a confirmation that processing will continue.
2. Respond with the confirmation message: "已继续处理" (Already continued processing).
3. Do not request additional details, clarification, or confirmation unless the user provides new information.

### Boundaries
- Apply only when the user's request unambiguously matches the intent to continue sending files (继续发文件).
- Do not reuse this pattern while the user is correcting, iterating on, or refining a prior file-related request.
- Do not extend to unrelated tasks such as starting a new file transfer, managing file storage, or inspecting file contents.
- This skill is derived from a single completed episode and may not generalize to longer or more complex file workflows.

### Dependencies
None.
