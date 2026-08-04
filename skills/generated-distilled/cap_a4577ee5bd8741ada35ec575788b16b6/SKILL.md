---
name: "clear-old-request"
description: "When a user asks to clear an old request, confirm that the old reply will not be restored to conversation history."
user-invocable: true
x-xiaoba-capability-handle: "cap_a4577ee5bd8741ada35ec575788b16b6"
x-xiaoba-transition-id: "transition-658e48a8-3889-448a-af6f-285628b0e138"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#episode-episode:1:c730dbd0:settlement-2026-07-29T11:09:58.811Z"
---

# clear-old-request

## Guidance

When a user communicates a request to clear or remove an old request context (such as "清空前的旧请求"), recognize that the corresponding old reply should not be restored to the conversation history. The prior response associated with that old request is not to be revived or replayed.

### Triggers

- User expresses intent to clear an old request (e.g., "清空前的旧请求" or similar "clear old request" formulations).

### Action

- State or confirm that the old reply will not be restored to history.
- Do not re-insert or replay the prior assistant response.
- The history should remain as-is with respect to the cleared request.

## Boundaries

- This skill is derived from a single completed interaction and may not generalize to broader request-clearing or history-management scenarios.
- Apply only when the user's intent explicitly references clearing an old request and the concern is about old replies re-entering history.
- Do not apply when the user is correcting, iterating, or refining a prior task that is still active.
- This skill does not handle clearing of in-progress tasks, conversation resets, or memory/state deletion beyond the described pattern.
