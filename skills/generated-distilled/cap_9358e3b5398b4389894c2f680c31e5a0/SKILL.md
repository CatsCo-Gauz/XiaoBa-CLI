---
name: "build-cartoon-hidden-object-game"
description: "Build and deliver a single-file 12-level cartoon hidden-object game HTML: generate it from scene data with a Python build script, verify with Playwright (level/object counts, hints, completion flow, three viewport layouts, offline behavior), then send the final file to the user."
user-invocable: true
x-xiaoba-capability-handle: "cap_9358e3b5398b4389894c2f680c31e5a0"
x-xiaoba-transition-id: "transition-392c6390-0665-4bba-b32f-c1e90e311a7b"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#turn-2:delivery:write_file:call-id-f6341fe8bd98-1, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#turn-2:delivery:write_file:call-id-2e9173be0901-2, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#turn-2:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#episode-episode:2:57386829:settlement-2026-07-29T12:12:23.702Z"
---

# Build a Single-File Cartoon Hidden-Object Game

## When to use
- The user asks to continue ("继续") or finalize a cartoon hidden-object game ("卡通寻物游戏") build, and the expected deliverable is a single self-contained HTML game file with multiple levels.
- Applies to the underlying reusable operation: generating the game HTML from scene data, verifying it, and delivering the final artifact. It is not a generic "write reports" or generic file-delivery skill.

## What the evidence supports (from one completed delivery)
1. **Generator script** — a Python script (`source/build_new_game.py`) was written that:
   - Reads scene data from `source/scenes.json` in the project root.
   - Defines per-level game data: object coordinates, titles, items, rewards, difficulty, hint counts, and story text.
   - Generates a single-file HTML game (assets embedded) written to an output path, and also writes a `source/new-levels.json` file.
2. **Playwright verification** (`tests/test_full.cjs`) — a headless Chrome (with `--no-sandbox`) test that:
   - Loads the generated HTML via `file://` and clears localStorage before reloading (offline-save behavior).
   - Asserts the page title and that each of the 12 levels starts with 8 target cards and 0 found items.
   - Checks the hint feature (hint ring appears) and the completion / next-level-unlock flow.
   - Verifies three viewport layouts — desktop (1366×900), mobile (390×844), and small mobile (320×568) — for no horizontal or vertical overflow, no scene clipping under the game bar, and button heights ≥ 42px.
   - Asserts no console/page errors and no external network requests (fully offline-capable).
3. **Delivery** — the final generated HTML was sent to the user with a descriptive filename.

## How to proceed
1. Confirm the project root and the output path for the game HTML before writing anything.
2. Re-verify required inputs and dependencies at execution time — `source/scenes.json`, Python availability, and libraries such as PIL/base64/json. Do not assume they exist just because they were used in this episode.
3. Maintain the generator script: define per-level coordinates, titles, items, rewards, difficulty, hints, and stories; emit a single-file HTML; write `source/new-levels.json` alongside.
4. Write or update the Playwright test to cover: title, level/object counts, hints, completion/unlock flow, the three viewport layouts, overflow/clipping constraints, minimum button height, no console errors, and no external requests.
5. Run the tests; on pass, send the final HTML to the user with a descriptive filename and summarize the verified results.

## Boundaries
- Evidence covers one completed delivery turn. The middle of the generator script (full HTML template and part of the JS logic) is omitted from the source evidence, so do not claim the complete game logic is reproducible from this episode alone.
- The claim of an "independent final review with no P0/P1" is not corroborated by the evidence; do not assert external review results.
- Do not reuse this pattern while the user is correcting or iterating on the same task.
- Do not inherit access to the episode's file paths or session logs; resolve paths and permissions at execution time.
