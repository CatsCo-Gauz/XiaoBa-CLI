---
name: "create-hidden-object-html-game"
description: "Creates a self-contained HTML hidden object ('找东西') game based on a user-provided reference image. The game features a clutter scene with click-to-find mechanics, multiple levels, and mobile-responsive design."
user-invocable: true
x-xiaoba-capability-handle: "cap_853080a0313c491d811f5595470295fc"
x-xiaoba-transition-id: "transition-36ae5d92-53ac-424b-b3c5-420e475a0487"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#turn-1:delivery:write_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#turn-1:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1065.jsonl#episode-episode:1:c970e48a:settlement-2026-07-29T08:31:46.289Z"
---

## Skill: Create hidden object HTML game (找东西)

### When to apply
Apply when the user provides a reference image and requests creation of a similar "找东西" (hidden object / find-the-item) style game.

### What it does
Creates a self-contained, single-file HTML hidden object game ("找东西") that:
- Uses the provided reference image as a style/layout guide for the game scene
- Features one or more levels with a clutter scene and click-to-find mechanics
- Is fully self-contained in a single HTML file (no external dependencies)
- Is mobile-responsive with touch support

### Guidance
1. **Read the reference image** the user provides via the local cache path using `read_file`.
2. **Build a single HTML file** that implements the hidden-object game:
   - Render a clutter/杂物 scene with multiple clickable target items
   - Show a target icon or name at the top for the player to find
   - Implement click-to-find mechanics (clicking the correct item advances or scores)
   - Include visual feedback (highlight, animation, score display)
   - Make it mobile-responsive with appropriate viewport settings
3. **Save the HTML file** to an output location (e.g., `/home/xiaopa/app/output/`).
4. **Send the HTML file** to the user as the deliverable.

### Boundaries
- Only apply when the user provides a reference image and explicitly requests a similar "找东西" style game.
- Do not reuse this pattern for other types of game creation (e.g., puzzles, action games) without additional evidence.
- The output is a standalone HTML file; do not add server-side components or external assets.

### Risks
- Derived from a single completed turn; the resulting game mechanics may need iteration based on user feedback.
- The reference image interpretation is subjective; confirm alignment with the user if the game style diverges from expectations.
