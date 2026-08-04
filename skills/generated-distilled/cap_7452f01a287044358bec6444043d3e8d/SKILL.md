---
name: "deliver-comic-book-hidden-object-game"
description: "Deliver a completed comic-book-style hidden object game HTML file with item-by-item color restoration when the user instructs 'continue' (继续)."
user-invocable: true
x-xiaoba-capability-handle: "cap_7452f01a287044358bec6444043d3e8d"
x-xiaoba-transition-id: "transition-ed3ecd31-ebeb-46bf-984a-36d758691d9c"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1069.jsonl#turn-3:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1069.jsonl#episode-episode:4:f9ceafc2:settlement-2026-07-29T10:33:44.925Z"
---

# deliver-comic-book-hidden-object-game

## Guidance

When the user provides a "continue" (继续) instruction in the context of a comic-book-style hidden object game that has item-by-item color restoration, deliver the completed HTML artifact via `send_file`.

### Trigger
The user says or implies "继续" (continue) after a comic-book hidden object game HTML file has been prepared.

### Required Preconditions
- The HTML file for the game must already exist at a known output path on the local file system.
- The file should contain comic-book-style ink-line panel layouts and per-item color restoration mechanics (逐件复色).

### Delivery Steps
1. Identify the absolute path to the completed game HTML file.
2. Use `send_file` with the file path and a descriptive file name to send the artifact to the current chat.

### Boundaries
- This skill covers only the *delivery* of an already-built HTML game artifact. It does not cover game design, development, testing, or any modifications to the file.
- Do not reuse this skill for delivering arbitrary HTML files, reports, or non-game artifacts.
- The file path and file name are context-specific; resolve them from the current working session.
- No external permissions, credentials, or network access are required beyond the local file system and the `send_file` tool.
