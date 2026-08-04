---
name: "update-artifact-skill"
description: "Responds to a user request to update an Artifact Skill (proper noun) by confirming the version change in a structured confirmation message."
user-invocable: true
x-xiaoba-capability-handle: "cap_48b1eab915874f7dab258bcf0eac6d4c"
x-xiaoba-transition-id: "transition-98a69175-9eca-478f-beba-363be5f695a9"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1033.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1033.jsonl#episode-episode:1:0d2d436c:settlement-2026-07-29T09:44:59.405Z"
---

## Skill: update-artifact-skill

### Trigger
When a user requests to update an **Artifact Skill** (capitalized proper noun) to a newer version.

### Guidance
1. Identify from the user's request which Artifact Skill and target version are named.
2. Respond with a confirmation message stating the previous version and the new version, e.g. "Artifact Skill 已从 {previousVersion} 更新到 {newVersion}，当前为 latest。"

### Boundaries
- This skill is derived from a single completed interaction where the assistant stated an update from version 1.0.9 to 1.0.12 (marked latest). The observable interaction pattern is *request → confirmation*; no tool call, command, API invocation, or system interaction was evidenced.
- "Artifact Skill" is treated as a proper noun matching the evidence; do not generalize to arbitrary packages, modules, or reusable capabilities without additional evidence.
- Do not prescribe or attempt to execute an update operation — the underlying mechanism is not evidenced in this episode.
- Do not apply when the user is correcting or iterating on the same update task.
- The user identifier from the original episode should not be preserved in reusable guidance.

### Risks
- The assistant's confirmation is the sole settlement signal; no objective verification (system logs, version registry check, external confirmation) was provided that the update actually occurred.
- This skill is derived from one completed AgentTurn and may not generalize to other Artifact Skill versions, other artifact types, or other users.
