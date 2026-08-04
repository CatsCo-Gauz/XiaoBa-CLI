---
name: "qing-kong-qian-de-jiu-qing-qiu"
description: "When the user says '清空前的旧请求' (clear the old request from before), do not restore the associated old reply into conversation history."
user-invocable: true
x-xiaoba-capability-handle: "cap_74f23ce670a6491da9a80cfcc75d3c92"
x-xiaoba-transition-id: "transition-f3af0671-193c-4ea3-b7eb-831b177c52df"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#episode-episode:1:9a542dbb:settlement-2026-07-29T05:01:14.443Z"
---

## Skill: 清空前的旧请求 — Do Not Restore Old Reply

### Trigger
When the user issue is the exact phrase **"清空前的旧请求"** (clear the old request from before), indicating a prior request should be discarded.

### Action
Do **not** restore or replay the old reply associated with the discarded prior request into the conversation history. The old response ("这个旧回复") should be treated as irrelevant and excluded from the active context.

### Boundaries
- This skill applies only when the user's trigger matches the exact evidenced phrase: **"清空前的旧请求"**.
- It does not apply to general "clear", "discard", "ignore", or "old request" wording in other languages or phrasings.
- It does not authorize modifying, deleting, or replaying any other historical messages beyond the old reply tied to that specific cleared request.

### Evidence
- User utterance: "清空前的旧请求" (source: `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#turn-1:assistant-response`)
- Assistant response: "这个旧回复不应恢复到历史里" (same source)
- Settlement at 2026-07-29T05:01:14.443Z with no contradiction (source: `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#episode-episode:1:9a542dbb:settlement-2026-07-29T05:01:14.443Z`)
- Learned preference: the old reply should not be restored to history.
