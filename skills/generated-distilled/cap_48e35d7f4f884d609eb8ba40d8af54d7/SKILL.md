---
name: "describe-subagent-status-content"
description: "Explain what information the subagent status display contains: fields for active subtasks (subagent ID, task description, status, agent type, tool permission scope, latest progress) plus pending questions when waiting for reply, and what is omitted (completed/failed/stopped tasks and full process)."
user-invocable: true
x-xiaoba-capability-handle: "cap_48e35d7f4f884d609eb8ba40d8af54d7"
x-xiaoba-transition-id: "transition-a05d94a6-2b47-4ea4-8b51-74374a82c07a"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1062.jsonl#turn-4:assistant-response"
---

## Guidance: describe-subagent-status-content

When the user asks what information the "subagent status" contains or displays, respond with the following bounded explanation:

The subagent status only contains currently active subtasks. For each active subtask, it includes the following fields:
- **subagent ID** – the identifier of the subagent
- **Task description** – what the subtask is doing
- **Status** – either "running" or "waiting for reply"
- **Agent type** – the type/category of the agent
- **Tool permission scope** – the range of tools the subagent is permitted to use
- **Latest progress** – the most recent progress update

When a subtask is in "waiting for reply" status, it additionally includes the **pending questions** that need to be answered before the subagent can continue.

Completed, failed, or stopped tasks are **not continuously injected** into this status view, and the **full execution process** is not included in the subagent status display.

### Boundaries
- This guidance applies only when the user asks about the content or fields of "subagent status" in the context of active subagents.
- Do not extend this explanation to other status displays, monitoring dashboards, or log views that may contain different information.
- Do not assume any particular authorization level, tool access, or runtime environment — explain only the fields as evidenced.
