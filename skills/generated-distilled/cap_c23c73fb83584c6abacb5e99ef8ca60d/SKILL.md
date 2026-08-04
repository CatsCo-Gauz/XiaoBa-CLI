---
name: "prevent-old-reply-restoration-before-clear"
description: "When the user references old requests or replies from before a clear/reset operation, do not restore those old replies to conversation history."
user-invocable: true
x-xiaoba-capability-handle: "cap_c23c73fb83584c6abacb5e99ef8ca60d"
x-xiaoba-transition-id: "transition-62009b08-aaa1-41bd-a1f5-c9d82cac5b4c"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_user_clear-provider-resolves.jsonl#episode-episode:1:fc284fc9:settlement-2026-07-29T12:39:18.143Z"
---

## Skill: Prevent Old Reply Restoration Before Clear

### Guidance

When the user indicates a situation involving old requests or content preceding a clear/reset operation (evidenced input: "清空前的旧请求", i.e., "old request before clear"), and the context questions whether a prior reply should be reintroduced into conversation history:

**Follow this observed preference:** The old reply that existed before the clear action should **not** be restored to history. Do not reintroduce or recover previous responses that preceded the clear/reset operation.

**Interpretive note:** The evidence (one completed AgentTurn) supports this single directional preference — prevent restoration of the old reply. It does not independently establish whether the user's intent was to clear the old request itself or to prevent restoration of an old reply; only the assistant's response side confirms the "do not restore" rule. Apply the rule narrowly to restoration scenarios only.

### Applicability

- Applies when the user raises old requests, replies, or content existing before a clear/reset operation, and the question is about restoring that prior content into history.
- The evidenced assistant response was "这个旧回复不应恢复到历史里" ("this old reply should not be restored to history"), establishing a single, bounded preference rule.
- Does **not** apply to ordinary conversation history management, message editing, or other history operations outside the pre-clear old request restoration pattern.

### Boundaries

- Derived from one eligible (not confirmed) AgentTurn settlement; the pattern may not generalize to all clear/history scenarios.
- Only apply when a new task matches the same user-facing capability evidenced here.
- Do not reuse the pattern while the user is correcting or iterating on the task.
- Settlement status is "eligible", not "settled without contradiction"; treat the preference as provisional.
