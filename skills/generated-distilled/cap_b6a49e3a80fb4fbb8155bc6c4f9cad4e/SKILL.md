---
name: "create-xiaohongshu-4by3-cover"
description: "Generates a 4:3 aspect ratio cover image for Xiaohongshu (小红书) that showcases a game's full interface by rendering it in a headless browser and capturing a screenshot."
user-invocable: true
x-xiaoba-capability-handle: "cap_b6a49e3a80fb4fbb8155bc6c4f9cad4e"
x-xiaoba-transition-id: "transition-1db341bd-80a1-47b3-8f78-3eea1a86499d"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-3:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-3:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:3:1c86604f:settlement-2026-07-29T07:12:29.366Z"
---

## Guidance: create-xiaohongshu-4by3-cover

### Purpose
Generate a 4:3 aspect ratio cover image for Xiaohongshu (小红书) that showcases a game's full interface by rendering it in a headless browser and capturing a screenshot.

### Triggers
- User asks for a 4:3 photo/cover for Xiaohongshu that shows the full game/appearance (e.g., "你能给我做一个4:3的大小的照片来作为我发小红书的封面吗？又要可以展现我们这个全貌").

### Input Requirements
1. The game or page to capture must be available as a local HTML file.
2. The output directory must be writable (e.g., a temporary workspace).
3. Playwright with Chromium must be installed and available; the exact executable path is environment-specific and must be resolved at execution time.

### Steps

1. **Create a cover page HTML** that embeds the target game HTML in an `<iframe>` with decorative header/label elements, using a 1200×900 viewport (4:3 ratio). Style the cover with a gradient background, title, and a label.
2. **Write a Node.js Playwright script** that:
   - Starts a local HTTP server to serve both the cover page and the game HTML.
   - Launches headless Chromium with `--no-sandbox` and a 1200×900 viewport.
   - If the game uses Web Speech API, stub out `window.speechSynthesis` to avoid headless errors.
   - Navigates to the cover page and waits for the game iframe to load.
   - If the game requires interaction (e.g., clicking a start button), perform that interaction and wait for game elements to appear. *(Note: specific selectors such as `#startBtn`, `.hole.up`, or `.word` observed in one episode are project-specific and must be adapted to the target game.)*
   - Captures a full-page screenshot as PNG at the 1200×900 viewport size.
3. **Execute the script** using Node.js.
4. **Send the resulting PNG file** to the user via `send_file` with a descriptive filename.

### Boundaries
- This skill is scoped to **generating a static 4:3 PNG screenshot**; it does not handle video recording, GIF creation, or dynamic interaction capture beyond a single screenshot.
- The screenshot is taken from a headless browser rendering; the game must be a self-contained HTML file (no external network-dependent resources that fail in headless mode).
- Speech synthesis should be stubbed out when the game uses Web Speech API.
- Do not reuse this skill for non-cover, non-4:3, or non-game-capture tasks.
- The assistant does not inherit any account credentials, OAuth tokens, or platform publishing permissions from this episode.
- The evidence for this skill comes from a single completed episode for a specific shared game project; adaptation to other games may require adjusting selectors and interaction steps.

### Output
- A single PNG image file at 1200×900 pixels (4:3 aspect ratio) showing the game interface within a styled cover layout. Note that visual correctness (e.g., no cropping, garbled text) was checked in the episode but is not independently verified by this guidance.
