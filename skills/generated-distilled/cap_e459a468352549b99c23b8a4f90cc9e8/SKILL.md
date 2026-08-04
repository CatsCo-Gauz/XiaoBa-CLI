---
name: "create-html-dodge-game"
description: "Creates a small, self-contained HTML dodge/avoid game as a single local file, based on the neon-dodge game pattern evidenced in a single learning episode."
user-invocable: true
x-xiaoba-capability-handle: "cap_e459a468352549b99c23b8a4f90cc9e8"
x-xiaoba-transition-id: "transition-69417382-6a0a-4148-a76e-5783dbd6d483"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1033.jsonl#turn-2:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1033.jsonl#episode-episode:2:c1abce8a:settlement-2026-07-29T09:51:42.755Z"
---

## Skill: Create a small HTML dodge game

### Applicability
Applies when the user asks to create a small, playable HTML game — specifically a dodge/avoid-style game — that can be delivered as a single local HTML file.

### Boundaries
- Only applies when the request clearly involves creating a new small HTML game as a standalone file.
- Does **not** cover cloud deployment, hosting, or publishing; no cloud deployment action was evidenced.
- Does not apply while the user is correcting, iterating on, or debugging the game.
- Does not cover other game types (puzzle, platformer, RPG, etc.) beyond the dodge/avoid pattern evidenced.

### Guidance
1. **Understand the request**: Confirm the user wants a small, self-contained HTML game with a dodge/avoid mechanic.
2. **Design the game**: Create a simple dodge game (player-controlled ship/character avoids falling obstacles) with:
   - A dark, neon-themed visual style using CSS gradients, shadows, and glow effects.
   - Keyboard (Arrow keys or A/D) and pointer/touch controls.
   - Score tracking and a game-over / restart flow.
3. **Deliver as a single file**: Write the complete game into one `.html` file using `write_file`. The file must be fully self-contained (no external dependencies).
4. **Do not claim cloud deployment**: The evidence only supports local file creation. Do not announce a published URL or assert any hosting/deployment step.

### Dependencies
None. This skill does not require any referenced skills.
