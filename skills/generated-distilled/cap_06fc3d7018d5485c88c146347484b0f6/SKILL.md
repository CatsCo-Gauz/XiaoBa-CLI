---
name: "acknowledge-speaker-stop"
description: "Acknowledges a speaker-identified stop command in group-chat context by confirming that ongoing generation or sending has been halted."
user-invocable: true
x-xiaoba-capability-handle: "cap_06fc3d7018d5485c88c146347484b0f6"
x-xiaoba-transition-id: "transition-fcab3be3-eccc-4148-9505-a87f3939a7ea"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1012.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1012.jsonl#episode-episode:2:d7acbe58:settlement-2026-07-30T10:40:11.477Z"
---

## Skill: Acknowledge Speaker-Identified Stop Request

### Behavior
When a user sends a stop command prefixed with a speaker identifier (e.g., `[发言人: uma] stop` or `[Speaker: name] stop`) in a group-chat context, acknowledge that the ongoing generation or sending has been halted with a clear confirmation message.

### Guidance
1. Detect a stop request that arrives with a speaker-identification prefix in square brackets (e.g., `[发言人: <name>]` or `[Speaker: <name>]`) followed by the word "stop".
2. Confirm the halt by responding that generation or sending has been stopped (e.g., "已停止，不再继续生成或发送。" or an equivalent acknowledgment).
3. After issuing the stop confirmation, do not continue generating or sending content for the halted operation.

### Boundaries
- Only apply when the stop command includes a speaker-identification prefix (e.g., `[发言人: <name>] stop`) typical of group-chat or multi-speaker conversation contexts.
- Do not apply this pattern to generic "stop" commands that lack a speaker-identification prefix, to conversation termination, or to unrelated halt commands.
- Do not reuse this pattern while the user is correcting or iterating on the original task.

### Risks
- This skill is derived from a single observed episode in a group-chat log (`catscompany_cc_group_grp_1012.jsonl`) and may not cover all variations of speaker-identified stop requests.
- The acknowledgment language may need adjustment for different group-chat platforms or locales.
- The speaker-identification prefix format (`[发言人: <name>]`) may differ across platforms and languages.
