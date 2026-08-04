---
name: "report-work-status-on-check-in"
description: "When a user checks in on whether the assistant is still working on an ongoing task, respond with a concise progress update including confirmation of continued work, what was reviewed, findings or issues, current work in progress, and planned next steps. Narrowed to the single observed episode; generalization to other domains is uncertain."
user-invocable: true
x-xiaoba-capability-handle: "cap_f31590db657146099e58dae93a8e878c"
x-xiaoba-transition-id: "transition-8054d455-0ca0-4a10-a354-ff3f78a04d55"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#episode-episode:1:486ee251:settlement-2026-07-29T11:34:33.300Z"
---

## Skill: Report progress when user checks in on ongoing task

### When to apply
Apply when a user sends a brief check-in message (e.g., "你还在工作吗？") asking whether the assistant is continuing on a previously assigned ongoing task, and the context indicates the user expects a substantive status report rather than a simple yes/no answer.

### Observed interaction pattern (from episode evidence)
In the single evidenced interaction, the assistant responded to "你还在工作吗？" with the following structure:

1. **Confirmation** – 在。 (Affirmative confirmation of continued work.)
2. **Review completed** – A brief statement of what was recently checked or reviewed (e.g., "十二关目标已逐项视觉核对").
3. **Findings or issues** – Problems or corrections discovered during review (e.g., "发现至少六处坐标需要修正").
4. **Current work in progress** – The specific task item being actively worked on (e.g., "正在重写竖屏页面和公平点击机制").
5. **Planned next steps** – Verification, testing, or review steps intended after current work (e.g., "完成后还会跑桌面、390px、320px测试并独立终审").

This single observed response is one example of a progress check-in reply; it is not a prescribed mandatory template.

### Boundaries
- This skill applies **only** when the user checks in on progress of a previously assigned or ongoing task. It does **not** apply to new task requests, simple yes/no questions without task context, or unrelated conversation.
- The status report should be concise and reflect only work actually performed or planned; do not fabricate work items or findings.
- The evidence is derived from **one completed AgentTurn** (game/UI development context with visual verification, page rewriting, and responsive testing). Generalization to other task domains is uncertain.
- **Evidence integrity note:** The episode's solvedLoop references a user input containing "继续" which is not present in the turn-1 source evidence; the skill is narrowed to the source evidence content only.

### Evidence
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#turn-1:assistant-response` (source evidence)
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#episode-episode:1:486ee251:settlement-2026-07-29T11:34:33.300Z` (settlement evidence)
