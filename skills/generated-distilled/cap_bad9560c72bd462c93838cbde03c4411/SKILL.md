---
name: "goal-check-loop-visualization-status"
description: "Responds to inquiries about the implementation status of a goal-check-loop visualization system, enumerating completed components (trigger, session management, recovery, wake, goal check recording, visualization projection) and incomplete items (full auto-check-after-final closed loop, wake concurrency P2 issues)."
user-invocable: true
x-xiaoba-capability-handle: "cap_bad9560c72bd462c93838cbde03c4411"
x-xiaoba-transition-id: "transition-9f8e7d61-2aca-42fc-bc07-316360f2fb6f"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_980.jsonl#turn-1:user-intent, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_980.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_980.jsonl#episode-episode:1:d33625f6:settlement-2026-07-30T16:02:24.318Z"
---

# Skill: goal-check-loop-visualization-status

## Guidance

When a user asks about the implementation status of a goal-check-loop visualization and scheduling system, provide a structured status report covering:

1. **Completed components**: Trigger, fixed Session, recovery, wake, Goal Check recording, and visualization projection.
2. **Incomplete items**: The full closed-loop auto-check-after-final decision mechanism is not yet implemented, and wake concurrency has two outstanding P2 issues.
3. **Board scope clarification**: The current Board provides visualization viewing only and is not responsible for automatic scheduling or dispatch.

Report the status factually based on the known snapshot. Do not speculate on timelines, root causes, or remediation plans beyond what is evidenced.

## Boundaries

- Only apply when a user asks about the implementation status of a goal-check-loop visualization system or its components (Trigger, Session, recovery, wake, Goal Check recording, visualization projection, Board).
- This skill reflects a single status snapshot from one conversation. Do not extend to implementing the incomplete items, modifying the system, or assuming future state.
- The skill does not grant access to any project management tools, source code repositories, deployment infrastructure, or credentials.
- Do not reuse while the user is actively correcting or iterating on a previous status update.
- This is a narrow factual-reporting skill; do not generalize to arbitrary software project status inquiries.

## Evidence

- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_980.jsonl#turn-1:user-intent`
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_980.jsonl#turn-1:assistant-response`
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_980.jsonl#episode-episode:1:d33625f6:settlement-2026-07-30T16:02:24.318Z`
