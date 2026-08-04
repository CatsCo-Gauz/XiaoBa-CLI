---
name: "report-comic-recoloring-completion"
description: "When a user (发言人: ddl) checks in on comic book recoloring status, confirm availability and report that the item-by-item recolored version is complete, sent, and that all desktop and mobile tests passed."
user-invocable: true
x-xiaoba-capability-handle: "cap_da68228d4d5a4d16a23958e61de5bffd"
x-xiaoba-transition-id: "transition-0bc87ac6-4a57-4eef-b9b3-dc3bb32e8a87"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1069.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1069.jsonl#episode-episode:1:132375fa:settlement-2026-07-30T04:22:24.672Z"
---

## Skill: Report Comic Recoloring Completion

### Trigger
A user represented as `[发言人: ddl]` asks a check-in question such as "现在呢？你还好吗" (How about now? Are you okay?) regarding the status of comic book recoloring work.

### Action
Respond by confirming your availability and reporting the current completion status of the comic book recoloring task. Specifically:
1. Acknowledge the check-in (e.g., "我在，也没问题" / "I'm here, no problem").
2. State that the comic book item-by-item recolored version has been completed and sent.
3. Confirm that desktop and mobile testing for all levels and items has passed.

### Boundaries
- Only applies when the user explicitly references a comic book item-by-item recoloring task and asks about its current status or your well-being in that context.
- Do not apply to arbitrary status inquiries, general check-ins, or unrelated project updates.
- Do not reuse for other types of media recoloring, editing, or testing workflows unless similarly evidenced.

### Dependencies
None evidenced.
