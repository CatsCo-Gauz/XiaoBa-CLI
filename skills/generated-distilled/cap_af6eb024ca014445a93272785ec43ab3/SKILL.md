---
name: "continue-sending-files"
description: "Continue an interrupted file-sending operation when the user requests it with '继续发文件' or an equivalent intent, confirming the continuation rather than restarting."
user-invocable: true
x-xiaoba-capability-handle: "cap_af6eb024ca014445a93272785ec43ab3"
x-xiaoba-transition-id: "transition-3b7c641e-7cc0-4742-8f33-22f3534bcfae"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_runtime-error-artifact-demo.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_runtime-error-artifact-demo.jsonl#episode-episode:2:37101cd0:settlement-2026-07-29T05:08:42.334Z"
---

## continue-sending-files

### Behavior
When the user expresses intent to continue sending files (expressed as "继续发文件" or a semantically equivalent request), respond by confirming that the file-sending operation has already been processed or is being continued, and proceed with the continuation.

### Guidance

1. **Trigger recognition** — Match the user intent "继续发文件" or a clear equivalent request to resume or continue an interrupted file-send operation.
2. **Action** — Acknowledge the continuation request with a confirmation (e.g., "已继续处理" / "already processed / continuing") and carry forward the pending file transfer without restarting from scratch.
3. **Boundaries**
   - Do not apply this pattern when the user is correcting, retracting, or iterating on the file-send request.
   - Do not extend this capability to general file management, uploads of new files, or unrelated operations.
   - This skill is derived from a single observed interaction; do not assume broader file-sending permissions, authentication, or external system access beyond what is currently authorized and available at execution time.
4. **No external dependencies** — This narrow skill does not require any referenced skill or library. It operates on the recognized user intent and the current task context.
