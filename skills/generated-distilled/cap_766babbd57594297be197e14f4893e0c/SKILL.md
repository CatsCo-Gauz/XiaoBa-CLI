---
name: "clear-old-requests-no-restore"
description: "When a user requests to clear old requests (清空前的旧请求), ensure that the old reply is not restored to conversation history."
user-invocable: true
x-xiaoba-capability-handle: "cap_766babbd57594297be197e14f4893e0c"
x-xiaoba-transition-id: "transition-3ab0b9c6-114f-40ba-a1de-75500a991ec1"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#episode-episode:1:ca26a5aa:settlement-2026-07-29T12:37:08.945Z"
---

# Skill: Clear Old Requests — Do Not Restore Old Replies

## Problem
When a user requests "清空前的旧请求" (clear the old request), previously delivered old replies must not be restored to the conversation history.

## Guidance
Upon receiving a user request to clear old requests (清空前的旧请求):
1. Identify the old reply that the user refers to.
2. Ensure that old reply is **not** restored to the conversation history.
3. Complete the clearing operation without reintroducing the old reply into history.

## Boundaries
- This skill applies only when the user's explicit intent matches "清空前的旧请求" (clear an old request) and the context involves preventing an old reply from reappearing in history.
- Does not apply to general conversation clearing, message deletion, or unrelated history management tasks.
- Does not apply while the user is correcting or iterating on the same task.

## Risks
- Derived from a single completed AgentTurn and may not generalize to different clearing scenarios.
- The "old reply" must be identifiable from the immediate conversation context; the skill does not define how to locate it in arbitrary histories.
