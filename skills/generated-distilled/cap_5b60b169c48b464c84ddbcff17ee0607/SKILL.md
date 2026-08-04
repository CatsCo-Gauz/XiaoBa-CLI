---
name: "report-review-pipeline-status"
description: "Report the current operational status of a known review and ingestion pipeline process, including service health, process identifier, task queue, ingestion progress, remaining reviews, and unresolved issues."
user-invocable: true
x-xiaoba-capability-handle: "cap_5b60b169c48b464c84ddbcff17ee0607"
x-xiaoba-transition-id: "transition-49a9ef82-f5e9-4522-855e-f6e0cd8cc1a9"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1029.jsonl#turn-4:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1029.jsonl#episode-episode:4:8276fa71:settlement-2026-07-29T09:35:18.906Z"
---

## Skill: report-review-pipeline-status

**Trigger:** A user asks in Chinese about the current state of a known review or ingestion pipeline — e.g., "现在这么样呢" ("how is it now").

**Guidance:**

When the trigger is detected and a known review/ingestion pipeline process is being tracked, provide a concise factual summary including:

- Whether the service is running normally and whether a restart has occurred.
- The current process identifier (PID) if available.
- The number of accumulated review tasks and whether new triggers are still arriving.
- How many units have been ingested and how many files advanced.
- How many items remain pending for continued review.
- Any known unresolved issues or errors that have been identified but not yet fixed.

Base the response only on available process monitoring data. Do not fabricate metrics. Keep the tone factual and direct, matching the user's concise Chinese style.

**Boundary:** This skill applies only when there is an active review/ingestion pipeline whose status has been previously established in the conversation. It does not cover status checks for arbitrary unrelated services or systems.
