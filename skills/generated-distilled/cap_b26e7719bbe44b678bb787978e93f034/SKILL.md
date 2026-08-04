---
name: "create-shmup-html-game"
description: "Create a single-file HTML shoot 'em up (shmup / 打飞机) mini game with embedded CSS and JavaScript, including player ship, enemies, shooting, scoring, and dark space visuals."
user-invocable: true
x-xiaoba-capability-handle: "cap_b26e7719bbe44b678bb787978e93f034"
x-xiaoba-transition-id: "transition-d9b8aeb3-0482-44a4-ae80-82f323ea9baf"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1033.jsonl#turn-6:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1033.jsonl#episode-episode:6:b70a876a:settlement-2026-07-29T10:27:06.326Z"
---

# create-shmup-html-game

## Guidance

When the user requests to create a shoot 'em up (shmup / 打飞机) mini game:

1. **Create a single self-contained HTML file** with embedded CSS and JavaScript. Do not split into multiple files or require a server.

2. **Include these game elements:**
   - A player-controlled ship that moves via pointer, touch, or keyboard (Arrow keys).
   - Enemies that spawn periodically and move downward.
   - Auto-fire or pointer-down shooting mechanics with projectiles.
   - Score display and lives/health tracking.
   - A start screen with a play button and a game-over restart flow.
   - Dark space-themed visual style with starfield background and neon effects.

3. **Delivery:** Use `write_file` to write the complete HTML file to an appropriate project directory.

4. **Follow-up:** After creating the file, inform the user of the file path and confirm the game is ready.

## Boundaries

- Only apply when the user explicitly requests a shoot 'em up / 打飞机 style mini game.
- Do not extend to other game genres (platformers, RPGs, puzzles, etc.) without additional evidence.
- The output is a single HTML file; do not produce server-side code, build tools, or multi-file projects.
- Do not reuse this guidance while the user is iterating on or correcting the game.
