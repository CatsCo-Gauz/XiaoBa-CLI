---
name: "check-recent-sports-events"
description: "When a user asks in Chinese to check or view recent sports events (e.g., '现在查看一下最近有啥体育赛事'), compile information about recent/upcoming sports events into a well-formatted Chinese HTML report and deliver it via send_file."
user-invocable: true
x-xiaoba-capability-handle: "cap_f7c79a4723534eb58092685853367bd0"
x-xiaoba-transition-id: "transition-b78f5f53-3ea1-4ae6-93a0-80dbb9fd0c9f"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_912.jsonl#turn-1:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_912.jsonl#turn-1:delivery:send_file"
---

# check-recent-sports-events

## Guidance

When a user asks in Chinese to check or view recent sports events (e.g., '现在查看一下最近有啥体育赛事'), compile information about recent/upcoming sports events into a well-formatted Chinese HTML report and deliver it via `send_file`.

## Referenced Skills

- **create-html-report** — used to generate the self-contained HTML report with Chinese styling.

## Evidence

- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_912.jsonl#turn-1:delivery:write_file` — completion evidence: HTML report file written.
- `/home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_912.jsonl#turn-1:delivery:send_file` — settlement evidence: report delivered to user.

## Boundaries

- Does **not** cover external search or data-fetching actions; the evidence only shows file operations (write_file, send_file) and the use of `create-html-report`. Any research or data-gathering step, if present, is internal to the episode and unsubstantiated by observable tool calls.
- Only evidenced for Chinese-language requests to check recent sports events. Do not extrapolate to other languages, domains, or delivery formats without additional evidence.
