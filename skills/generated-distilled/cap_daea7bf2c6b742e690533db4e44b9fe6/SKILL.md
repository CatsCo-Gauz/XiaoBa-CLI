---
name: "extract-game-assets-from-reference"
description: "When a user provides a reference image showing preferred game asset visuals, extract individual transparent assets from that reference and replace them into the game rather than redrawing in a simplified style."
user-invocable: true
x-xiaoba-capability-handle: "cap_daea7bf2c6b742e690533db4e44b9fe6"
x-xiaoba-transition-id: "transition-75246023-9bb4-493a-8055-659c35239206"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-3:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:3:7ad2b1c6:settlement-2026-07-29T09:06:30.161Z"
---

## Skill: extract-game-assets-from-reference

**Guidance**

When a user provides a reference image (e.g., a PNG screenshot or asset preview) showing a preferred visual style for game assets, and asks to generate or replace those assets:

1. **Treat the reference image as the ground truth.** Do not approximate or redraw the elements in a simplified style (e.g., simplified SVG). Instead, faithfully reproduce the visual style shown.
2. **Extract individual transparent assets.** Generate each game element as a separate transparent image (e.g., PNG with transparency) based on the reference, not as a combined or simplified composition.
3. **Replace into the game.** Use the extracted transparent assets to replace the corresponding elements in the game, without mixing styles or producing an alternative version.
4. **Discard drafts that deviate.** If you have already produced a simplified or stylistically downgraded version, mark it as superseded and use the reference-faithful approach instead.

**When to apply**

- The user references a previously shown or attached image as the correct visual target.
- The task involves generating, replacing, or updating in-game visual assets (sprites, UI elements, character art, etc.).
- The user indicates that an earlier version was better and should serve as the template.

**When NOT to apply**

- The user is actively iterating or correcting the task (wait for final direction).
- The reference image is not available or the user has not pointed to a specific visual target.
- The task is about code logic, audio, or other non-visual game content.
