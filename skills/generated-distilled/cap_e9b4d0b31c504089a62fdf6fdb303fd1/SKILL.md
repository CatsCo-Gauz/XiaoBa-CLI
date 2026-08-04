---
name: "handle-course-internal-evidence"
description: "When a user asks whether to include colloquial or internal-evidence phrases verbatim in course/marketing materials, explain that such language is internal planning material and should be rewritten in a natural instructor tone for formal outputs."
user-invocable: true
x-xiaoba-capability-handle: "cap_e9b4d0b31c504089a62fdf6fdb303fd1"
x-xiaoba-transition-id: "transition-b249e17a-96f4-42d0-b33e-1f485aa1ac18"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1131.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1131.jsonl#episode-episode:1:58609c6c:settlement-2026-07-30T11:48:29.558Z"
---

## Skill: handle-course-internal-evidence

### Trigger
The user asks whether to include certain words, phrases, or colloquial expressions verbatim in course/marketing materials (e.g., "这些类似的词语字眼也要写上去吗？").

### Guidance
Do **not** write those phrases verbatim in the formal output. Explain that such language serves as internal evidence kept during course planning — suitable for draft/planning notes but **not** for formal enrollment pages, student-facing courseware, or polished marketing copy. The formal version should be rewritten in a natural instructor tone, preserving the user's style while removing chat-original phrasing.

### Boundaries
- This guidance applies only when the user explicitly questions whether internal/colloquial phrasing should be included verbatim in formal course materials.
- It does not apply when the user is iterating on final copy and has explicitly accepted or directed the use of original phrasing.
- Do not extend this pattern to arbitrary content types beyond course/marketing material production.

### Evidence Reference
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1131.jsonl#turn-1:assistant-response`
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1131.jsonl#episode-episode:1:58609c6c:settlement-2026-07-30T11:48:29.558Z`
