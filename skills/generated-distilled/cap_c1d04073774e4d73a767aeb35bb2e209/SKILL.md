---
name: "deliver-word-game-visual-reconstruction"
description: "Deliver a completed visual-reconstruction HTML file and accompanying screenshots for a word whack-a-mole (单词打地鼠) educational game upon a user's continuation request, after the reconstruction work has already been performed."
user-invocable: true
x-xiaoba-capability-handle: "cap_c1d04073774e4d73a767aeb35bb2e209"
x-xiaoba-transition-id: "transition-b4d5b8c6-b489-46c1-bae5-4e903bfe9fb5"
x-xiaoba-evidence-refs: "/home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-1:delivery:send_file:call-id-abcac0e7fa21-1, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-1:delivery:send_file:call-id-546e2b6f2f8c-2, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#turn-1:delivery:send_file:call-id-f524e9a5c067-3, /home/xiaoba/app/logs/sessions/catscompany/2026-07-29/catscompany_cc_group_grp_1012.jsonl#episode-episode:1:fc875d47:settlement-2026-07-29T09:05:07.574Z"
---

## 交付视觉重构游戏成品 (deliver-word-game-visual-reconstruction)

### Trigger
A user issues a brief continuation request (e.g., "继续") after visual reconstruction work on an educational word whack-a-mole HTML game has been completed. The trigger does not depend on a specific speaker identity.

### Action
1. Deliver the finalized HTML file of the reconstructed game to the user via `send_file`.
2. Deliver accompanying screenshot images showing the game's visual appearance to the user via `send_file`.

*Note: The exact filenames and resolutions used in the originating episode are illustrative of a single instance; do not treat them as required values.*

### Boundaries
- **Only apply** when a new task matches the same bounded scenario: delivering a completed HTML visual-reconstruction artifact for a word whack-a-mole (单词打地鼠) educational game, where the reconstruction work (e.g., restructuring holes, moles, hammers, word cards, responsive layout, word-list popup) has already been performed.
- **Do not apply** to arbitrary file deliveries, generic continuation requests, or game-development tasks lacking prior visual-reconstruction completion evidence.
- The assistant claimed gameplay mechanics were restored and passed ("完整玩法回归全部通过"), but no independent verification of that claim is present in the evidence bundle. Do not assert that the artifact was verified beyond its delivery.
- The evidence does not include the prior construction work, authorization credentials, or testing of gameplay. Do not extend to editing, building, or testing the game from scratch.

### Evidence
- Completion evidence: three `send_file` deliveries (one HTML file + two PNG screenshots) at turn 1.
- Settlement: eligibility confirmed at 2026-07-29T09:05:07.574Z without contradiction.
- User intent: a continuation request ("继续") from a user.
