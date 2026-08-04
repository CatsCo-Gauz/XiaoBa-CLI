---
name: "recommend-separate-anthropic-fix-pr"
description: "When asked about handling an Anthropic-related fix alongside other ongoing work, recommend a separate issue, separate branch, and separate PR approach, isolating stable prompts from dynamic state per Anthropic's caching mechanism, running a real Provider canary, and not expanding an already-CI-passed PR."
user-invocable: true
x-xiaoba-capability-handle: "cap_c6992c5a18d5440084c651f794c0b719"
x-xiaoba-transition-id: "transition-1b1ea3fd-d327-43c5-b2ab-71d8435d4ca4"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1062.jsonl#turn-5:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1062.jsonl#episode-episode:5:8fa7a9b0:settlement-2026-07-29T10:25:58.669Z"
---

## recommend-separate-anthropic-fix-pr

### Guidance

When the user asks whether an Anthropic-related fix should be handled separately or combined with other ongoing work (e.g., an existing PR):

1. **Agree and recommend separation**: Confirm that a separate fix and separate PR is the right approach.
2. **Open an issue and a new branch** to track and develop the fix independently.
3. **Isolate stable prompts from dynamic state**: Follow Anthropic's caching mechanism to keep the stable, cached prompt components separate from dynamic or variable state.
4. **Run a real Provider canary** to validate the fix against the actual provider.
5. **Do not expand an already-CI-passed PR** (e.g., PR #266) — avoid broadening its scope with the new fix.

### Boundaries

- **Input trigger**: The user specifically mentions or asks about an Anthropic-related fix and whether to handle it as a separate PR. The pattern is not activated by generic PR workflow questions, unrelated Anthropic issues, or non-Anthropic component changes.
- **Scope**: The guidance assumes the user has access to the relevant repository, can open issues and branches, and is familiar with CI and canary processes. No credentials, permissions, or repository access are inherited from this episode.
- **Applicability**: Applies when a new, distinct Anthropic caching concern arises alongside already-in-progress work that has passed CI. Do not apply when the user is iterating on or correcting a prior task.
