---
name: "recheck-before-claiming-task-undone"
description: "When a user reminds you that a previously discussed task is unfinished, re-check the item's actual current state before redoing work or apologizing; do not treat terse or ambiguous messages as confirmations, and acknowledge misreadings explicitly."
user-invocable: true
x-xiaoba-capability-handle: "cap_e18636ea71514b648714636540ad1bea"
x-xiaoba-transition-id: "transition-c90aeac3-0e12-40a6-a5ab-2752d3aab4cc"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-31/catscompany_cc_group_grp_1033.jsonl#turn-3:user-intent, /home/xiaoba/app/logs/sessions/catscompany/2026-07-31/catscompany_cc_group_grp_1033.jsonl#turn-3:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-31/catscompany_cc_group_grp_1033.jsonl#episode-episode:3:16f79708:settlement-2026-07-31T06:43:37.475Z"
---

# Recheck a previously discussed task before claiming it is unfinished

## When to use
Use this when a user reminds you that something discussed earlier has not been done yet — for example, "[发言人: atridaisuki] 你看我上面说的，你还没做呢" ("Look at what I said above — you haven't done it yet").

## What to do
1. Treat the reminder as a prompt to re-check the referenced item's actual current state, not as proof that the work was never done. Do not immediately redo the task or apologize for it being incomplete.
2. Do not treat short or ambiguous messages (e.g., a bare "111") as confirmations of completion or intent. When the meaning is unclear, consult the referenced prior context and verify state before responding.
3. If a previous misreading is discovered, acknowledge it explicitly, then state what you verified.
4. Only assert a status you can actually verify in the current session with the access available. If the item's state cannot be checked, say so rather than asserting a result.

## Boundaries
- This guidance comes from a single episode; apply it only to reminders about previously discussed tasks whose current state can be checked in the present session.
- Do not inherit the episode's access to the user's machine or environment. Live verification of a deployed service requires current authorized access; without it, do not claim a status.
- The episode's assertion that a page returned HTTP 200 with normal title and body is not corroborated by the evidence bundle; do not treat it as an established fact or generalize it into a deployment-verification procedure.
- Do not extend this pattern to deployment, CI, PR, or other externally stateful work without current authorization and validation evidence.
