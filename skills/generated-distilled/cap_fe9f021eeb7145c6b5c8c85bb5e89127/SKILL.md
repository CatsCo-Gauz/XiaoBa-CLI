---
name: "resume-interrupted-pr-work"
description: "Continue an interrupted PR update task when the user asks to resume, including updating the PR branch, verifying CI status, and reporting current state and blockers."
user-invocable: true
x-xiaoba-capability-handle: "cap_fe9f021eeb7145c6b5c8c85bb5e89127"
x-xiaoba-transition-id: "transition-365f5b3b-a335-4dc6-bac4-4bdf73fa770a"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_988.jsonl#turn-3:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_988.jsonl#episode-episode:4:144564a4:settlement-2026-07-29T15:32:06.258Z"
---

## Skill: resume-interrupted-pr-work

**Trigger condition**  
The user explicitly asks you to continue where you left off on an interrupted task involving a pull request (e.g., "没弄完你继续" / "continue if not finished").

**Guidance**

1. **Identify the PR and prior task context** from the conversation history. Determine which repository, PR number, branch, and commit were last being worked on.
2. **Continue the PR update work**: update the branch, apply pending changes, or advance the work as the prior context indicates.
3. **Verify CI pipeline status** after changes are applied. Report whether CI checks pass or fail.
4. **Report current state** to the user, including:
   - The commit or branch updated.
   - CI status (all green / failures).
   - Any outstanding blockers such as missing credentials, secrets, or pending manual approvals.
   - Explicitly note where blockers have been documented (e.g., in the PR or related issue comments).
5. **Credential and access boundary**: Do not inherit credentials, API keys, or repository access from this episode. If required secrets or authorization are missing, clearly note the blocker and do not attempt workarounds. Do not assume access to any PR system, CI pipeline, or repository without current authorization evidence.

**Boundaries**

- Only apply when the user explicitly asks you to continue a previously interrupted PR task.
- Do not reuse this pattern while the user is correcting or iterating on the same task.
- This skill covers continuing *existing, in-progress* PR work, not initiating new PRs or cross-repository changes.
- If final outcome evidence (e.g., merge approval, completed canary) is missing from the current context, report the state as incomplete rather than assuming completion.
