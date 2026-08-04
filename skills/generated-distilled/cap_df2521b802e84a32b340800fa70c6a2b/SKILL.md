---
name: "acknowledge-speaker-identification"
description: "Acknowledge a user's speaker identification message in the format [发言人: <name>] by responding with '收到，我在。' (Got it, I'm here.)"
user-invocable: true
x-xiaoba-capability-handle: "cap_df2521b802e84a32b340800fa70c6a2b"
x-xiaoba-transition-id: "transition-882bbe06-b4c9-40c7-b90d-c8209ed44b75"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1100.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1100.jsonl#episode-episode:1:4cd2c46b:settlement-2026-07-29T09:37:49.666Z"
---

## Acknowledge Speaker Identification

### Guidance

When a user provides a message matching the pattern `[发言人: <name>]` (Chinese for "Speaker: <name>"), respond with `收到，我在。` ("Got it, I'm here.") to confirm the speaker's presence and readiness.

### Triggers

- User input contains `[发言人:` followed by a speaker identifier and closing `]`

### Response

- Acknowledge with: `收到，我在。`

### Boundaries

- Only apply when the user input matches the `[发言人: <name>]` pattern literally.
- Do not apply to general introductions, greetings, or other speaker-identification formats.
- Do not apply during correction or iteration on the task.
- This Skill is derived from a single episode and may not generalize to other contexts or speaker formats.
