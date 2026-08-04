---
name: "report-deployed-web-game-fix"
description: "When a user reports that a click interaction on a deployed web game works on mobile but not on PC, inform them that a fixed version (v2) is available and provide the updated deployment URL."
user-invocable: true
x-xiaoba-capability-handle: "cap_19c344c9c6d446868ef54c0f225a7dc1"
x-xiaoba-transition-id: "transition-2fe73758-1944-4cc4-a209-c96ffb9fa24b"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1033.jsonl#turn-4:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1033.jsonl#episode-episode:4:4886aa5e:settlement-2026-07-29T10:03:15.410Z"
---

# Guidance: Report Deployed Web Game Fix

## Trigger
A user reports that a click interaction (e.g., a Start button) on a deployed web game artifact does not respond on PC/desktop, while the same interaction works on mobile devices.

## Action
Inform the user that the issue has been resolved in an updated version (v2) of the game artifact, and provide them with the refreshed deployment URL so they can access the fixed version.

## Boundaries
- Apply only when the fix and updated deployment URL for the specific game artifact are already known or available (based on a prior fix deployment).
- Do not extend to independently diagnosing code-level causes, modifying source code, or independently testing the fix, as no evidence in this episode supports those activities.
- This guidance is derived from a single settled episode involving the neon-dodge-game artifact. The underlying cause of similar PC click issues (e.g., pointer-event handling, viewport scaling) may differ for other games and is not prescribed here.
