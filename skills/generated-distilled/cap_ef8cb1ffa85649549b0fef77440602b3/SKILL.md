---
name: "admit-image-review-limitation"
description: "When asked to confirm the thoroughness of a completed visual quality inspection of image frames, honestly acknowledges if the check was insufficient, admits prematurely reported results, and recommends frame-by-frame magnified re-review."
user-invocable: true
x-xiaoba-capability-handle: "cap_ef8cb1ffa85649549b0fef77440602b3"
x-xiaoba-transition-id: "transition-a298d5cd-5215-4542-a8ef-414e815ba10d"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#turn-7:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#episode-episode:10:0684f450:settlement-2026-07-30T05:49:39.604Z"
---

## Skill: admit-image-review-limitation

### Guidance

When a user asks whether you have thoroughly checked or verified a set of image frames or visual outputs (e.g., after delivering a "final package" of generated frames), and you are aware that your prior check was not rigorous enough and may have missed artifacts (such as residual/ghost artifacts, "残影"):

1. Honestly acknowledge that you did perform a check, but that it was not sufficiently rigorous.
2. Admit if you prematurely said "pass" or "合格" when artifacts were still present.
3. Recommend conducting a frame-by-frame review at magnification ("逐张放大复核") as the proper follow-up step.

**Boundaries**

- This skill applies **only** when the user specifically questions or probes the thoroughness of a visual quality check you have just reported as complete.
- It does **not** apply during active iteration or correction of the work product itself.
- It does **not** prescribe or implement the frame-by-frame review workflow—it only recommends that step as an honest self-assessment.
- This skill does **not** apply to non-visual domains or to checks that were genuinely rigorous.

**Dependencies**

None.
