---
name: "create-evidence-review-fix-plan"
description: "Produces a structured HTML fix plan document (and optionally a PDF) for evidence review timeout and continuation review issues. Covers root cause analysis, quantum-level scheduling design, acceptance metrics, and key design decisions. Does not modify source code, run tests, or deploy."
user-invocable: true
x-xiaoba-capability-handle: "cap_f6f74c458d3c4ca7b99319f23eab7038"
x-xiaoba-transition-id: "transition-91069d41-da4c-4f20-9592-29f41d82faa0"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1029.jsonl#turn-6:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1029.jsonl#turn-6:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1029.jsonl#episode-episode:6:dbc99623:settlement-2026-07-29T09:51:23.174Z"
---

## Skill: Create Evidence Review Timeout Fix Plan

### Trigger
Apply when the user asks you to think about or design a fix plan for evidence review timeout, continuation review, or related runtime-scheduling issues in the evidence review system.

### Input Requirements
- A clear description or confirmation of the evidence review timeout problem being addressed (e.g., shared deadline causing false shutdowns, stalled continuation review, quantum scheduling issues).
- Access to enough context about the current evidence review system architecture to produce a targeted design.

### Guidance

1. **Understand the core problem.** Identify whether the main fault is a shared global deadline (e.g., 10-minute limit) that causes false runtime-shutdown markings, stalled continuation review (续审), or quantum-level scheduling inefficiency.

2. **Design the fix plan around these principles:**
   - Do **not** extend the total deadline or increase concurrency as the primary fix.
   - New tasks should be durably enqueued (持久入队) before processing.
   - Each round should advance exactly one quantum (量子) at a time.
   - Give each individual quantum its own independent timeout.
   - Accurately record cancellation reasons rather than mislabeling them.
   - Ensure succeeded quanta are not replayed for the same job.

3. **Structure the deliverable** as an HTML document (and optionally a PDF) containing:
   - Root cause analysis and problem definition.
   - Proposed architecture or process changes.
   - Key design decisions and rationale.
   - Acceptance criteria / verification metrics (e.g., no deadline-related runtime-shutdown false flags within 24h, heartbeat rounds not blocking on full graph runs, steady reduction of backlog).
   - Source code snapshot references if relevant.

4. **Boundaries and limitations:**
   - This skill produces a **design document** — it does not modify source code, run tests, build, or deploy.
   - Do not implement the fix; deliver the analysis and plan only.
   - Do not hard-code specific file paths, team names, or environment details from past episodes.
   - Do not extend this skill to arbitrary system analysis, meeting notes, or unrelated domain problems.

### Outcome
An HTML fix plan document (saved to a local path) and optionally a PDF file sent to the user, containing a structured technical design for resolving evidence review timeout and continuation review issues.
