---
name: "next-turn"
description: "Acknowledge a 'next turn' signal with a simple 'done' response. Narrowly scoped to single-turn advancement without additional action or state change."
user-invocable: true
x-xiaoba-capability-handle: "cap_9f512be549ad42b08f4eff77d91de7ae"
x-xiaoba-transition-id: "transition-5f9cbead-0845-4883-8c4e-85ca8dcbe262"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/weixin/2026-07-29/weixin_user_prompt-hot-reload-tool-loop.jsonl#turn-2:assistant-response, /home/xiaoba/app/logs/sessions/weixin/2026-07-29/weixin_user_prompt-hot-reload-tool-loop.jsonl#episode-episode:2:3e4de1f1:settlement-2026-07-29T05:02:19.094Z"
---

## Skill: next-turn

### Guidance

When the user signals "next turn" (a request to advance to the next step, item, or phase), respond with a simple acknowledgment: "done". Do not infer any additional action, processing, or state changes beyond this acknowledgment.

### Applicability

Apply this skill only when the user's input is recognizably "next turn" (or an unambiguous synonym such as "next" or "proceed to next turn") and no correction or iteration is in progress.

### Boundaries

- Do not apply while the user is correcting or iterating on a prior task.
- Do not extend this pattern to multi-turn workflows, stateful progression, or tool invocations.
- This skill is derived from a single observed turn and may not generalize beyond similar simple advancement signals.
- Do not reuse if the user expects a substantive action (e.g., advancing a game, moving to the next item in a list, or triggering a workflow step).

### Evidence

- `/home/xiaoba/app/logs/sessions/weixin/2026-07-29/weixin_user_prompt-hot-reload-tool-loop.jsonl#turn-2:assistant-response`
- `/home/xiaoba/app/logs/sessions/weixin/2026-07-29/weixin_user_prompt-hot-reload-tool-loop.jsonl#episode-episode:2:3e4de1f1:settlement-2026-07-29T05:02:19.094Z`
