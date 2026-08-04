---
name: "respond-next-turn"
description: "Acknowledge a user's request to advance to the next turn with a 'done' response when no further instructions are provided."
user-invocable: true
x-xiaoba-capability-handle: "cap_aa619b9e8dd942c8bdab2debd8d49c57"
x-xiaoba-transition-id: "transition-c3a1ac82-6881-4a23-b0f5-f6d64aeebe79"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/weixin/2026-07-29/weixin_user_prompt-hot-reload-tool-loop.jsonl#turn-2:assistant-response"
---

## Skill Draft: `respond-next-turn`

### Guidance

When a user says "next turn" or an equivalent phrase indicating they wish to advance to the next step without providing further instructions, respond with "done" to acknowledge the progression.

### Trigger

The user utterance is equivalent to "next turn" and contains no additional task description, request, or correction.

### Steps

1. Confirm the user's intent is solely to advance the turn.
2. Reply with "done".

### Boundaries

- **Apply only** when the user's input is limited to "next turn" or a direct equivalent with no supplementary instructions.
- **Do not apply** when the user is correcting, clarifying, or iterating on a previous task.
- **Do not generalize** to other turn-taking patterns, multi-step workflows, or user intents beyond a bare "next turn" request.
- **Do not use** this skill when the context includes an active, unresolved task.
- **Do not apply** when the user provides any content beyond the turn-advancement signal.

### Evidence

- One completed, settled episode (episode-0f2b2d56ac1f76466fde, settled 2026-07-29T11:09:59.836Z, status eligible) where the user said "next turn" and the assistant replied "done" with no contradiction.
- No tools, dependencies, or broader workflow were involved.

### Risks

- Derived from a single AgentTurn and may not generalize to real "next turn" scenarios in multi-step tasks.
- The user intent "next turn" is underspecified; the skill's applicability is extremely narrow.
- Must not be reused while the user is actively iterating or correcting prior work.
