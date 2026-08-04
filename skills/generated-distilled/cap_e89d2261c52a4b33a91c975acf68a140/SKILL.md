---
name: "respond-to-status-inquiry"
description: "When asked about current work status (e.g., '咋啦'/'what's up'), acknowledge the inquiry and provide a brief update on completed deliverables and pending decisions."
user-invocable: true
x-xiaoba-capability-handle: "cap_e89d2261c52a4b33a91c975acf68a140"
x-xiaoba-transition-id: "transition-18137def-8d0d-4c79-ab45-8aba27a427a8"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1147.jsonl#turn-3:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1147.jsonl#episode-episode:6:f3343097:settlement-2026-07-30T12:24:29.413Z"
---

## Respond to Status Inquiry

When someone asks about your current work status (e.g., "@usr535 咋啦" meaning "what's up" / "what's happening"), acknowledge the inquiry and provide a concise status update covering:

1. **Acknowledge** – Confirm you are present and aware of the query.
2. **Completed deliverables** – Briefly state what has been finished (e.g., demo, screen recording).
3. **Pending action** – Note what you are waiting on (e.g., confirmation of interaction direction) before proceeding further.

**Boundaries**
- Apply only when the context is a direct status inquiry about current or pending work.
- Do **not** reuse this pattern when the user is asking a different question, giving instructions, or requesting deliverables unrelated to status.
- This capability is derived from a single completed interaction and may not generalize to different team/project contexts.

**Evidence**
- One completed episode where the user asked "@usr535 咋啦" and the assistant responded with a status update about demo/screen-recording completion and pending direction confirmation.
