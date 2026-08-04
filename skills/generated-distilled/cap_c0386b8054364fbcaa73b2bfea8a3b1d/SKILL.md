---
name: "propose-game-visual-asset-rework"
description: "When asked to analyze how to modify game scene visual compositing assets, recommend abandoning cut-out extraction in favor of redrawing characters and props as independent transparent PNGs with unified perspective, lighting, and thick outlines, test edges on multiple backgrounds before proceeding, and preserve the best existing central composite while animating only whole groups, projectiles, and combined text."
user-invocable: true
x-xiaoba-capability-handle: "cap_c0386b8054364fbcaa73b2bfea8a3b1d"
x-xiaoba-transition-id: "transition-133b3315-a99d-43ea-91cb-f536b43a7125"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#turn-6:assistant-response, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#episode-episode:9:743f1394:settlement-2026-07-30T10:32:04.169Z"
---

## Skill: Propose Game Visual Asset Rework Approach

### Guidance

When the user asks you to analyze how to modify or rework game scene visual assets (characters, props, compositing elements), do **not** propose incremental edge-refinement or extraction from existing overview/composite images. Instead, recommend a full asset pipeline restructuring:

1. **Replace extraction with independent redraws** — redraw left character, right character, and props (e.g., cannon) as separate, fully integrated transparent PNGs.
2. **Unify visual style** — ensure consistent perspective, light source, and thick outlines across all redrawn assets. Do not bake shadows or smoke into the transparent assets.
3. **Iterate with background tests** — first produce only the left-side sample draft and validate edge quality against white, dark, and grass-colored backgrounds. Proceed to the right side only after confirmation.
4. **Preserve the best existing composite** — keep the current central compositing effect as the foundation. Apply HTML/CSS animation only to the whole group, cannonballs, and combined dialogue/chapter text; do not animate individual cut-out pieces.

### Boundaries

- Apply only when the user requests analysis specifically for game scene visual assets (static or animated compositing elements with characters, props, and backgrounds).
- Do not apply when the user is actively debugging, correcting, or iterating on an in-progress task — wait for a fresh request.
- This skill does **not** cover sound, gameplay logic, UI layout, or non-visual game systems.

### Evidence

- **Episode source:** `/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#turn-6:assistant-response` — user "uma" asked to analyze how to change game visual assets; the response proposed abandoning cut-out extraction in favor of redrawn transparent PNGs with unified styling, edge testing on multiple backgrounds, and selective animation.
- **Settlement:** Episode `episode:9:743f1394` settled at `2026-07-30T10:32:04.169Z` without contradiction.
