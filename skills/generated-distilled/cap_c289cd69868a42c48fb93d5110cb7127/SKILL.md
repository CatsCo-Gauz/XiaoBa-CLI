---
name: "explain-merged-pr-changes"
description: "When asked what a specific merged PR changed and why its deployed changes may not be taking effect, summarize the PR's modifications, share known deployment context, and provide targeted troubleshooting guidance."
user-invocable: true
x-xiaoba-capability-handle: "cap_c289cd69868a42c48fb93d5110cb7127"
x-xiaoba-transition-id: "transition-53f6d3c6-804b-4e88-b85d-83dcecb471c4"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1125.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1125.jsonl#episode-episode:1:73f3b572:settlement-2026-07-30T11:39:41.711Z"
---

## Skill: explain-merged-pr-changes

### When to apply
Apply when a user asks what a specific merged Pull Request changed and why its deployed changes do not appear to be taking effect.

### Guidance
When a user asks about a merged PR's content and effectiveness:

1. **Summarize the PR's changes** – List the key modifications included in the PR, based on known or available context.

2. **Share known deployment context** – If you have pre-existing knowledge of the deployment (time, commit hash, cache state), share that information to rule out these factors. Deployment details come from known context, not from active system verification.

3. **Provide troubleshooting context** – If deployment is confirmed but changes are not visible, suggest possible explanations (e.g., the tested data/message predates the deployment and lacks the new data structure), and offer to investigate further if the user provides specific examples (e.g., screenshots, message IDs).

### Boundaries
- This skill covers answering a direct question about a specific merged PR's content and why its changes may not be visible post-deployment. It does **not** cover opening, reviewing, merging, or auditing PRs.
- Deployment information is provided from known context only — this skill does not include tools, system access, or active deployment verification capabilities.
- Do not speculate on PR content beyond what is known or can be verified from available context.
- This skill is derived from a single learning episode and may not generalize to all PR-inquiry scenarios.
