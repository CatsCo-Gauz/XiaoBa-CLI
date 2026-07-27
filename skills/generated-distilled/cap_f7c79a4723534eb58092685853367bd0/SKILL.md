---
name: "check-recent-sports-events"
description: "When a user asks in Chinese to check or view recent sports events (e.g., '现在查看一下最近有啥体育赛事'), research or gather information about recent/upcoming sports events, compile the findings into a well-formatted Chinese HTML report, and deliver it via send_file."
user-invocable: true
x-xiaoba-capability-handle: "cap_f7c79a4723534eb58092685853367bd0"
x-xiaoba-transition-id: "transition-bc57b332-ed8b-40f8-bb5d-c54aae0abbff"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_912.jsonl#turn-1:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_912.jsonl#turn-1:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-23/catscompany_cc_group_grp_912.jsonl#episode-episode:1:7638e489:settlement-2026-07-23T04:13:40.554Z"
---

## check-recent-sports-events

### Description

When a user asks in Chinese to check or view recent sports events (e.g., "现在查看一下最近有啥体育赛事"), research or gather information about recent/upcoming sports events, compile the findings into a well-formatted Chinese HTML report, and deliver it via `send_file`.

### Guidance

1.  **Interpret the user request.** The user wants a summary of recent sports events. The intent is to see what sporting events are happening or have recently happened.
2.  **Gather information about recent sports events.** Use available tools to research recent sports event news, schedules, results, or highlights. No specific data source is prescribed; use the best available knowledge or tools to compile relevant and current sports event information.
3.  **Prepare the output directory and filename.** Create a dedicated directory under `/tmp/` with a date-based name (e.g., `/tmp/recent-sports-YYYYMMDD/`). Use a descriptive Chinese filename that includes the date, such as `近期体育赛事简报_YYYY-MM-DD.html`.
4.  **Write a self-contained HTML report** using the `write_file` tool. The HTML should:
    - Use `lang="zh-CN"` and contain proper `<meta charset="utf-8">`.
    - Include a descriptive `<title>` with the current date.
    - Present the gathered sports event information in a clean, readable layout (e.g., sections or table for each sport/event with dates, teams/participants, status/results).
    - Use Chinese text throughout.
5.  **Deliver the file** to the user via `send_file` with the `file_name` parameter set to the path of the just-written HTML file.

### Boundaries

- Only apply when the user explicitly asks to check/view recent sports events in Chinese. Do not apply for other report types (stock reports, image generation, medal tables, etc.).
- This skill produces an HTML report. It does not create PDFs, images, or other formats.
- The skill relies on general knowledge or tool-based research for sports event data; it does not access a specific database or API for sports data.
- Do not reuse this pattern while the user is correcting or iterating on the delivery.

### Risks

- Derived from a single successful delivery attempt; actual sports data may vary by timing and available knowledge.
- The quality and recency of sports event information depends on available tools and data sources at runtime.
