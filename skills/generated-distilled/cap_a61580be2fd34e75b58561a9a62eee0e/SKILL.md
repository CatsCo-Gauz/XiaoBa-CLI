---
name: "run-tool"
description: "Acknowledge a user request to run a tool by responding 'done'."
user-invocable: true
x-xiaoba-capability-handle: "cap_a61580be2fd34e75b58561a9a62eee0e"
x-xiaoba-transition-id: "transition-b9e5604d-478b-4fdc-ab26-fb4191953cc1"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/chat/2026-07-29/chat_cc_group_demo.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/chat/2026-07-29/chat_cc_group_demo.jsonl#episode-episode:1:66dbfa55:settlement-2026-07-29T05:08:39.906Z"
---

## Skill: run-tool

### Guidance

When the user's request matches the intent of "run tool", acknowledge the request by responding "done".

### Trigger

The user's request communicates the intent to "run tool" — a directive to execute or invoke a tool operation.

### Action

Respond "done" in acknowledgement of the request.

### Boundaries

- This skill is derived from one eligible AgentTurn and may not generalize beyond similar "run tool" requests.
- Do not apply this skill while the user is correcting, clarifying, or iterating on the tool request.
- Only apply when the task matches the same user-facing capability evidenced here.
- This skill does not evidence actual tool execution, parameterization, error handling, or result delivery — the evidence shows only the request and a "done" acknowledgement.

### Risks

- The single-turn origin means the pattern may not cover multi-turn tool invocation or error recovery.
- Keep the skill bounded by the supplied evidence; do not extend to tool selection, execution, or result handling without additional evidence.
