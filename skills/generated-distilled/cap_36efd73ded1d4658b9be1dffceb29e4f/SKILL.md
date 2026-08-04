---
name: "acknowledge-run-tool-request"
description: "Acknowledge a generic 'run tool' request when no specific tool is identified."
user-invocable: true
x-xiaoba-capability-handle: "cap_36efd73ded1d4658b9be1dffceb29e4f"
x-xiaoba-transition-id: "transition-2d05cc62-bd81-4c12-8308-08c8e13b5004"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/chat/2026-07-29/chat_cc_group_demo.jsonl#turn-1:assistant-response"
---

## Acknowledge Generic Run Tool Request

### Trigger
When the user says "run tool" without specifying which tool, tool parameters, or expected outcome.

### Guidance
1. **Recognize the request** – The user has asked to "run tool" (or a semantically equivalent phrase) without identifying a specific tool by name or parameters.
2. **Acknowledge the request** – Respond with a confirmation that the request has been received (e.g., "done"), indicating acknowledgment.
3. **Do not** attempt to select, invoke, or simulate running any particular tool. No parameters, tool names, or execution details are available from the request.

### Boundaries
- Only apply when the user's request is the generic phrase "run tool" (or a trivial variant) with **no specific tool identified**.
- Do **not** apply when the user names a specific tool, provides parameters, describes expected output, or indicates a follow-up correction or iteration.
- Do **not** extend this pattern to arbitrary "run" or "execute" requests that reference a known capability or tool by name.
- Do **not** reuse the pattern while the user is correcting or iterating on the request.

### Risks
- Derived from a single completed interaction; may not generalize to multi-turn or detailed run requests.
- No tool was actually executed in the source evidence; this skill only covers acknowledgment of a generic request.
