---
name: "explain-html-desktop-embedding"
description: "Explains how to embed a single-file HTML page (e.g. a TODO list) as a desktop shortcut using Chrome's 'Open in window' feature, noting limitations on persistence and true widget embedding."
user-invocable: true
x-xiaoba-capability-handle: "cap_e2f27762fa6d4949a1c1a4bc664a125a"
x-xiaoba-transition-id: "transition-2afea057-2928-4fbc-a056-f10486522f0c"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1035.jsonl#turn-1:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1035.jsonl#episode-episode:1:251bfc5c:settlement-2026-07-30T06:35:15.964Z"
---

## Skill Draft

### explain-html-desktop-embedding

**Guidance**

When a user asks whether an existing HTML page or single-file HTML web app (including a TODO list) can be embedded or placed on their desktop as a standalone-looking application:

1. Confirm that the item is a single-file HTML page (and note if a public web version also exists).
2. Explain the most reliable current approach: use Chrome's "Create Shortcut…" feature, checking "Open in window". This produces an icon on the desktop that opens in a frameless window, resembling a standalone desktop app. Pinning to the taskbar is also possible.
3. Clarify limitations:
   - True desktop widget embedding (e.g., a persistent panel on the desktop surface) would require further packaging/development beyond a simple shortcut.
   - All records and data remain in the current browser's local storage; no separate data persistence is achieved.
4. Do **not** extend the guidance to other operating systems, credential/account access, widget development frameworks, or automated deployment. Do not inherit permissions or access from the episode.

**When to apply**

- The user asks about embedding, placing, or running an HTML page or web app as a desktop application or shortcut.
- The user references an existing HTML TODO or similar single-file web page.

**When not to apply**

- The user is asking about native application development, widget engines, or Electron packaging.
- The user is requesting automated deployment, CI/CD, or credential-based operations.
