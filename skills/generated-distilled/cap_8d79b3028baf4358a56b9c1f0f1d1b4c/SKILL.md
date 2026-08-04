---
name: "do-not-restore-old-reply-on-clear"
description: "When a user indicates intent to clear old requests (清空前的旧请求), do not restore the associated old reply into the current history or context."
user-invocable: true
x-xiaoba-capability-handle: "cap_8d79b3028baf4358a56b9c1f0f1d1b4c"
x-xiaoba-transition-id: "transition-90cb5696-cbdd-4709-9ff4-fbc209509084"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#episode-episode:1:41f56763:settlement-2026-07-29T05:07:21.732Z"
---

# Preserve Clear Intent for Old Requests

## Trigger
When a user indicates an intent related to clearing old requests or mentions "清空前的旧请求" (old request before clearing), and the context involves not restoring prior replies into the current or new conversation history.

## Guidance
- When the user expresses intent to clear old requests, do **not** restore the old replies into the current history or context.
- The previous reply associated with the cleared-old-request should be excluded from any restoration or history-recovery operation.
- Honor the stated user preference that the old reply should not be brought back into the active history.

## Boundaries
- This guidance applies only when the user explicitly signals a clearing intent about old requests (as evidenced by the phrase "清空前的旧请求" and the confirmed action "这个旧回复不应恢复到历史里").
- Does not apply to general conversation resets, session restarts, or new topic initiation where no explicit reference to restoring old replies is made.
- Does not infer user intent about clearing or restoration when the user is merely iterating, correcting, or refining a current task.
- Limited to episodes where the user's old-reply-restoration preference is clearly stated or directly implied by the problem framing.

## Evidence
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#turn-1:assistant-response`
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#episode-episode:1:41f56763:settlement-2026-07-29T05:07:21.732Z`
