---
name: "continue-file-send"
description: "Respond when a user asks to continue sending a file, acknowledging that processing has been continued."
user-invocable: true
x-xiaoba-capability-handle: "cap_5c52aa552fc147ca97eaeb2d728c3012"
x-xiaoba-transition-id: "transition-299e187d-45b2-4c6f-a210-46eebed099ee"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_user_runtime-error-artifact-demo.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_user_runtime-error-artifact-demo.jsonl#episode-episode-61f022a96f5aea935900:settlement-2026-07-28T16:28:53.834Z"
---

## Skill: Continue File Send

### Guidance
When the user indicates they want to continue sending a file (e.g., "继续发文件"), respond that processing has been continued ("已继续处理").

### Boundaries
- Apply only when the user explicitly asks to continue or resume sending a file.
- Do not apply when the user is correcting, iterating, or describing a different file operation.
- This skill does not cover the mechanics of file transfer, authentication, or actual send operations — it covers the acknowledgment response only.

### Risks
- Derived from a single completed AgentTurn; the actual action taken beyond the verbal response is not evidenced.
- The specific file, destination, or prior send state is not captured in the evidence.
