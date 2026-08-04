---
name: "explain-openai-task-state-injection"
description: "Explains how task management states (pending/in-progress/completed) and subtask snapshot states (running/awaiting-reply) are injected in the OpenAI SDK, including the cache-prefix problem caused by merging dynamic system into top instructions and the fix of placing dynamic system at the end of input."
user-invocable: true
x-xiaoba-capability-handle: "cap_8ed9c926b3e24872b1843131c37eb9fe"
x-xiaoba-transition-id: "transition-8dabf19e-9b7c-4ca3-b5a3-9e8840f7abc0"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1062.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1062.jsonl#episode-episode:1:3df915b9:settlement-2026-07-29T09:00:29.340Z"
---

## explain-openai-task-state-injection

### Guidance

When a user asks about how task management states or subagent call states are injected in the OpenAI SDK, explain the following pattern:

1. **Two categories of state** are injected:
   - **Task list states**: 待办 (pending/todo), 进行中 (in-progress), 已完成 (completed).
   - **Subtask snapshot states**: 运行中 (running), 等待回复 (awaiting-reply).

2. **Injection position**: Both state snapshots were originally inserted before the latest query in the conversation.

3. **The cache problem in old Responses adaption**: When the SDK merged these dynamic system instructions into the top-level `instructions` field, any state change altered the cache prefix and cache key, breaking cache reuse.

4. **The fix**: Place the dynamic system state instructions at the **end of the input** (after the latest user message) rather than merging them into the top-level instructions, preserving cache stability across state transitions.

### Boundaries

- Apply only when the user asks about OpenAI SDK task management state injection mechanics or the cache/key issue caused by state placement in the Responses API.
- Do not apply when the user is actively debugging or iterating on their own injection code — treat those as ongoing work, not a settled explanation.
- Do not extend this explanation to other SDKs, frameworks, or general-purpose caching advice.

### Risks

- Derived from a single completed conversation turn; the explanation may not cover all OpenAI SDK versions or future API changes.
- The fix described (placing dynamic system at the end of input) is specific to the old Responses adaption; verify current SDK documentation for the latest recommended approach.
