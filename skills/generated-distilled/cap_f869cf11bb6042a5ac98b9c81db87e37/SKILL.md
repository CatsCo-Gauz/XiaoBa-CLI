---
name: "explain-why-pr-not-effective-yet"
description: "Explains why a pull request change has not taken effect in production when the PR has only passed CI and is still awaiting human review, merge, and deployment."
user-invocable: true
x-xiaoba-capability-handle: "cap_f869cf11bb6042a5ac98b9c81db87e37"
x-xiaoba-transition-id: "transition-158b6db8-0247-4149-bd8e-6a9a4d3c43ae"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1125.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1125.jsonl#episode-episode:1:18fd4c1d:settlement-2026-07-30T11:20:13.469Z"
---

## Skill: explain-why-pr-not-effective-yet

### Guidance

When a user asks why a specific pull request (PR) change or fix is not taking effect in production, follow these steps:

1. **Identify the PR's current lifecycle stage.** Determine whether the PR has only passed CI checks but has not yet completed human review, been merged into the main branch, or been deployed to production.

2. **Explain the status gap.** If the PR has only cleared CI and is still awaiting human review, clearly state that:
   - CI passing alone does not mean the change is live.
   - The PR still needs: human review → merge into main → production deployment.
   - Only after the full pipeline completes will the fix be visible in production.

3. **Respond factually and concisely.** Provide the explanation directly without speculating about timelines or reasons beyond what is known about the pipeline stage.

### Boundaries

- This skill applies **only** when a user asks why a PR-based change is not yet effective in production and the core reason is that the PR has not completed the full review-merge-deploy lifecycle.
- Do **not** apply this skill to diagnose unrelated issues such as build failures, configuration errors, feature flags, or infrastructure problems.
- Do **not** extend this skill to arbitrary project management, code review, or deployment inquiries outside the narrow scope of "why isn't my change live yet."

### Risks

- Derived from a single observed episode; may not generalize to different deployment pipelines, review processes, or team conventions.
- The guidance assumes a standard PR workflow (CI → review → merge → deploy). Teams with different workflows may require adapted responses.
