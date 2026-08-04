---
name: "audit-long-session-sedimentation"
description: "Read-only audit of the historical long-session sedimentation funnel: identify long/high-value sessions missing Episode/Skill consolidation, compute funnel statistics, and deliver a governance report with a staged replay → dry-run → execute plan that never rolls back production cursors."
user-invocable: true
x-xiaoba-capability-handle: "cap_2a4fd6ad2f2540bbbaa5ba11b1c61c52"
x-xiaoba-transition-id: "transition-72c003a9-2750-4660-b311-aa4d28e77c2e"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1029.jsonl#turn-2:validation:check_subagent, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1029.jsonl#turn-2:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1029.jsonl#turn-2:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1029.jsonl#episode-episode:2:c1ff6c6b:settlement-2026-07-29T09:15:07.123Z"
---

# Audit Long-Session Sedimentation Funnel (历史长会话沉淀漏斗盘点)

## When to use
Trigger: the user (e.g., `pi-dal`) reports that many long sessions have not been consolidated ("沉淀") into Episodes/Skills and asks what to do about the backlog ("你看看咋整"). The reusable operation is a **read-only audit** of the historical long-session sedimentation funnel: identify long/high-value sessions that are missing Episode/Skill consolidation, compute funnel statistics, and deliver a governance report with a staged remediation plan.

## Boundaries
- This skill covers the **audit and governance report only**. It does **not** authorize replaying sessions, rolling back production cursors, modifying or deleting production data, deploying code, or restarting services.
- Only apply to the local session-log / distillation pipeline being audited (session `*.jsonl` logs plus the distillation state files and related source). Do not generalize to arbitrary log, data, or repository audits.
- Do not reuse this pattern while the user is still correcting or iterating on the same task.
- The audit must be executed with read-only tools (`glob`, `grep`, `read_file`) — e.g., via an explorer subagent. Do not write into production data paths.

## Inputs to gather
- Session log files under the session logs directory (e.g., `/home/xiaoba/app/logs/sessions/catscompany/`).
- Distillation state files: `distillation-cursor-state.json`, `learning-episodes.json`, `evidence-review-jobs.json`, `review-continuation.json`, `current-skill-registry.json`, `distillation-heartbeat-record.json`.
- Related source for confirmation of definitions/behavior, e.g., `src/utils/learning-episode.ts`, `src/utils/session-log-source.ts`, `src/utils/distillation-heartbeat-scheduler.ts`, `src/utils/runtime-learning.ts` (relevant ranges).

## Audit criteria (as evidenced)
- **Exclude synthetic traffic**: lifecycle, demo, review, inspection flows.
- **Long session**: cursor `completed` AND (`processedTurnCount >= 10` OR `byteOffset >= 1 MiB`).
- **High value**: explicit user request present AND successful tool results with `write_file`, `send_file`, or `check_subagent` evidence.
- **Broken chain** (session that should have sedimented but did not): Session has no Episode; or Episode's Job is in `continuation`/`active`/`deferred`; or review `verified=true` with `create_current_skill` but the Registry has no evidence reference for it.
- Compute all counts live at execution time; never hard-code counts or names from a previous run. Record the observation/data snapshot time.

## Analysis and report output
Compute funnel statistics: session file count, cursor count (and suspected stale cursors), Episode count, review jobs by status (`completed`/`active`/`deferred`/`superseded`), and current Registry Skill count (use the authoritative Current Skill Registry at execution time).

Identify priority candidates: sessions that are long, carry delivery signals (`write_file`/`send_file`/`check_subagent`, `status: succeeded`), but have zero Episode references.

Produce an HTML governance report (e.g., `tmp/long-session-recovery-inspection-YYYYMMDD/历史长会话补沉淀治理报告.html`) containing:
- verdict and metric cards;
- **staged plan**: 1) internal historical directed replay, 2) small-batch dry-run of high-priority long sessions (e.g., 5), 3) review approval before authorizing the first execute batch; no service restart required;
- **explicitly not recommended shortcuts**: modifying production cursor offsets, copying logs to fabricate new appends, full heartbeat trigger, directly summarizing long sessions into Skills, letting current continuation jobs retry indefinitely;
- **evidence & boundaries**: source snapshot tree hash, data snapshot time, data evidence file names, source evidence file/line ranges, and a statement that this is a governance plan only — no replay performed, no production data modified, no code deployed, no service restart;
- candidate detail files for follow-up (e.g., `funnel-analysis.json`, `high-value-unlinked.csv`, `stalled.csv`).

## Delivery
- Send the report (e.g., as PDF) to the current chat via `send_file`.
- In the reply, state the conclusion (staged replay → dry-run → authorized execute; never directly roll back the production cursor) and explicitly state what was and was not done this turn (no production data changed, no replay, no restart).
