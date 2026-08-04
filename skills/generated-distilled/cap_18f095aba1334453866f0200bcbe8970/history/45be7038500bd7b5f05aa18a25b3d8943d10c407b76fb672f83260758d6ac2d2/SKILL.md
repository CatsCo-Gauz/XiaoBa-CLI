---
name: "run-tool"
description: "Acknowledge a generic 'run tool' request. The evidence supports only the trigger 'run tool' and the acknowledgment response 'done'; no specific tool, parameters, or execution behavior is evidenced."
user-invocable: true
x-xiaoba-capability-handle: "cap_18f095aba1334453866f0200bcbe8970"
x-xiaoba-transition-id: "transition-9ecf1765-4db5-49d3-a72f-e56795ff4ea5"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/chat/2026-07-28/chat_cc_group_demo.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/chat/2026-07-28/chat_cc_group_demo.jsonl#episode-episode:1:30739680:settlement-2026-07-28T07:36:08.261Z"
---

## Skill: run-tool

### Guidance

When the user expresses the intent to "run tool" (a generic request to execute a tool), acknowledge the request. Do not assume any specific tool, parameters, configuration, or execution environment beyond what the user explicitly states. This skill covers only the acknowledgment of the request; actual tool execution, selection, or configuration is not evidenced here and must not be inferred.

### Trigger

The user expresses an intent to run a tool, e.g., "run tool" or similar phrasing.

### Action

Acknowledge the request. No tool-specific execution, configuration, or output handling is evidenced or supported.

### Boundaries

- Does not cover selection of a specific tool.
- Does not cover tool parameters, arguments, or configuration.
- Does not cover execution environment setup.
- Does not cover error handling or output processing.
- Only apply when the request is a generic "run tool" intent with no additional specifics.
- Do not reuse while the user is correcting or iterating on the task.
