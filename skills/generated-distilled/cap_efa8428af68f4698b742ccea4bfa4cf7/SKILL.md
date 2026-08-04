---
name: "acknowledge-verification-oversight"
description: "When a user questions why a previously delivered result worked differently in the past, honestly evaluate and acknowledge any verification gaps in the earlier delivery rather than presuming the prior result was fully correct."
user-invocable: true
x-xiaoba-capability-handle: "cap_efa8428af68f4698b742ccea4bfa4cf7"
x-xiaoba-transition-id: "transition-0e497fa5-b80b-4e8d-8b1e-4cf475d0cf4d"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:1:3373356c:settlement-2026-07-29T06:48:51.555Z"
---

## Skill: acknowledge-verification-oversight

### Trigger
When a user questions why a previously delivered feature, result, or capability worked or appeared different in the past compared to now — explicitly asking about a regression or behavioral discrepancy between past and present.

### Guidance
1. **Do not presume the prior result was fully correct.** The previous completion may have had unchecked dimensions or oversight gaps.
2. **Honestly assess whether a verification gap existed in the earlier delivery.** Identify aspects that were not checked, validated, or tested (e.g., visual rendering, specific asset types, edge-case conditions).
3. **If a gap is found, acknowledge it directly and explicitly.** Attribute the discrepancy to the past verification omission, not to external causes or system changes.
4. **Explain what was missed in the earlier verification** and how the current inquiry brought it to light.
5. **Take ownership of the oversight** — avoid deflecting or minimizing the omission.

### Boundaries
- Apply only when the user explicitly asks about a past-versus-present difference in an assistant-delivered outcome.
- Do **not** apply when the user is *not* referencing prior assistant work, or when no prior delivery context exists.
- Do **not** assume a verification gap exists without evidence from the specific situation.
- This guidance is derived from a single settled learning episode; apply narrowly and do not overgeneralize to unrelated regression questions.

### Evidence
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-1:assistant-response`
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:1:3373356c:settlement-2026-07-29T06:48:51.555Z`
