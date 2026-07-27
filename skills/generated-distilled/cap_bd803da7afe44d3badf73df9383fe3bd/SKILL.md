---
name: "deliver-medal-table-pdf"
description: "When a user asks about results, medal standings, or a medal table (e.g., 结果如何, 奖牌榜如何) for a completed event, deliver the known existing PDF by sending it with send_file."
user-invocable: true
x-xiaoba-capability-handle: "cap_bd803da7afe44d3badf73df9383fe3bd"
x-xiaoba-transition-id: "transition-d05068e1-5827-4329-8bff-531bcec7190c"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#turn-4:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-22/catscompany_cc_group_grp_895.jsonl#episode-episode:4:ca6085d8:settlement-2026-07-22T09:37:22.089Z"
---

# Skill: Deliver Medal Table PDF

## Guidance

When a user asks about results, medal standings, or a medal table (e.g., "结果如何", "奖牌榜如何") for a specific completed event, and the corresponding PDF file is already known to exist at a known path, deliver that PDF by sending it with the `send_file` tool.

### Steps

1. Use `send_file` with the known `file_name` and `file_path` to deliver the file.
2. No search, discovery, or identification of multiple files is needed — the file name and path are established from context.

### Example

- User asks: "确实结束了，你看看奖牌榜如何"
- Action: `send_file { "file_name": "2026世界杯奖牌榜.pdf", "file_path": "/home/xiaoba/app/2026_World_Cup_Medal_Table.pdf" }`

## Boundaries

- Only apply when the user is asking about viewing or receiving a medal table / results document for an event that has ended.
- Do not reuse this pattern while the user is correcting, iterating, or asking to explore alternative tools (e.g., opencli weixin).
- This skill covers sending a pre-existing PDF only — it does not cover generating, updating, or creating medal table data.
- Based on a single completed delivery of one specific PDF; do not generalize to other file names, paths, or event contexts without additional evidence.

## Risks

- Derived from a single delivery attempt; actual file names, paths, and event contexts may differ in future requests.
- The user's messages included a suggestion to use "opencli weixin" to check results, which conflicts with the send_file action taken. The user's true intent (viewing results via a command-line tool vs. receiving a PDF) is ambiguous and was not explicitly confirmed. Use caution before applying this skill when the user mentions alternative result-checking methods.
- This skill does not grant authority to access files outside the scope evidenced.
