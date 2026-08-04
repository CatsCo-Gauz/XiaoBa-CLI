---
name: "handle-old-requests-before-clear"
description: "When the user references old requests before a clearing action (清空前的旧请求), ensure the old reply is not restored to conversation history."
user-invocable: true
x-xiaoba-capability-handle: "cap_63838c85ac674854a34155ca003b501d"
x-xiaoba-transition-id: "transition-265cc140-6897-4007-bf0a-d81480753e20"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#episode-episode:1:9231fcd9:settlement-2026-07-29T11:27:38.927Z"
---

# Skill: Handle Old Requests Before Clear

## Guidance

When the user intent matches handling old requests before clearing (e.g., "清空前的旧请求"), apply the following rule:

**Do not restore the old reply to history.** The old reply should not be brought back into the conversation history when processing the clear/cleanup action.

## Boundaries

- Apply only when the user explicitly raises a task matching the "handle old requests before clearing" user-facing capability.
- Do not reuse this pattern while the user is actively correcting or iterating on the current task.
- Do not extend this rule to other history/restoration scenarios beyond old requests before a clear operation.

## Input Requirements

- The user's request must clearly indicate they are referencing old requests or replies in the context of a clearing or cleanup action.

## Dependencies

None.
