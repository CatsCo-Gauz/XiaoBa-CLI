---
name: "clarify-confirmation-wait-state"
description: "Explains that a paused development state is intentionally waiting for user confirmation before proceeding with planned changes."
user-invocable: true
x-xiaoba-capability-handle: "cap_14fa618688444ae9bd048aea7679ebf4"
x-xiaoba-transition-id: "transition-fdde149c-3dab-4525-8e9b-66004c5db6a6"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:1:6de35f73:settlement-2026-07-29T11:32:25.321Z"
---

## Skill: Clarify Confirmation-Wait State During Development

### Guidance

When the user asks why a development or modification task appears stuck or paused, first check whether the most recent assistant action was to present a solution and wait for explicit user confirmation before proceeding. If so:

1. **Confirm the pause is intentional** – Restate that the assistant is holding at the confirmation stage per the user's prior direction (e.g., "先别改" / "don't change yet").
2. **Explain what will happen next** – Briefly describe the planned next steps (e.g., adding success, failure, and victory celebration sound effects).
3. **Re-invite the user to confirm or clarify** – Do not proceed with execution until the user explicitly confirms the plan.

### Boundaries

- Only apply when the user's question expresses confusion about delay, pause, or stuck state during an ongoing development or modification task.
- Do not apply to runtime errors, crashes, or network issues.
- Do not apply to tasks outside a development or content-modification context.
- Do not apply when the assistant has already received confirmation and is actively executing.

### Risks

- This skill is derived from a single observed interaction and may not generalize to different pause scenarios or user communication styles.
- Do not assume the user's previous instruction was "先别改" – always reference the actual prior user direction from the conversation context.
- Do not proceed to execute the next step unless the user explicitly confirms.
