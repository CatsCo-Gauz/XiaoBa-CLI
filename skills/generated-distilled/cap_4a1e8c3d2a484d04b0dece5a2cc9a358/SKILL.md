---
name: "respond-cropping-quality-criticism"
description: "Respond to user dissatisfaction with cropped/extracted image elements by acknowledging flaws (white edges, gray shadows, fragments, inconsistent perspective) and recommending redesign rather than continued repair. Preserves the original Chinese-language context."
user-invocable: true
x-xiaoba-capability-handle: "cap_4a1e8c3d2a484d04b0dece5a2cc9a358"
x-xiaoba-transition-id: "transition-1bdfb4f7-7960-4bc9-b8d4-d66cb68383a1"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#turn-5:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#episode-episode:8:bbf2ef12:settlement-2026-07-30T10:24:22.173Z"
---

## Skill: 回应抠图元素质量批评 — Respond to Cropping Quality Criticism

### Guidance

When a user expresses dissatisfaction with cropped/extracted image elements (e.g., "不喜欢，感觉你扣的那些元素很有问题"), follow this response pattern:

1. **诚实地承认问题** — Acknowledge the complaint and take responsibility for the quality failures.
2. **列举具体的根本缺陷** — Identify the fundamental quality issues present in the cropped elements:
   - 白边 (white edges)
   - 灰影 (gray shadows)
   - 残片 (fragments / residual pieces)
   - 透视不一致 (inconsistent perspective)
3. **得出明确结论** — State that these fundamental flaws render the current set of crops unsalvageable through further patching or code-based fixes, and that the set should be **stopped and redesigned** rather than repeatedly repaired.

### Boundaries

- Only apply when the user explicitly criticizes or expresses dissatisfaction with cropping/extraction quality (the trigger is user critique, not a routine review request).
- Do not apply when the user is actively iterating on cropping work and has not expressed dissatisfaction.
- The flaw categories are the four documented above (白边, 灰影, 残片, 透视不一致); do not infer or add other quality criteria without additional evidence.
- This pattern describes how to **respond** to user criticism based on issues already known from prior context — it does not prescribe how to perform the initial visual inspection or identify those flaws in the first place.
- The original interaction was in Chinese (中文); this pattern is most naturally applied in a Chinese-language context.

### Input Requirements

- Requires the user's expressed dissatisfaction or critique about cropped/extracted elements (in Chinese or otherwise).

### Output

- Acknowledgment of the specific quality issues.
- A decisive conclusion recommending redesign rather than continued repair.

### Risks

- This pattern is derived from a single completed episode and may not generalize to all cropping quality feedback.
- The judgment to "stop and redesign" applies to the specific set of crops under discussion — not as a blanket policy.
- Do not inherit any tool permissions, data access, or prior session context from the original episode.
