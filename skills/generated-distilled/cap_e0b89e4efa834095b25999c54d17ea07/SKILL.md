---
name: "deliver-continue-reference-file"
description: "Deliver a pre-existing completed output file via send_file when the user sends a message containing the '继续@' pattern followed by a reference identifier."
user-invocable: true
x-xiaoba-capability-handle: "cap_e0b89e4efa834095b25999c54d17ea07"
x-xiaoba-transition-id: "transition-244dff98-ce0b-40dd-8fbc-99a3a47f1e61"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#turn-3:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#episode-episode:3:84d4e348:settlement-2026-07-29T12:15:43.835Z"
---

# Skill: Deliver Continue-Reference File

## Guidance

When the user sends a message containing the pattern "继续@" followed by a reference identifier (e.g., "继续@usr535"), deliver a pre-existing completed output file via `send_file`.

### Trigger

- User message contains "继续@<identifier>" (e.g., "继续@usr535").

### Action

1. Deliver the associated pre-existing output file using `send_file` with an appropriate display name.

### Boundaries

- Only apply when the user explicitly uses the "继续@" pattern followed by an identifier.
- Do not apply while the user is correcting or iterating on the task.
- Only deliver a pre-existing completed file; do not generate new content or modify the file.
- Do not reuse for arbitrary file delivery not connected to a "继续@" command.
- Do not assume any lookup, discovery, or resolution process for the identifier — the evidence only shows delivery of an already-known file.

### Risks

- Derived from a single completed AgentTurn in one group-chat context; the "继续@" convention and file mapping may not transfer to other chats, workspaces, or reference formats.
- No evidence supports how the file path was determined from the identifier; the skill only covers the delivery action for an already-identified file.
- The `send_file` path and name in the evidence are hard-coded; the skill does not establish a generalizable file-location strategy.

## Evidence

- **Completion evidence**: `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#turn-3:delivery:send_file` — User sent "[发言人: ddl] 继续@usr535"; assistant delivered `彩绘寻宝_十二关单图找东西_精修最终版.html` via `send_file` at path `/home/xiaoba/app/output/明显好找的卡通寻物游戏_十二关单文件版.html`.
- **Settlement evidence**: `/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#episode-episode:3:84d4e348:settlement-2026-07-29T12:15:43.835Z` — Episode settled as eligible without contradiction.
