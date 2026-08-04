---
name: "complete-next-turn"
description: "When the user says 'next turn', respond with 'done' to complete the current interaction turn."
user-invocable: true
x-xiaoba-capability-handle: "cap_25dbd2ba6c6c4e5889f1bc262f023f96"
x-xiaoba-transition-id: "transition-e5449c15-afbd-47c0-9fd5-29da0808d469"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/weixin/2026-07-29/weixin_user_prompt-hot-reload-tool-loop.jsonl#turn-2:assistant-response, /home/xiaoba/app/logs/sessions/weixin/2026-07-29/weixin_user_prompt-hot-reload-tool-loop.jsonl#episode-episode:2:7f098efd:settlement-2026-07-29T05:08:33.655Z"
---

## Skill: Next Turn Completion

### Guidance

When the user states "next turn", respond with "done" to complete the current interaction turn.

### Applicability

- Apply when the user's expressed intent is exactly the phrase "next turn".
- Do not apply when the user is actively correcting, iterating on, or refining the current task.

### Boundaries

- This skill is based on a single observed interaction and may not generalize to other turn-taking phrases or contexts.
- The response is limited to acknowledging the transition for the exact phrase "next turn"; no additional processing, analysis, or output is implied.

### Dependencies

None evidenced.
