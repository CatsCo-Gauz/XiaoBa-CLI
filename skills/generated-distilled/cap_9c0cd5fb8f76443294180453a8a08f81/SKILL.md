---
name: "record-word-whack-a-mole-demo"
description: "Create an automated screen recording demo of the 单词打地鼠 (Word Whack-a-Mole) HTML word game with fixed word lists, using Playwright to automate gameplay and capture video to send to the user."
user-invocable: true
x-xiaoba-capability-handle: "cap_9c0cd5fb8f76443294180453a8a08f81"
x-xiaoba-transition-id: "transition-47e37ffd-7abd-4f06-ab07-97c484e4a4f9"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-2:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-2:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:2:944e7692:settlement-2026-07-29T06:21:46.842Z"
---

## Skill: Record Word Whack-a-Mole (单词打地鼠) Game Demo

### When to Use
Apply this skill when the user asks to roll back (回滚) and re-record a screen demo of the **单词打地鼠** (Word Whack-a-Mole) HTML word game using a fixed word list configuration (e.g., U1/U2 fixed lists). The user's intent signals they want a fresh recording after reverting to a prior version or fixed word list setup.

### Evidence Boundary
- This skill is derived from **one episode** where the user asked to roll back and re-record a demo of the 单词打地鼠 game with U1/U2 fixed word lists. It does **not** generalize to other web games, non-game web pages, desktop applications, slide decks, or arbitrary browser content.
- It covers writing a Playwright script that automates gameplay (unit switching, answering, scoring, winner display, restart), capturing video, and sending the result.
- It does **not** cover video editing (mixing audio, trimming, overlays), CI pipelines, authentication/credentials, or deploying the game.
- The source evidence contains a deliberate omission marker in the recorded Playwright script, meaning the full automation code is not completely reproducible from evidence alone.

### Guidance

1. **Confirm the specific game and configuration.**  
   Identify the exact HTML file for 单词打地鼠 with its fixed word list configuration (e.g., U1/U2 fixed lists). The episode used a local path like `/home/xiaoba/app/tmp/单词打地鼠_U1-U2_纯听音固定词表版.html`. Require the user to confirm or provide the current game file path.

2. **Determine output paths with the user.**  
   Ask the user where to save the recording script, raw video, timeline data, and final deliverable. Do not assume a predetermined directory structure from the episode.

3. **Write a Playwright recording script** that:
   - Launches Chromium with a visible window (`headless: false`) for screen capture.
   - Starts a minimal HTTP server to serve the local HTML file (avoids `file://` restrictions).
   - Opens a browser `context` with `{ recordVideo: { dir: <temporary directory> } }`.
   - Navigates to the served game URL.
   - Automates the game interactions step by step (switching units, clicking settings, answering questions, confirming winner, restarting), with appropriate waits between actions so the recording captures the visible flow.
   - Closes the page, context, browser, and HTTP server cleanly.
   - Writes the raw video to a named output path and optionally saves timing data (e.g., a JSON timeline with recording start timestamp and speech events).

4. **Execute the script** via Node.js, then verify it completed without errors.

5. **Send the final video** to the user using `send_file` with a descriptive file name that references the game and configuration (e.g., `单词打地鼠_U1-U2_回滚固定词表版_有声演示.mp4`).

6. **Do not** inherit browser paths, game paths, word lists, team names, or selector strategies from the episode; require the current user's specific game file and configuration.

### Key Constraints
- Recording uses Playwright's `recordVideo` context option. Ensure Playwright and a Chromium binary are available at runtime.
- The HTTP server must use a free port and be shut down after use.
- Automated gameplay must match the actual game UI. Selectors and interaction sequences (buttons, dialogs, scoreboard, winner modal) must be confirmed against the current game version, not copied from the episode.
- The evidence script contains a deliberate omission marker; the full automation code is not completely reproducible from the episode alone. Verify the script's completeness before execution.
