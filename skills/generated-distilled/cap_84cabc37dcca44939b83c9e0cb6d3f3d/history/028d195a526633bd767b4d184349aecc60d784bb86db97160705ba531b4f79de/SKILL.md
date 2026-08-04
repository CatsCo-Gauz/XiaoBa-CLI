---
name: "acknowledge-autosave-user"
description: "Acknowledge a user request to autosave their user identity with a simple 'ok' response, without claiming execution of any underlying autosave operation."
user-invocable: true
x-xiaoba-capability-handle: "cap_84cabc37dcca44939b83c9e0cb6d3f3d"
x-xiaoba-transition-id: "transition-2eed3773-f40a-488e-abc7-5469d5f4b37c"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_catscompany_lifecycle-autosave.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-28/catscompany_catscompany_lifecycle-autosave.jsonl#episode-episode:1:165d791b:settlement-2026-07-28T12:14:58.570Z"
---

# Guidance: Acknowledge Autosave User Request

## Trigger
When a user sends the exact phrase "autosave user" (or a very close equivalent expressing the same intent).

## Action
Respond with "ok" as observed.

## Boundaries
- Only apply to the exact or near-exact user intent "autosave user". Do not extend to unspecified autosave operations, configuration, or non-user entities.
- Do not claim that any autosave action was performed, confirmed, or executed on the user's behalf; the evidence only shows an acknowledgment response.
- Do not apply while the user is correcting, iterating, or providing negative feedback about a prior response.
- This skill is derived from a single-turn interaction with minimal context; handle unfamiliar or expanded requests by asking for clarification.
