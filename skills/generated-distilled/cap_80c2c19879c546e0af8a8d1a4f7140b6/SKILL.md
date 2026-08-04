---
name: "generate-phonics-cannon-asset-overview"
description: "Generates a composite overview board image of all needed visual asset elements for a phonics cannon educational game where two cannons appear in sequence (e.g., first c, then at). Delivers the overview so the user can review and confirm the visual direction before individual assets are extracted."
user-invocable: true
x-xiaoba-capability-handle: "cap_80c2c19879c546e0af8a8d1a4f7140b6"
x-xiaoba-transition-id: "transition-7bd7e430-09b5-486e-b3aa-edc642ea593a"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#turn-2:delivery:send_file, /home/xiaoba/app/logs/sessions/catscompany/2026-07-30/catscompany_cc_group_grp_1108.jsonl#episode-episode:2:47e20437:settlement-2026-07-30T04:37:05.520Z"
---

## Guidance: Generate Phonics Cannon Game Asset Overview

### When to apply
This skill applies when the user asks to generate an overview or board of all needed visual asset elements for a **phonics cannon** style educational game, especially one where two cannons appear in sequence (e.g., first a consonant like `c`, then a phonogram like `at`). The request may be framed as "generate all the pattern element assets this game might need" or similar.

### What this skill does
1. **Interpret the game mechanic** – Understand that two cannons fire in sequential order (e.g., first `c`, then `at`) to teach blending/phonics.
2. **Identify the full set of visual asset categories needed** for the game, such as:
   - Classroom/background scene
   - Cannon states (idle, firing, post-fire)
   - Letter/grapheme tiles or objects for the first cannon
   - Letter/grapheme tiles or objects for the second cannon
   - Blending/explosion effects
   - Particle effects
   - Operation/control icons
3. **Generate a single composite overview image** that lays out all proposed asset elements on one board, so the user can review and confirm the visual direction and scope before committing to individual transparent PNG assets.
4. **Deliver the overview image** to the user via `send_file` and ask for style confirmation.

### Boundaries
- This skill produces an **asset overview board**, not individual cut-out PNG assets. Individual asset extraction is a follow-up task after the user confirms the style.
- Do not hard-code specific asset paths or file names from a prior episode; use the current working context to determine output location.
- Do not regenerate an overview if the user is simply requesting a different delivery format or minor variation of an already-confirmed board.

### Evidence source
- Learning episode `episode:2:47e20437` involving a phonics cannon game asset overview request, completed with `send_file` delivery and settled without contradiction.
