---
name: "acknowledge-second"
description: "Acknowledge a user input of 'second' with a simple confirmation response ('ok')."
user-invocable: true
x-xiaoba-capability-handle: "cap_5c18bf05462c4e1895cbcf0de10feb29"
x-xiaoba-transition-id: "transition-03111555-71f5-4a60-8dec-5b828b34a5e2"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/weixin/2026-07-29/weixin_user_prompt-hot-reload-basic.jsonl#turn-2:assistant-response, /home/xiaoba/app/logs/sessions/weixin/2026-07-29/weixin_user_prompt-hot-reload-basic.jsonl#episode-episode:2:557dd39a:settlement-2026-07-29T05:05:16.674Z"
---

## Skill: acknowledge-second

### Purpose
Acknowledge a user input of "second" with a simple confirmation response ("ok").

### Trigger
The user provides the exact input "second" (or the observed equivalent task reference).

### Guidance
1. When the user states "second", respond with a concise acknowledgment ("ok").
2. Do not extend this pattern to unrelated inputs or multi-step workflows without new evidence.
3. This skill is narrow: it covers only the observed single-turn exchange and should not be generalized beyond matching user-facing intent for "second".

### Boundaries
- Only apply when the user's expressed intent matches the observed "second" pattern from the evidence.
- Do not reuse this pattern while the user is correcting or iterating on the task.
- Derived from one completed AgentTurn; may not generalize to other contexts.

### Dependencies
- None evidenced.
