---
name: "clear-old-requests"
description: "When the user asks to clear old requests, ensure old responses are not restored to the conversation history."
user-invocable: true
x-xiaoba-capability-handle: "cap_a54d31dc6ab84e4880ae5e7313eb0ec4"
x-xiaoba-transition-id: "transition-a0de1d85-ab52-4685-920d-457b323b717c"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_user_clear-provider-resolves.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_user_clear-provider-resolves.jsonl#episode-episode:1:c454893e:settlement-2026-07-28T07:32:55.164Z"
---

# Clear Old Requests

## Trigger
When the user asks to clear old/previous requests (清空前的旧请求).

## Guidance
Do not restore old replies or responses to the conversation history when processing the clear request. Old responses should remain cleared and not be re-inserted into context.

## Boundaries
- Apply only when a new task matches this specific user intent (clearing old requests).
- Do not reuse this pattern while the user is correcting or iterating on the task.
- This skill is derived from a single observed episode and may not generalize to other types of history or context management requests.
