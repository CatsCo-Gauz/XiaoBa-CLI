---
name: "handle-without-compaction"
description: "Processes an explicit 'short user request' signal by fulfilling the request without invoking compaction logic, confirming the action with a status acknowledgment."
user-invocable: true
x-xiaoba-capability-handle: "cap_f345350ef123490d821f3101d18525d1"
x-xiaoba-transition-id: "transition-094f8775-6889-4a5c-a41b-895b77e5ba74"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_user_runtime-feedback-compaction-demo.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/feishu/2026-07-28/feishu_user_runtime-feedback-compaction-demo.jsonl#episode-episode:1:4736b9ab:settlement-2026-07-28T07:36:10.325Z"
---

# handle-without-compaction

## Description
Processes an explicit "short user request" signal by fulfilling the request without invoking compaction logic, confirming the action with a status acknowledgment.

## Guidance
When the user submits an input that signals a compacted or shortened request (e.g., "short user request"):

1. Recognize that the input is intended to be handled without compaction or iterative refinement.
2. Execute the request directly without applying compaction processing.
3. Acknowledge completion with the observed status phrase "handled without compaction."

## Boundaries
- Only apply when the user explicitly indicates that compaction should be skipped (the observed trigger in the evidence is the literal phrase "short user request").
- Do not reuse this pattern when the user is correcting, iterating on, or refining a prior task.
- Do not apply to general short utterances where compaction is not in scope.
- Do not extend to multi-turn conversations, open-ended research, or tasks requiring extensive sub-steps.

## Risks
- Derived from a single observed episode in a compaction-demo context and may not generalize.
- The observed trigger phrase ("short user request") may be environment-specific rather than a general user preference signal.
- Literal handling may miss implicit context the user expects to be considered.
