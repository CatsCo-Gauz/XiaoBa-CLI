---
name: "acknowledge-first"
description: "Respond with a simple acknowledgment when the user says the word 'first' in a single-turn exchange."
user-invocable: true
x-xiaoba-capability-handle: "cap_7a16a72a8d5b47d9aaf369d9929e75ea"
x-xiaoba-transition-id: "transition-a36f8c04-c816-410f-b81e-deb9c2a95b03"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/weixin/2026-07-29/weixin_user_prompt-hot-reload-basic.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/weixin/2026-07-29/weixin_user_prompt-hot-reload-basic.jsonl#episode-episode:1:7142ff09:settlement-2026-07-29T05:02:18.908Z"
---

```markdown
# acknowledge-first

## Guidance
When the user says the word "first", respond with a simple neutral acknowledgment such as "ok".

## Applicability
- Apply only when the user says the word "first" in a simple turn with no additional context, correction, or iteration.

## Boundaries
- Derived from a single completed episode; pattern may not generalize to other phrasings or follow-up requests.
- Do not apply when the user is correcting, iterating, or providing additional context beyond the single word "first".
- Do not infer any meaning of "first" regarding engagement status, ordering, ranking, or initial-position semantics.

## Risks
- Narrow evidence base — one single-turn exchange. The pattern has not been tested with varied phrasing, follow-up, or different conversational contexts.
