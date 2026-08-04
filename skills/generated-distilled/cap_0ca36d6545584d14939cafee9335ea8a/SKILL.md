---
name: "report-code-completion-status"
description: "When the user provides a name/user-ID reference for code processing work, generate a structured completion status report covering processing status, independent review, applied fixes, verification results, and version control state. This is a reporting-only skill, not a code-execution workflow."
user-invocable: true
x-xiaoba-capability-handle: "cap_0ca36d6545584d14939cafee9335ea8a"
x-xiaoba-transition-id: "transition-b87ff16c-c13b-4310-8183-afef8b566b31"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1125.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1125.jsonl#episode-episode:2:94f57170:settlement-2026-07-30T09:03:20.750Z"
---

## Skill: Report Code Processing Completion Status

### Guidance

When the user provides a name-and-user-ID reference matching the pattern `[发言人: Name] @UserID` (e.g., `[发言人: 布鲁斯] @usr535`) and the context involves prior code processing or fix work, generate a structured completion status report that covers:

1. **Processing status** – Confirm whether prior processing has been completed.
2. **Independent review status** – State whether a review found any remaining blockers.
3. **Applied fixes (if any)** – List the specific corrections that were applied (e.g., attachment deduplication normalization, image directory boundary corrections, token expiry validation).
4. **Verification results** – Report directed test count, full test suite count, production build status, and diff/consistency check status.
5. **Version control state** – Note whether the work has been committed, branched, or pushed as a PR.

Report the information as a summary of already-completed work. Do not re-execute fixes, rerun tests, or attempt to recreate prior processing steps.

### Boundaries

- Only apply when the user message matches the `[发言人: Name] @UserID` reference pattern and the surrounding conversation indicates prior code-processing work.
- This skill covers **reporting** on previously completed work only. It does not describe how to apply fixes, run tests, create builds, or perform git operations.
- The specific fix categories listed (attachment deduplication, image directory boundaries, token expiry validation) are drawn from a single episode and may not be exhaustive across all invocations.
- Test counts and build outcomes are episode-specific and must not be hard-coded as requirements.
- Do not apply when the user is correcting, contradicting, or iterating on prior work.
- This skill does not grant access to source repositories, CI systems, credentials, or external state. Any access must be explicitly authorized at runtime.

### Dependencies

None evidenced.

### Evidence References

- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1125.jsonl#turn-1:assistant-response`
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1125.jsonl#episode-episode:2:94f57170:settlement-2026-07-30T09:03:20.750Z`
