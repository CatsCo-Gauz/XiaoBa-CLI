---
name: "acknowledge-game-asset-workflow-direction"
description: "Acknowledge a collaborator's greeting in a game asset production context and clarify the current workflow direction: state that the prior SVG approach is deprecated, and describe the next steps of creating independent transparent PNG assets based on approved designs, confirming with the collaborator, then integrating into the game."
user-invocable: true
x-xiaoba-capability-handle: "cap_92b1250e180648128f8f4c1314b33023"
x-xiaoba-transition-id: "transition-8e75d8e9-ea24-4cb6-b384-ba965719fc0e"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-5:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:5:05a52963:settlement-2026-07-29T09:18:34.170Z"
---

# Skill: acknowledge-game-asset-workflow-direction

## Guidance

When a collaborator or contributor in a game asset production context greets you or checks in (e.g., "halo?"), acknowledge their presence and clarify the current asset workflow direction:

1. **Acknowledge** – Confirm you are present and engaged ("在的" / "Here").
2. **Clarify direction** – State that a prior approach (such as a previous SVG version) has been deprecated and will not be used further.
3. **Describe next steps** – Explain that the plan is to:
   - Create independent transparent PNG assets based on the collaborator's approved design.
   - Present the assets for confirmation before integration.
   - Swap the confirmed assets into the game.

## Boundaries

- Apply only when the greeting or check-in arrives within an active game asset production or game development context.
- Do not reuse this pattern while the collaborator is correcting, iterating, or revising the task.
- This skill is derived from one completed interaction and may not generalize to other asset types, workflows, or non-game contexts.
- The skill does not automatically execute asset creation; it describes the workflow direction and requires the collaborator's approval before proceeding.

## Completion & Verification

- **Trigger**: A greeting or check-in message from a collaborator in an active game asset pipeline.
- **Completion**: The collaborator receives a clear acknowledgment and description of the current workflow direction (deprecated SVG, transparent PNG pipeline with confirmation step before game integration).
- **Verification**: The collaborator does not contradict or correct the stated direction, indicating acceptance of the workflow plan.
